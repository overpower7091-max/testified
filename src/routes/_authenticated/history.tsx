import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle, History as HistoryIcon } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "Quiz history — Testified" }] }),
  component: History,
});

function History() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) return;
      const { data } = await supabase.from("quiz_attempts")
        .select("id, is_correct, created_at, time_seconds, question:questions(question)")
        .eq("user_id", userRes.user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      setRows(data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen">
      <AppHeader back={{ to: "/home" }} />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-10 py-6">
        <div className="glass-strong rounded-3xl p-6 sm:p-8">
          <div className="text-xs uppercase tracking-[0.2em] text-primary/80 font-medium">Recent</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Quiz <span className="gradient-text">history</span></h1>
        </div>
        <div className="mt-6 glass rounded-3xl p-4">
          {loading ? (
            <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl glass-tint"><HistoryIcon className="h-6 w-6 text-primary" /></div>
              No attempts yet.
            </div>
          ) : rows.map((r) => (
            <div key={r.id} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${r.is_correct ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"}`}>
                {r.is_correct ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{r.question?.question ?? "Question"}</div>
                <div className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleString()} · {r.time_seconds}s</div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
