import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppHeader } from "@/components/app-header";
import { supabase } from "@/integrations/supabase/client";
import {
  getTodaysLiveQuiz,
  getUpcomingLiveQuizzes,
  joinLiveQuiz,
  getLiveState,
  submitAnswer,
  getLeaderboard,
  getResults,
} from "@/lib/live-quiz.functions";
import { Latex } from "@/components/latex";
import { Loader2, Radio, Clock, Trophy, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/live")({
  head: () => ({ meta: [{ title: "Live Quiz — Testified" }] }),
  component: LiveQuizPage,
});

function LiveQuizPage() {
  const [quizId, setQuizId] = useState<string | null>(null);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const getToday = useServerFn(getTodaysLiveQuiz);
  const getUpcoming = useServerFn(getUpcomingLiveQuizzes);

  useEffect(() => {
    (async () => {
      const t = await getToday({});
      if (t.quiz) setQuizId(t.quiz.id);
      const list = await getUpcoming({});
      setUpcoming(list);
    })();
  }, []);

  if (!quizId) {
    return (
      <div className="min-h-screen">
        <AppHeader back={{ to: "/home" }} />
        <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-10 py-6">
          <div className="glass-strong rounded-3xl p-8 text-center">
            <Radio className="mx-auto h-10 w-10 text-primary" />
            <h1 className="mt-4 text-2xl font-semibold">No live quiz scheduled</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Live quizzes run daily at 9:00 PM IST (except Sunday). Check back soon!
            </p>
            <SchedulePreview upcoming={upcoming} onOpen={(id) => setQuizId(id)} />
          </div>
        </main>
      </div>
    );
  }

  return <QuizRunner quizId={quizId} onLeave={() => setQuizId(null)} upcoming={upcoming} />;
}

