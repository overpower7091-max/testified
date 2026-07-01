import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  GraduationCap, Flame, Trophy, Target, Sparkles, BookOpen,
  History, Radio, ClipboardList, Brain, LogOut, Loader2, ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "Dashboard — Testified" }] }),
  component: Home,
});

type Profile = {
  full_name: string | null;
  class: string | null;
  xp: number;
  streak: number;
  onboarding_completed: boolean;
};

function Home() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) return;
      const [{ data: p }, { data: roles }] = await Promise.all([
        supabase.from("profiles")
          .select("full_name, class, xp, streak, onboarding_completed")
          .eq("id", userRes.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userRes.user.id),
      ]);
      if (!p?.onboarding_completed) {
        navigate({ to: "/onboarding", replace: true });
        return;
      }
      setProfile(p as Profile);
      setIsAdmin(!!roles?.some((r) => r.role === "admin"));
      setLoading(false);
    })();
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <Loader2 className="h-6 w-6 animate-spin text-white/60" />
      </div>
    );
  }

  const firstName = (profile.full_name || "Student").split(" ")[0];

  return (
    <div className="min-h-screen w-full bg-black text-white">
      {/* Ambient background */}
      <div
        className="fixed inset-0 -z-10 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 10%, hsl(0 0% 20%) 0%, transparent 40%), radial-gradient(circle at 80% 80%, hsl(0 0% 15%) 0%, transparent 40%)",
        }}
      />

      <header className="sticky top-0 z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-10">
        <div className="flex items-center gap-2">
          <div className="liquid-glass flex h-9 w-9 items-center justify-center rounded-full">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">testified</span>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link to="/home" className="liquid-glass hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white/80 sm:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
          <button onClick={signOut} className="liquid-glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white/80 hover:text-white">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 lg:px-10">
        {/* Hero */}
        <section className="liquid-glass-strong mt-4 rounded-3xl p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-white/50">Welcome back</div>
              <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">
                Hi {firstName}, ready to level up?
              </h1>
              <p className="mt-1 text-sm text-white/60">
                Class {profile.class} · WBBSE
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Stat icon={<Trophy className="h-3.5 w-3.5" />} label="Rank" value="—" />
              <Stat icon={<Sparkles className="h-3.5 w-3.5" />} label="XP" value={String(profile.xp)} />
              <Stat icon={<Flame className="h-3.5 w-3.5" />} label="Streak" value={`${profile.streak}d`} />
              <Stat icon={<Target className="h-3.5 w-3.5" />} label="Accuracy" value="—" />
            </div>
          </div>
        </section>

        {/* Action grid */}
        <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ActionCard icon={<ClipboardList className="h-5 w-5" />} title="Daily Quiz" desc="Today's challenge" soon />
          <ActionCard icon={<Radio className="h-5 w-5" />} title="Live Quiz" desc="Join scheduled quizzes" soon />
          <ActionCard icon={<BookOpen className="h-5 w-5" />} title="Subject Mock Test" desc="Pick subject → topic" soon />
          <ActionCard icon={<Brain className="h-5 w-5" />} title="AI Doubt Solver" desc="Ask, snap, solve" soon />
          <ActionCard icon={<Trophy className="h-5 w-5" />} title="Leaderboard" desc="Compete daily" soon />
          <ActionCard icon={<ClipboardList className="h-5 w-5" />} title="Practice Bank" desc="Unlimited MCQs" soon />
          <ActionCard icon={<History className="h-5 w-5" />} title="Quiz History" desc="Review every attempt" soon />
          <ActionCard icon={<GraduationCap className="h-5 w-5" />} title="Profile" desc="Badges & progress" soon />
        </section>

        {/* Recent activity placeholder */}
        <section className="mt-8">
          <h2 className="text-sm uppercase tracking-widest text-white/50">Recent activity</h2>
          <div className="liquid-glass mt-3 rounded-3xl p-6 text-sm text-white/60">
            You haven't attempted any quiz yet. Once the quiz features roll out in the next phases,
            your recent activity will appear here.
          </div>
        </section>

        <p className="mt-10 text-center text-xs text-white/40">
          Phase 1 online · Auth + profiles + role gating · Quiz features arrive in upcoming phases.
        </p>
      </main>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="liquid-glass flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-white/80">
      <span className="text-white/60">{icon}</span>
      <span className="text-white/50">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

function ActionCard({
  icon, title, desc, soon,
}: { icon: React.ReactNode; title: string; desc: string; soon?: boolean }) {
  return (
    <button
      type="button"
      className="liquid-glass group relative flex flex-col items-start gap-3 rounded-3xl p-5 text-left transition-transform hover:scale-[1.02]"
    >
      <div className="liquid-glass-strong flex h-10 w-10 items-center justify-center rounded-2xl text-white">
        {icon}
      </div>
      <div>
        <div className="text-sm font-medium text-white">{title}</div>
        <div className="mt-0.5 text-xs text-white/60">{desc}</div>
      </div>
      {soon && (
        <span className="absolute right-3 top-3 rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/60">
          Soon
        </span>
      )}
    </button>
  );
}
