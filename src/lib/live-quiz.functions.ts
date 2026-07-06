import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function getUserClass(ctx: any): Promise<string | null> {
  const { data } = await ctx.supabase.from("profiles").select("class").eq("id", ctx.userId).maybeSingle();
  return data?.class ?? null;
}

export const getTodaysLiveQuiz = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const cls = await getUserClass(context);
    if (!cls) return { quiz: null, subject: null };
    // Look for a quiz today (from 6 hours ago to end-of-day IST-ish window: next 20 hours)
    const from = new Date(Date.now() - 6 * 3600_000).toISOString();
    const to = new Date(Date.now() + 20 * 3600_000).toISOString();
    const { data } = await context.supabase
      .from("live_quizzes")
      .select("*, subjects(name, slug)")
      .eq("class_level", cls as any)
      .gte("scheduled_at", from)
      .lte("scheduled_at", to)
      .order("scheduled_at", { ascending: true })
      .limit(1);
    return { quiz: data?.[0] ?? null };
  });

export const getUpcomingLiveQuizzes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const cls = await getUserClass(context);
    if (!cls) return [];
    const { data } = await context.supabase
      .from("live_quizzes")
      .select("*, subjects(name, slug)")
      .eq("class_level", cls as any)
      .order("scheduled_at", { ascending: false })
      .limit(10);
    return data ?? [];
  });

export const joinLiveQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { quiz_id: string }) => d)
  .handler(async ({ data, context }) => {
    const cls = await getUserClass(context);
    const { data: quiz } = await context.supabase
      .from("live_quizzes")
      .select("id, class_level, status")
      .eq("id", data.quiz_id)
      .maybeSingle();
    if (!quiz) throw new Error("Quiz not found");
    if (quiz.class_level !== cls) throw new Error("Wrong class");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("live_quiz_participants")
      .insert({ live_quiz_id: quiz.id, user_id: context.userId })
      .then(() => null, () => null); // ignore unique violation
    return { ok: true };
  });

export const getLiveState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { quiz_id: string }) => d)
  .handler(async ({ data, context }) => {
    const cls = await getUserClass(context);
    const { data: quiz } = await context.supabase
      .from("live_quizzes")
      .select("*, subjects(name, slug)")
      .eq("id", data.quiz_id)
      .maybeSingle();
    if (!quiz) throw new Error("Quiz not found");
    if (quiz.class_level !== cls) throw new Error("Wrong class");

    const serverNow = new Date().toISOString();
    const base = {
      quiz_id: quiz.id,
      status: quiz.status,
      subject: (quiz as any).subjects?.name ?? null,
      questions_total: quiz.questions_total,
      question_seconds: quiz.question_seconds,
      current_index: quiz.current_question_index,
      current_start_at: quiz.current_question_start_at,
      scheduled_at: quiz.scheduled_at,
      server_now: serverNow,
    };

    if (quiz.status === "scheduled" || quiz.status === "configuration_required") {
      return { ...base, question: null, my_answer: null };
    }

    if (quiz.status === "live" || quiz.status === "ended") {
      // Return current question (or last question if ended)
      const pos = quiz.status === "ended" ? quiz.questions_total - 1 : quiz.current_question_index;
      const { data: lqq } = await context.supabase
        .from("live_quiz_questions")
        .select("position, difficulty, topic_id, questions(id, question, options)")
        .eq("live_quiz_id", quiz.id)
        .eq("position", pos)
        .maybeSingle();
      const { data: mine } = await context.supabase
        .from("live_quiz_answers")
        .select("position, selected_index, is_correct")
        .eq("live_quiz_id", quiz.id)
        .eq("user_id", context.userId)
        .eq("position", pos)
        .maybeSingle();
      return {
        ...base,
        question: lqq
          ? {
              position: lqq.position,
              difficulty: lqq.difficulty,
              text: (lqq as any).questions?.question ?? "",
              options: (lqq as any).questions?.options ?? [],
            }
          : null,
        my_answer: mine ?? null,
      };
    }
    return { ...base, question: null, my_answer: null };
  });