function SchedulePreview({ upcoming, onOpen }: { upcoming: any[]; onOpen: (id: string) => void }) {
  if (upcoming.length === 0) return null;
  return (
    <div className="mt-6 text-left">
      <h3 className="text-xs uppercase tracking-wider text-muted-foreground">Recent & upcoming</h3>
      <div className="mt-2 space-y-1.5">
        {upcoming.map((q) => (
          <button
            key={q.id}
            onClick={() => onOpen(q.id)}
            className="glass w-full rounded-xl px-3 py-2.5 flex items-center justify-between text-sm hover:text-primary"
          >
            <div>
              <div className="font-medium">{q.subjects?.name}</div>
              <div className="text-[11px] text-muted-foreground">
                {new Date(q.scheduled_at).toLocaleString()}
              </div>
            </div>
            <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${statusClass(q.status)}`}>
              {q.status.replace("_", " ")}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function statusClass(s: string) {
  if (s === "live") return "bg-red-500/20 text-red-500";
  if (s === "ended") return "bg-emerald-500/15 text-emerald-500";
  if (s === "configuration_required") return "bg-yellow-500/15 text-yellow-500";
  return "bg-primary/15 text-primary";
}

function QuizRunner({
  quizId,
  onLeave,
  upcoming,
}: {
  quizId: string;
  onLeave: () => void;
  upcoming: any[];
}) {
  const [state, setState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(Date.now());
  const skewRef = useRef(0);
  const join = useServerFn(joinLiveQuiz);
  const state$ = useServerFn(getLiveState);
  const submit = useServerFn(submitAnswer);

  const refresh = async () => {
    try {
      const s = await state$({ data: { quiz_id: quizId } });
      const serverMs = new Date(s.server_now).getTime();
      skewRef.current = serverMs - Date.now();
      setState(s);
      // Reset selection when moving to a new question
      if (s.my_answer) setSelected(s.my_answer.selected_index);
      else setSelected(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await join({ data: { quiz_id: quizId } }).catch(() => null);
      await refresh();
    })();
  }, [quizId]);

  // Realtime subscription — refetch on any live_quizzes change for this quiz
  useEffect(() => {
    const channel = supabase
      .channel(`live_quiz_${quizId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "live_quizzes", filter: `id=eq.${quizId}` },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [quizId]);

  // Client tick for countdown + periodic safety poll every 5s
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 300);
    const poll = setInterval(() => refresh(), 5000);
    return () => {
      clearInterval(t);
      clearInterval(poll);
    };
  }, [quizId]);

  const currentIndex = state?.current_index ?? 0;
  // Reset selection when question index changes
  useEffect(() => {
    if (state?.my_answer) setSelected(state.my_answer.selected_index);
    else setSelected(null);
  }, [currentIndex, state?.my_answer]);

  const remaining = useMemo(() => {
    if (!state?.current_start_at || state.status !== "live") return 0;
    const start = new Date(state.current_start_at).getTime();
    const end = start + (state.question_seconds ?? 90) * 1000;
    const serverNow = now + skewRef.current;
    return Math.max(0, Math.ceil((end - serverNow) / 1000));
  }, [state, now]);

  const handleSubmit = async (idx: number) => {
    if (submitting || state?.my_answer) return;
    setSelected(idx);
    setSubmitting(true);
    try {
      const r = await submit({ data: { quiz_id: quizId, position: currentIndex, selected_index: idx } });
      toast[r.is_correct ? "success" : "error"](r.is_correct ? "Correct!" : "Locked in");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Submit failed");
      setSelected(null);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const scheduled = new Date(state.scheduled_at).getTime();
  const secondsUntilStart = Math.max(0, Math.floor((scheduled - (now + skewRef.current)) / 1000));

  if (state.status === "configuration_required") {
    return (
      <div className="min-h-screen">
        <AppHeader back={{ to: "/home" }} />
        <main className="mx-auto max-w-2xl px-4 py-10 text-center">
          <div className="glass-strong rounded-3xl p-8">
            <h1 className="text-2xl font-semibold">Today's live quiz is unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">Please check back later.</p>
          </div>
        </main>
      </div>
    );
  }

  if (state.status === "scheduled") {
    return (
      <div className="min-h-screen">
        <AppHeader back={{ to: "/home" }} />
        <main className="mx-auto max-w-2xl px-4 py-10">
          <div className="glass-strong rounded-3xl p-8 text-center">
            <div className="text-xs uppercase tracking-widest text-primary/80">Live Quiz</div>
            <h1 className="mt-2 text-3xl font-semibold gradient-text">{state.subject}</h1>
            <div className="mt-6 text-6xl font-bold tabular-nums">
              {formatHMS(secondsUntilStart)}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Starts at {new Date(state.scheduled_at).toLocaleTimeString()} — {state.questions_total} questions,{" "}
              {state.question_seconds}s each.
            </p>
            <button
              onClick={onLeave}
              className="mt-6 text-xs text-muted-foreground hover:text-primary"
            >
              ← Back
            </button>
          </div>
          <SchedulePreview upcoming={upcoming} onOpen={() => {}} />
        </main>
      </div>
    );
  }

  if (state.status === "ended") {
    return <ResultsView quizId={quizId} onLeave={onLeave} />;
  }

  // LIVE
  const q = state.question;
  const progress = ((currentIndex + 1) / state.questions_total) * 100;
  const timeFrac = state.question_seconds > 0 ? remaining / state.question_seconds : 0;
  const answered = !!state.my_answer;

  return (
    <div className="min-h-screen">
      <AppHeader back={{ to: "/home" }} />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-6">
        <div className="glass-strong rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-red-500 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> Live · {state.subject}
              </div>
              <div className="mt-1 text-lg font-semibold">
                Question {currentIndex + 1} <span className="text-muted-foreground">of {state.questions_total}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span
                className={`text-2xl font-bold tabular-nums ${
                  remaining <= 10 ? "text-red-500" : "text-foreground"
                }`}
              >
                {remaining}s
              </span>
            </div>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full btn-gradient transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden">
            <div
              className={`h-full transition-all ${remaining <= 10 ? "bg-red-500" : "bg-primary"}`}
              style={{ width: `${timeFrac * 100}%` }}
            />
          </div>

          {q ? (
            <>
              <div className="mt-6 text-lg leading-relaxed">
                <Latex>{q.text}</Latex>
              </div>
              <div className="mt-5 space-y-2">
                {q.options.map((opt: string, idx: number) => {
                  const isSel = selected === idx;
                  return (
                    <button
                      key={idx}
                      disabled={answered || submitting}
                      onClick={() => handleSubmit(idx)}
                      className={`w-full text-left rounded-2xl px-4 py-3 transition ${
                        isSel
                          ? "btn-gradient text-white"
                          : answered
                          ? "glass opacity-60 cursor-not-allowed"
                          : "glass hover:text-primary"
                      }`}
                    >
                      <span className="text-xs font-bold mr-2 opacity-70">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <Latex>{opt}</Latex>
                    </button>
                  );
                })}
              </div>
              {answered && (
                <div className="mt-4 text-sm text-center text-muted-foreground">
                  Answer locked · waiting for next question…
                </div>
              )}
            </>
          ) : (
            <div className="mt-6 text-sm text-muted-foreground text-center py-8">
              Waiting for question…
            </div>
          )}
        </div>

        <LiveLeaderboard quizId={quizId} />
      </main>
    </div>
  );
}

function LiveLeaderboard({ quizId }: { quizId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [me, setMe] = useState<any>(null);
  const load = useServerFn(getLeaderboard);
  useEffect(() => {
    const run = () => load({ data: { quiz_id: quizId } }).then((r) => {
      setRows(r.rows.slice(0, 10));
      setMe(r.me);
    }).catch(() => null);
    run();
    const channel = supabase
      .channel(`lb_${quizId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "live_quiz_participants", filter: `live_quiz_id=eq.${quizId}` }, run)
      .subscribe();
    const iv = setInterval(run, 8000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(iv);
    };
  }, [quizId]);
  return (
    <div className="mt-6 glass rounded-3xl p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold inline-flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" /> Live leaderboard
        </h3>
        {me && <div className="text-xs text-muted-foreground">You: #{me.rank ?? "—"} · {me.score} pts</div>}
      </div>
      <div className="mt-3 space-y-1">
        {rows.length === 0 && <div className="text-xs text-muted-foreground py-4 text-center">No participants yet.</div>}
        {rows.map((r, i) => (
          <div key={r.user_id} className={`flex items-center justify-between glass rounded-xl px-3 py-2 text-sm ${me?.user_id === r.user_id ? "ring-1 ring-primary" : ""}`}>
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-xs w-6 text-primary">#{i + 1}</span>
              <span className="truncate">{r.name}</span>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-3">
              <span>{r.correct}✓</span>
              <span className="font-semibold text-foreground">{r.score}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultsView({ quizId, onLeave }: { quizId: string; onLeave: () => void }) {
  const [data, setData] = useState<any>(null);
  const load = useServerFn(getResults);
  useEffect(() => {
    load({ data: { quiz_id: quizId } }).then(setData);
  }, [quizId]);
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  const me = data.me;
  const total = data.quiz.questions_total;
  const correct = me?.correct_count ?? 0;
  const answered = me?.answered_count ?? 0;
  const notAttempted = total - answered;
  const wrong = answered - correct;
  const accuracy = answered ? Math.round((correct / answered) * 100) : 0;
  const avgSec = answered ? Math.round((me.total_time_ms ?? 0) / answered / 100) / 10 : 0;
  return (
    <div className="min-h-screen">
      <AppHeader back={{ to: "/home" }} />
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-5">
        <div className="glass-strong rounded-3xl p-6 text-center">
          <div className="text-xs uppercase tracking-widest text-primary/80">{data.quiz.subjects?.name} · Result</div>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Score" value={me?.score ?? 0} />
            <Stat label="Rank" value={me?.rank ? `#${me.rank}` : "—"} />
            <Stat label="Percentile" value={data.percentile ? `${data.percentile}%` : "—"} />
            <Stat label="Accuracy" value={`${accuracy}%`} />
          </div>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
            <div className="glass rounded-xl py-2">Correct <span className="text-emerald-500 font-semibold ml-1">{correct}</span></div>
            <div className="glass rounded-xl py-2">Wrong <span className="text-red-500 font-semibold ml-1">{wrong}</span></div>
            <div className="glass rounded-xl py-2">Not attempted <span className="font-semibold ml-1 text-foreground">{notAttempted}</span></div>
            <div className="glass rounded-xl py-2">Avg time <span className="font-semibold ml-1 text-foreground">{avgSec}s</span></div>
          </div>
        </div>

        <LiveLeaderboard quizId={quizId} />

        {data.can_review && data.review.length > 0 && (
          <div className="glass rounded-3xl p-5">
            <h3 className="text-sm font-semibold">Review</h3>
            <div className="mt-3 space-y-4">
              {data.review.map((r: any) => (
                <div key={r.position} className="glass-tint rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Q{r.position + 1} · {r.difficulty}</span>
                    {r.my_selected == null ? (
                      <span className="text-xs text-muted-foreground">Not attempted</span>
                    ) : r.is_correct ? (
                      <span className="text-xs text-emerald-500 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Correct</span>
                    ) : (
                      <span className="text-xs text-red-500 flex items-center gap-1"><XCircle className="h-3 w-3" /> Wrong</span>
                    )}
                  </div>
                  <div className="text-sm"><Latex>{r.question}</Latex></div>
                  <div className="mt-2 space-y-1">
                    {r.options.map((o: string, i: number) => {
                      const isCorrect = i === r.correct;
                      const isMine = i === r.my_selected;
                      return (
                        <div key={i} className={`rounded-lg px-3 py-2 text-sm ${
                          isCorrect ? "bg-emerald-500/15 text-emerald-500" :
                          isMine ? "bg-red-500/15 text-red-500" : "glass"
                        }`}>
                          <span className="text-xs font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                          <Latex>{o}</Latex>
                        </div>
                      );
                    })}
                  </div>
                  {r.explanation && (
                    <div className="mt-2 text-xs text-muted-foreground border-l-2 border-primary/40 pl-2">
                      <Latex>{r.explanation}</Latex>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={onLeave} className="text-xs text-muted-foreground hover:text-primary">← Back</button>
        <Link to="/leaderboard" className="ml-4 text-xs text-primary hover:underline">View overall leaderboard <ChevronRight className="inline h-3 w-3" /></Link>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="glass rounded-xl px-3 py-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function formatHMS(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
