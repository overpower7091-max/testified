// Server-only scheduler for the Live Quiz system.
// Executed every minute by /api/public/hooks/live-quiz-tick and can be
// triggered on-demand by admin.

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SUBJECT_SLUG_BY_DOW_IST: Record<number, string | null> = {
  // Sunday=0 in JS getDay(), but we compute IST day-of-week separately.
  0: null,               // Sunday: no quiz
  1: "mathematics",      // Monday
  2: "physical-science", // Tuesday
  3: "life-science",     // Wednesday
  4: "mathematics",      // Thursday
  5: "physical-science", // Friday
  6: "life-science",     // Saturday
};

const IST_OFFSET_MIN = 330; // UTC+5:30

function nowIST(): Date {
  const d = new Date();
  return new Date(d.getTime() + IST_OFFSET_MIN * 60_000);
}

function istDowAndDate(): { dow: number; y: number; m: number; d: number } {
  const t = nowIST();
  return { dow: t.getUTCDay(), y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate() };
}

function todayIst21UTC(): Date {
  const { y, m, d } = istDowAndDate();
  // 21:00 IST = 15:30 UTC of the same UTC calendar day the IST date maps to
  const utcMs = Date.UTC(y, m, d, 21 - 5, 0 - 30, 0);
  return new Date(utcMs);
}

const CLASS_LEVELS = ["6", "7", "8", "9", "10", "11", "12"] as const;

type BluePrintRow = {
  id: string;
  class_level: string;
  subject_id: string;
  questions_total: number;
  question_seconds: number;
  difficulty_easy: number;
  difficulty_medium: number;
  difficulty_hard: number;
  lookback_weeks: number;
  is_active: boolean;
};

async function ensureScheduledForToday() {
  const { dow } = istDowAndDate();
  const slug = SUBJECT_SLUG_BY_DOW_IST[dow];
  if (!slug) return;
  const scheduledAt = todayIst21UTC();

  // subject rows for the slug (one per class)
  const { data: subjects } = await supabaseAdmin
    .from("subjects")
    .select("id, class_id, slug, classes(level)")
    .eq("slug", slug);
  if (!subjects) return;

  for (const level of CLASS_LEVELS) {
    const subject = subjects.find((s: any) => s.classes?.level === level);
    if (!subject) continue;
    const { data: existing } = await supabaseAdmin
      .from("live_quizzes")
      .select("id, status")
      .eq("class_level", level as any)
      .eq("subject_id", subject.id)
      .eq("scheduled_at", scheduledAt.toISOString())
      .maybeSingle();
    if (existing) continue;
    // Look up active blueprint
    const { data: bp } = await supabaseAdmin
      .from("live_quiz_blueprints")
      .select("*")
      .eq("class_level", level as any)
      .eq("subject_id", subject.id)
      .eq("is_active", true)
      .maybeSingle();
    await supabaseAdmin.from("live_quizzes").insert({
      class_level: level as any,
      subject_id: subject.id,
      scheduled_at: scheduledAt.toISOString(),
      status: bp ? "scheduled" : "configuration_required",
      questions_total: bp?.questions_total ?? 10,
      question_seconds: bp?.question_seconds ?? 90,
    });
  }
}