export const submitAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { quiz_id: string; position: number; selected_index: number }) => d)
  .handler(async ({ data, context }) => {
    const cls = await getUserClass(context);
    const { data: quiz } = await context.supabase
      .from("live_quizzes")
      .select("id, class_level, status, question_seconds, current_question_index, current_question_start_at")
      .eq("id", data.quiz_id)
      .maybeSingle();
    if (!quiz) throw new Error("Quiz not found");
    if (quiz.class_level !== cls) throw new Error("Wrong class");
    if (quiz.status !== "live") throw new Error("Quiz not live");
    if (data.position !== quiz.current_question_index) throw new Error("Wrong question");
    const startedAt = new Date(quiz.current_question_start_at as string).getTime();
    const elapsed = Date.now() - startedAt;
    if (elapsed > quiz.question_seconds * 1000 + 2000) throw new Error("Time expired");

    // Look up correct answer
    const { data: lqq } = await context.supabase
      .from("live_quiz_questions")
      .select("question_id, questions(correct_answer)")
      .eq("live_quiz_id", quiz.id)
      .eq("position", data.position)
      .maybeSingle();
    if (!lqq) throw new Error("Question missing");
    const correctRaw = (lqq as any).questions?.correct_answer;
    const correctIdx = typeof correctRaw === "number" ? correctRaw : Number(correctRaw);
    const isCorrect = data.selected_index === correctIdx;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("live_quiz_answers").insert({
      live_quiz_id: quiz.id,
      user_id: context.userId,
      position: data.position,
      question_id: lqq.question_id,
      selected_index: data.selected_index,
      is_correct: isCorrect,
      response_ms: elapsed,
    });
    if (error) {
      // Unique violation = already answered
      if (String(error.message).toLowerCase().includes("duplicate")) throw new Error("Already answered");
      throw error;
    }

    // Update participant aggregates
    const { data: part } = await supabaseAdmin
      .from("live_quiz_participants")
      .select("id, score, correct_count, answered_count, total_time_ms")
      .eq("live_quiz_id", quiz.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (part) {
      await supabaseAdmin
        .from("live_quiz_participants")
        .update({
          score: part.score + (isCorrect ? 10 : 0),
          correct_count: part.correct_count + (isCorrect ? 1 : 0),
          answered_count: part.answered_count + 1,
          total_time_ms: part.total_time_ms + elapsed,
          last_submit_at: new Date().toISOString(),
        })
        .eq("id", part.id);
    } else {
      await supabaseAdmin.from("live_quiz_participants").insert({
        live_quiz_id: quiz.id,
        user_id: context.userId,
        score: isCorrect ? 10 : 0,
        correct_count: isCorrect ? 1 : 0,
        answered_count: 1,
        total_time_ms: elapsed,
        last_submit_at: new Date().toISOString(),
      });
    }
    return { ok: true, is_correct: isCorrect };
  });

export const getLeaderboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { quiz_id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: parts } = await context.supabase
      .from("live_quiz_participants")
      .select("user_id, score, correct_count, answered_count, total_time_ms, rank")
      .eq("live_quiz_id", data.quiz_id)
      .order("score", { ascending: false })
      .order("correct_count", { ascending: false })
      .order("total_time_ms", { ascending: true })
      .limit(100);
    if (!parts || parts.length === 0) return { rows: [], me: null };
    const ids = parts.map((p) => p.user_id);
    const { data: profs } = await context.supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", ids);
    const byId: Record<string, any> = {};
    (profs ?? []).forEach((p) => (byId[p.id] = p));
    const rows = parts.map((p, i) => ({
      rank: p.rank ?? i + 1,
      user_id: p.user_id,
      name: byId[p.user_id]?.full_name ?? "Student",
      avatar_url: byId[p.user_id]?.avatar_url ?? null,
      score: p.score,
      correct: p.correct_count,
      answered: p.answered_count,
      total_time_ms: p.total_time_ms,
    }));
    const me = rows.find((r) => r.user_id === context.userId) ?? null;
    return { rows, me };
  });

export const getResults = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { quiz_id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: quiz } = await context.supabase
      .from("live_quizzes")
      .select("*, subjects(name)")
      .eq("id", data.quiz_id)
      .maybeSingle();
    if (!quiz) throw new Error("Quiz not found");
    const canReview = quiz.status === "ended";
    const { data: me } = await context.supabase
      .from("live_quiz_participants")
      .select("*")
      .eq("live_quiz_id", quiz.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    const { data: answers } = await context.supabase
      .from("live_quiz_answers")
      .select("position, selected_index, is_correct, response_ms")
      .eq("live_quiz_id", quiz.id)
      .eq("user_id", context.userId)
      .order("position");

    let review: any[] = [];
    if (canReview) {
      const { data: lqqs } = await context.supabase
        .from("live_quiz_questions")
        .select("position, difficulty, topic_id, questions(question, options, correct_answer, explanation)")
        .eq("live_quiz_id", quiz.id)
        .order("position");
      const ansByPos: Record<number, any> = {};
      (answers ?? []).forEach((a) => (ansByPos[a.position] = a));
      review = (lqqs ?? []).map((q: any) => ({
        position: q.position,
        difficulty: q.difficulty,
        question: q.questions?.question ?? "",
        options: q.questions?.options ?? [],
        correct: Number(q.questions?.correct_answer ?? 0),
        explanation: q.questions?.explanation ?? "",
        my_selected: ansByPos[q.position]?.selected_index ?? null,
        is_correct: ansByPos[q.position]?.is_correct ?? false,
      }));
    }

    const { count: totalParticipants } = await context.supabase
      .from("live_quiz_participants")
      .select("*", { count: "exact", head: true })
      .eq("live_quiz_id", quiz.id);

    const percentile =
      me && me.rank && totalParticipants
        ? Math.max(1, Math.round(((totalParticipants - me.rank + 1) / totalParticipants) * 100))
        : null;

    return {
      quiz,
      me,
      answers: answers ?? [],
      review,
      percentile,
      total_participants: totalParticipants ?? 0,
      can_review: canReview,
    };
  });

export const getMyLiveQuizProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const cls = await getUserClass(context);
    const { data: streak } = await context.supabase
      .from("live_quiz_streaks")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    const { data: xp } = await context.supabase
      .from("xp_history")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    const { data: badges } = await context.supabase
      .from("user_achievements")
      .select("awarded_at, achievements(code, name, description, icon)")
      .eq("user_id", context.userId)
      .order("awarded_at", { ascending: false });
    const { data: history } = await context.supabase
      .from("live_quiz_participants")
      .select("live_quiz_id, score, correct_count, answered_count, rank, live_quizzes(scheduled_at, class_level, questions_total, subjects(name))")
      .eq("user_id", context.userId)
      .order("live_quiz_id", { ascending: false })
      .limit(20);
    return { class_level: cls, streak, xp: xp ?? [], badges: badges ?? [], history: history ?? [] };
  });
