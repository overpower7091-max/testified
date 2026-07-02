import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Trophy, Crown } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — Testified" }] }),
  component: Leaderboard,
});

function Leaderboard() {
  const [rows, setRows] = useState<any[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      setMe(userRes.user?.id ?? null);
      const myClass = userRes.user
        ? (await supabase.from("profiles").select("class").eq("id", userRes.user.id).maybeSingle()).data?.class
        : null;
      let q = supabase.from("profiles").select("id, full_name, class, xp, streak").order("xp", { ascending: false }).limit(50);
      if (myClass) q = q.eq("class", myClass);
      const { data } = await q;
      setRows(data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen">
      <AppHeader back={{ to: "/home" }} />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-6">
        <div className="glass-strong rounded-3xl p-6 sm:p-8">
          <div className="text-xs uppercase tracking-[0.2em] text-primary/80 font-medium">This week</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Class <span className="gradient-text">leaderboard</span></h1>
        </div>
        <div className="mt-6 glass rounded-3xl p-3">
          {loading ? (
            <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">No leaderboard yet.</div>
          ) : rows.map((r, i) => (
            <div key={r.id} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${r.id === me ? "glass-tint" : ""}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                i === 0 ? "bg-amber-500/20 text-amber-500" : i === 1 ? "bg-slate-400/20 text-slate-300" : i === 2 ? "bg-orange-500/20 text-orange-400" : "glass-tint text-primary"
              }`}>{i < 3 ? <Crown className="h-4 w-4" /> : i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{r.full_name || "Anonymous"} {r.id === me && <span className="text-xs text-primary">· You</span>}</div>
                <div className="text-[11px] text-muted-foreground">Class {r.class ?? "—"} · {r.streak}d streak</div>
              </div>
              <div className="inline-flex items-center gap-1 text-sm font-semibold gradient-text"><Trophy className="h-3.5 w-3.5" /> {r.xp}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