async function pickQuestionsForBlueprint(bp: BluePrintRow) {
  // Fetch topics + counts
  const { data: bpTopics } = await supabaseAdmin
    .from("live_quiz_blueprint_topics")
    .select("topic_id, question_count")
    .eq("blueprint_id", bp.id);
  if (!bpTopics || bpTopics.length === 0) return null;

  // Recent lookback question ids for this class+subject
  const lookbackDays = (bp.lookback_weeks ?? 6) * 7;
  const since = new Date(Date.now() - lookbackDays * 24 * 3600 * 1000).toISOString();
  const { data: recentQuizzes } = await supabaseAdmin
    .from("live_quizzes")
    .select("id")
    .eq("class_level", bp.class_level as any)
    .eq("subject_id", bp.subject_id)
    .gte("scheduled_at", since);
  const recentIds = (recentQuizzes ?? []).map((q: any) => q.id);
  let excludeQIds: string[] = [];
  if (recentIds.length) {
    const { data: recentQs } = await supabaseAdmin
      .from("live_quiz_questions")
      .select("question_id")
      .in("live_quiz_id", recentIds);
    excludeQIds = (recentQs ?? []).map((r: any) => r.question_id);
  }

  // For each topic, gather candidate questions per difficulty
  // Strategy: pick per topic first (guarantees topic count), then adjust difficulty by post-filter.
  const targetByDiff: Record<string, number> = {
    easy: bp.difficulty_easy,
    medium: bp.difficulty_medium,
    hard: bp.difficulty_hard,
  };
  const chosen: { question_id: string; topic_id: string; difficulty: string }[] = [];
  const usedIds = new Set(excludeQIds);
  const remainingByDiff = { ...targetByDiff };

  // Load candidate pool per topic
  const topicPools: Record<string, { id: string; difficulty: string }[]> = {};
  for (const t of bpTopics) {
    const { data: qbs } = await supabaseAdmin
      .from("question_banks")
      .select("id")
      .eq("topic_id", t.topic_id);
    const bankIds = (qbs ?? []).map((b: any) => b.id);
    if (!bankIds.length) {
      topicPools[t.topic_id] = [];
      continue;
    }
    const { data: qs } = await supabaseAdmin
      .from("questions")
      .select("id, difficulty")
      .in("question_bank_id", bankIds);
    topicPools[t.topic_id] = (qs ?? []).filter((q: any) => !usedIds.has(q.id));
  }

  // Shuffle helper
  const shuffle = <T,>(arr: T[]) => arr.map((v) => [Math.random(), v] as const).sort((a, b) => a[0] - b[0]).map(([, v]) => v);

  for (const t of bpTopics) {
    const pool = shuffle(topicPools[t.topic_id]);
    let need = t.question_count;
    // Prefer difficulty that still has remaining slots
    const order = shuffle(["easy", "medium", "hard"]);
    // First pass: try to satisfy difficulty distribution
    for (const diff of order) {
      if (need === 0) break;
      if (remainingByDiff[diff] <= 0) continue;
      for (const q of pool) {
        if (need === 0 || remainingByDiff[diff] <= 0) break;
        if (usedIds.has(q.id)) continue;
        if (q.difficulty !== diff) continue;
        chosen.push({ question_id: q.id, topic_id: t.topic_id, difficulty: q.difficulty });
        usedIds.add(q.id);
        remainingByDiff[diff]--;
        need--;
      }
    }
    // Second pass: fill remaining topic count with any leftover difficulty
    if (need > 0) {
      for (const q of pool) {
        if (need === 0) break;
        if (usedIds.has(q.id)) continue;
        chosen.push({ question_id: q.id, topic_id: t.topic_id, difficulty: q.difficulty });
        usedIds.add(q.id);
        // decrement whatever bucket still has room, else ignore
        if (remainingByDiff[q.difficulty] > 0) remainingByDiff[q.difficulty]--;
        need--;
      }
    }
  }

  if (chosen.length < bp.questions_total) {
    // Not enough questions in question bank — allow shorter quiz rather than blocking
    if (chosen.length === 0) return null;
  }
  return shuffle(chosen).slice(0, bp.questions_total);
}

