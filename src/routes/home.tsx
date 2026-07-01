import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Trophy, Timer, ArrowRight, GraduationCap } from "lucide-react";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Testified — Home" },
      {
        name: "description",
        content:
          "Your Testified home. Jump into MCQ practice or live mock tests in Science and Math.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const params =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const name = params.get("name") ?? "";
  const cls = params.get("class") ?? "";
  const firstName = name.split(" ")[0] || "Student";

  const tiles = [
    {
      title: "Practice MCQs",
      desc: "Topic-wise MCQs across Science and Math with instant feedback.",
      icon: BookOpen,
    },
    {
      title: "Live Mock Test",
      desc: "Timed, exam-style mocks. See your rank the moment you submit.",
      icon: Timer,
    },
    {
      title: "Your Progress",
      desc: "Track accuracy, streaks and weak topics as you grow.",
      icon: Trophy,
    },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      <video
        className="absolute inset-0 z-0 h-full w-full object-cover"
        src={VIDEO_URL}
        autoPlay
        loop
        muted
        playsInline
      />
      <div className="absolute inset-0 z-0 bg-black/40" />

      <header className="relative z-10 flex items-center justify-between px-6 py-6 lg:px-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="liquid-glass flex h-9 w-9 items-center justify-center rounded-full">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">
            testified
          </span>
        </Link>
        {cls && (
          <span className="liquid-glass rounded-full px-4 py-1.5 text-xs text-white/80">
            Class {cls}
          </span>
        )}
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-6 pb-20">
        <section className="liquid-glass-strong rounded-3xl p-8 sm:p-10">
          <div className="text-xs uppercase tracking-widest text-white/50">
            Welcome back
          </div>
          <h1 className="mt-2 text-4xl leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl">
            Hi <em className="font-serif not-italic italic text-white/80">{firstName}</em>,
            ready to practise?
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/70">
            Pick up where you left off, or take a fresh mock test to benchmark
            your speed and accuracy.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="liquid-glass-strong inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm text-white transition-transform hover:scale-105 active:scale-95">
              Start MCQ practice
              <ArrowRight className="h-4 w-4" />
            </button>
            <button className="liquid-glass inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm text-white transition-transform hover:scale-105 active:scale-95">
              Take a live mock
            </button>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {tiles.map((t) => (
            <div key={t.title} className="liquid-glass rounded-3xl p-5">
              <div className="liquid-glass flex h-9 w-9 items-center justify-center rounded-full">
                <t.icon className="h-4 w-4 text-white" />
              </div>
              <h3 className="mt-4 text-lg font-medium tracking-tight text-white">
                {t.title}
              </h3>
              <p className="mt-1 text-xs text-white/60">{t.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
