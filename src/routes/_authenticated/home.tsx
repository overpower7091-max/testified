import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  GraduationCap, Flame, Trophy, Target, Sparkles, BookOpen,
  History, Radio, ClipboardList, Brain, LogOut, Loader2, ShieldCheck,
  ArrowRight, Calculator, Atom, FlaskConical, Leaf, TrendingUp, Clock,
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const firstName = (profile.full_name || "Student").split(" ")[0];
  const dailyGoal = 20;
  const dailyDone = 0;
  const goalPct = Math.round((dailyDone / dailyGoal) * 100);

  return (
    <div className="min-h-screen w-full text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 px-4 sm:px-6 lg:px-10 pt-4">
        <div className="glass mx-auto flex max-w-7xl items-center justify-between rounded-2xl px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl btn-gradient">
              <GraduationCap className="h-4.5 w-4.5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-base font-semibold tracking-tight">testified</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">WBBSE</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link to="/home" className="hidden sm:inline-flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-xs font-medium text-foreground/80 hover:text-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Admin
              </Link>
            )}
            <button onClick={signOut} className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-xs font-medium hover:text-primary transition-colors">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 pb-16 pt-6">
        {/* Hero */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="glass-strong lg:col-span-2 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-40" style={{ background: "radial-gradient(closest-side, hsl(217 91% 60% / 0.6), transparent)" }} />
            <div className="relative">
              <div className="text-xs uppercase tracking-[0.2em] text-primary/80 font-medium">Welcome back</div>
              <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
                Hi {firstName}, ready to <span className="gradient-text">level up?</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Class {profile.class} · WBBSE · Let's crush today's goal.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button className="btn-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium">
                  Start practising <ArrowRight className="h-4 w-4" />
                </button>
                <button className="glass inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium hover:text-primary transition-colors">
                  <Radio className="h-4 w-4 text-primary" /> Join live mock
                </button>
              </div>

              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Stat icon={<Trophy className="h-4 w-4" />} label="Rank" value="—" />
                <Stat icon={<Sparkles className="h-4 w-4" />} label="XP" value={String(profile.xp)} />
                <Stat icon={<Flame className="h-4 w-4" />} label="Streak" value={`${profile.streak}d`} />
                <Stat icon={<Target className="h-4 w-4" />} label="Accuracy" value="—" />
              </div>
            </div>
          </div>

          {/* Daily goal ring */}
          <div className="glass-strong rounded-3xl p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">Today's goal</div>
                <div className="mt-1 text-lg font-semibold">Daily practice</div>
              </div>
              <div className="rounded-full glass-tint px-2.5 py-1 text-[10px] uppercase tracking-wider text-primary font-semibold">Fresh</div>
            </div>

            <div className="mt-4 flex items-center gap-5">
              <ProgressRing value={goalPct} />
              <div className="flex-1 min-w-0">
                <div className="text-3xl font-semibold tracking-tight">{dailyDone}<span className="text-muted-foreground text-lg">/{dailyGoal}</span></div>
                <div className="text-xs text-muted-foreground mt-1">MCQs solved today</div>
                <button className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                  Start now <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
              <MiniStat icon={<Clock className="h-3.5 w-3.5" />} label="Study time" value="0m" />
              <MiniStat icon={<TrendingUp className="h-3.5 w-3.5" />} label="This week" value="0%" />
            </div>
          </div>
        </section>

        {/* Continue learning + Subjects */}
        <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="glass rounded-3xl p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your subjects</h2>
              <button className="text-xs font-medium text-primary hover:underline">View all</button>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SubjectCard icon={<Calculator className="h-5 w-5" />} name="Mathematics" chapters="0 / 12" tint="from-blue-500/20 to-blue-400/10" />
              <SubjectCard icon={<Atom className="h-5 w-5" />} name="Physical Science" chapters="0 / 10" tint="from-sky-500/20 to-cyan-400/10" />
              <SubjectCard icon={<Leaf className="h-5 w-5" />} name="Life Science" chapters="0 / 9" tint="from-emerald-500/20 to-teal-400/10" />
              <SubjectCard icon={<FlaskConical className="h-5 w-5" />} name="Chemistry" chapters="0 / 8" tint="from-indigo-500/20 to-blue-400/10" />
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <h2 className="text-lg font-semibold">Quick actions</h2>
            <div className="mt-4 space-y-2.5">
              <QuickAction icon={<ClipboardList className="h-4.5 w-4.5" />} title="Daily Quiz" desc="Today's challenge" />
              <QuickAction icon={<Radio className="h-4.5 w-4.5" />} title="Live Quiz" desc="Scheduled quizzes" />
              <QuickAction icon={<Brain className="h-4.5 w-4.5" />} title="AI Doubt Solver" desc="Ask, snap, solve" />
              <QuickAction icon={<Trophy className="h-4.5 w-4.5" />} title="Leaderboard" desc="Compete daily" />
              <QuickAction icon={<History className="h-4.5 w-4.5" />} title="Quiz History" desc="Review attempts" />
            </div>
          </div>
        </section>

        {/* Recent activity */}
        <section className="mt-6">
          <div className="glass rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent activity</h2>
              <span className="text-xs text-muted-foreground">Last 7 days</span>
            </div>
            <div className="mt-4 flex flex-col items-center justify-center gap-2 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl glass-tint">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium">No activity yet</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Once you start solving MCQs and mock tests, your recent attempts will appear here with insights.
              </p>
              <button className="mt-3 btn-gradient rounded-full px-5 py-2 text-sm font-medium">Start your first quiz</button>
            </div>
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Phase 1 online · Auth · Profiles · Roles · Quiz engine ships next.
        </p>
      </main>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass rounded-2xl px-3 py-2.5 flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl glass-tint text-primary">{icon}</div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
        <div className="text-sm font-semibold truncate">{value}</div>
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass-tint rounded-xl px-3 py-2 flex items-center justify-between">
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">{icon} {label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  const size = 96;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke="hsl(220 20% 88%)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size/2} cy={size/2} r={r}
          stroke="url(#grad)" strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(221 83% 53%)" />
            <stop offset="100%" stopColor="hsl(199 89% 60%)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-semibold gradient-text">{value}%</span>
      </div>
    </div>
  );
}

function SubjectCard({ icon, name, chapters, tint }: { icon: React.ReactNode; name: string; chapters: string; tint: string }) {
  return (
    <button className={`group text-left rounded-2xl p-4 bg-gradient-to-br ${tint} border border-white/60 hover:scale-[1.02] transition-transform`}>
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-primary shadow-sm">{icon}</div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div className="mt-4 text-sm font-semibold">{name}</div>
      <div className="text-xs text-muted-foreground">{chapters} chapters</div>
      <div className="mt-3 h-1.5 w-full rounded-full bg-white/60 overflow-hidden">
        <div className="h-full w-[8%] btn-gradient rounded-full" />
      </div>
    </button>
  );
}

function QuickAction({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <button className="w-full glass rounded-2xl px-3 py-2.5 flex items-center gap-3 hover:scale-[1.01] transition-transform text-left">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl glass-tint text-primary">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{title}</div>
        <div className="text-xs text-muted-foreground truncate">{desc}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  );
}