async function generateQuizIfNeeded(quiz: any) {
  if (quiz.status !== "scheduled" && quiz.status !== "configuration_required") return;
  // Only generate within 15 minutes of start
  const startsInMs = new Date(quiz.scheduled_at).getTime() - Date.now();
  if (startsInMs > 15 * 60_000) return;

  const { data: bp } = await supabaseAdmin
    .from("live_quiz_blueprints")
    .select("*")
    .eq("class_level", quiz.class_level)
    .eq("subject_id", quiz.subject_id)
    .eq("is_active", true)
    .maybeSingle();
  if (!bp) {
    await supabaseAdmin.from("live_quizzes").update({ status: "configuration_required" }).eq("id", quiz.id);
    return;
  }

  // Snapshot version
  const { data: bpTopics } = await supabaseAdmin
    .from("live_quiz_blueprint_topics")
    .select("topic_id, question_count")
    .eq("blueprint_id", bp.id);
  const { data: version } = await supabaseAdmin
    .from("live_quiz_blueprint_versions")
    .insert({
      blueprint_id: bp.id,
      class_level: bp.class_level,
      subject_id: bp.subject_id,
      snapshot: { ...bp, topics: bpTopics ?? [] } as any,
    })
    .select("id")
    .single();

  const chosen = await pickQuestionsForBlueprint(bp as BluePrintRow);
  if (!chosen || chosen.length === 0) {
    await supabaseAdmin.from("live_quizzes").update({ status: "configuration_required" }).eq("id", quiz.id);
    return;
  }

  // Insert live_quiz_questions
  const rows = chosen.map((q, idx) => ({
    live_quiz_id: quiz.id,
    position: idx,
    question_id: q.question_id,
    topic_id: q.topic_id,
    difficulty: q.difficulty as any,
  }));
  await supabaseAdmin.from("live_quiz_questions").delete().eq("live_quiz_id", quiz.id);
  await supabaseAdmin.from("live_quiz_questions").insert(rows);
  await supabaseAdmin
    .from("live_quizzes")
    .update({
      status: "scheduled",
      questions_total: chosen.length,
      question_seconds: bp.question_seconds,
      blueprint_version_id: version?.id ?? null,
    })
    .eq("id", quiz.id);
}

async function tickQuiz(quiz: any) {
  const now = Date.now();
  const startTs = new Date(quiz.scheduled_at).getTime();

  // Start if due
  if (quiz.status === "scheduled" && now >= startTs) {
    // Confirm questions exist
    const { count } = await supabaseAdmin
      .from("live_quiz_questions")
      .select("*", { count: "exact", head: true })
      .eq("live_quiz_id", quiz.id);
    if (!count || count === 0) {
      // Attempt last-second generation
      await generateQuizIfNeeded(quiz);
      const { count: c2 } = await supabaseAdmin
        .from("live_quiz_questions")
        .select("*", { count: "exact", head: true })
        .eq("live_quiz_id", quiz.id);
      if (!c2) {
        await supabaseAdmin.from("live_quizzes").update({ status: "configuration_required" }).eq("id", quiz.id);
        return;
      }
    }
    await supabaseAdmin
      .from("live_quizzes")
      .update({
        status: "live",
        started_at: new Date().toISOString(),
        current_question_index: 0,
        current_question_start_at: new Date().toISOString(),
      })
      .eq("id", quiz.id);
    return;
  }

  if (quiz.status === "live") {
    const startedAt = new Date(quiz.current_question_start_at ?? quiz.started_at ?? quiz.scheduled_at).getTime();
    const dur = (quiz.question_seconds ?? 90) * 1000;
    if (now < startedAt + dur) return;
    // Advance
    const nextIdx = quiz.current_question_index + 1;
    if (nextIdx >= quiz.questions_total) {
      await finalizeQuiz(quiz);
    } else {
      await supabaseAdmin
        .from("live_quizzes")
        .update({
          current_question_index: nextIdx,
          current_question_start_at: new Date().toISOString(),
        })
        .eq("id", quiz.id);
    }
  }
}

async function finalizeQuiz(quiz: any) {
  // Compute ranks and awards
  const { data: parts } = await supabaseAdmin
    .from("live_quiz_participants")
    .select("id, user_id, score, correct_count, total_time_ms")
    .eq("live_quiz_id", quiz.id)
    .order("score", { ascending: false })
    .order("correct_count", { ascending: false })
    .order("total_time_ms", { ascending: true })
    .order("joined_at", { ascending: true });

  const ranked = parts ?? [];
  for (let i = 0; i < ranked.length; i++) {
    const rank = i + 1;
    const p = ranked[i];
    await supabaseAdmin
      .from("live_quiz_participants")
      .update({ rank, finished_at: new Date().toISOString() })
      .eq("id", p.id);
    // XP grant
    const xpBase = 20; // participation
    let bonus = 0;
    if (rank === 1) bonus = 100;
    else if (rank <= 10) bonus = 50;
    else if (rank <= 100) bonus = 20;
    const amount = xpBase + bonus;
    await supabaseAdmin.from("xp_history").insert({
      user_id: p.user_id,
      source: rank === 1 ? "live_quiz_champion" : rank <= 10 ? "live_quiz_top10" : rank <= 100 ? "live_quiz_top100" : "live_quiz_participation",
      amount,
      ref_id: quiz.id,
    });
    // Increment profile xp
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("xp")
      .eq("id", p.user_id)
      .maybeSingle();
    await supabaseAdmin
      .from("profiles")
      .update({ xp: (prof?.xp ?? 0) + amount })
      .eq("id", p.user_id);

    // Achievements
    const badgeCodes: string[] = [];
    if (rank === 1) badgeCodes.push("champion");
    if (rank <= 10) badgeCodes.push("top10");
    if (rank <= 100) badgeCodes.push("top100");
    if (p.correct_count === quiz.questions_total) badgeCodes.push("perfect_score");
    if (badgeCodes.length) {
      const { data: catalog } = await supabaseAdmin
        .from("achievements")
        .select("id, code")
        .in("code", badgeCodes);
      for (const a of catalog ?? []) {
        await supabaseAdmin
          .from("user_achievements")
          .insert({ user_id: p.user_id, achievement_id: a.id, ref_id: quiz.id })
          .then(() => null, () => null);
      }
    }

    // Streaks
    const today = new Date().toISOString().slice(0, 10);
    const { data: streak } = await supabaseAdmin
      .from("live_quiz_streaks")
      .select("*")
      .eq("user_id", p.user_id)
      .eq("class_level", quiz.class_level)
      .maybeSingle();
    if (!streak) {
      await supabaseAdmin.from("live_quiz_streaks").insert({
        user_id: p.user_id,
        class_level: quiz.class_level,
        current_streak: 1,
        longest_streak: 1,
        total_attempted: 1,
        last_participated_on: today,
      });
    } else {
      const last = streak.last_participated_on;
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const newCurrent = last === today ? streak.current_streak : last === yesterday ? streak.current_streak + 1 : 1;
      await supabaseAdmin
        .from("live_quiz_streaks")
        .update({
          current_streak: newCurrent,
          longest_streak: Math.max(streak.longest_streak, newCurrent),
          total_attempted: streak.total_attempted + 1,
          last_participated_on: today,
        })
        .eq("id", streak.id);
    }
  }

  await supabaseAdmin
    .from("live_quizzes")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", quiz.id);
}

export async function runLiveQuizTick() {
  await ensureScheduledForToday();
  // Load all quizzes needing attention (scheduled soon, live, or config_required today)
  const horizonEnd = new Date(Date.now() + 20 * 60_000).toISOString();
  const { data: quizzes } = await supabaseAdmin
    .from("live_quizzes")
    .select("*")
    .in("status", ["scheduled", "configuration_required", "live"])
    .lte("scheduled_at", horizonEnd);
  for (const q of quizzes ?? []) {
    try {
      await generateQuizIfNeeded(q);
      // Re-read row after possible status change
      const { data: fresh } = await supabaseAdmin.from("live_quizzes").select("*").eq("id", q.id).single();
      if (fresh) await tickQuiz(fresh);
    } catch (e) {
      console.error("live-quiz-tick error", q.id, e);
    }
  }
  return { ok: true, processed: (quizzes ?? []).length };
}
