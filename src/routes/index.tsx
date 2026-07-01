import { createFileRoute } from "@tanstack/react-router";
import {
  Sparkles,
  Download,
  Wand2,
  BookOpen,
  ArrowRight,
  Twitter,
  Linkedin,
  Instagram,
  Menu,
  Plus,
} from "lucide-react";
import heroFlowers from "@/assets/hero-flowers.png";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bloom — Innovating the spirit of bloom AI" },
      {
        name: "description",
        content:
          "Bloom is an AI-powered plant and floral design platform for artistic gallery, AI generation, and 3D structures.",
      },
      { property: "og:title", content: "Bloom — Innovating the spirit of bloom AI" },
      {
        property: "og:description",
        content:
          "AI-powered plant and floral design — artistic gallery, generative botanicals, 3D structures.",
      },
    ],
  }),
  component: BloomHero,
});

function BloomHero() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      {/* Video background */}
      <video
        className="absolute inset-0 z-0 h-full w-full object-cover"
        src={VIDEO_URL}
        autoPlay
        loop
        muted
        playsInline
      />
      <div className="absolute inset-0 z-0 bg-black/25" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen w-full flex-col lg:flex-row">
        {/* LEFT PANEL */}
        <section className="relative flex w-full flex-col lg:w-[52%]">
          <div className="liquid-glass-strong absolute inset-4 rounded-3xl lg:inset-6" />

          <div className="relative flex min-h-screen flex-col p-8 lg:p-12">
            {/* Nav */}
            <nav className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src="/logo.png"
                  alt="Bloom logo"
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
                <span className="text-2xl font-semibold tracking-tighter text-white">
                  bloom
                </span>
              </div>
              <button className="liquid-glass flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/80 transition-transform hover:scale-105 active:scale-95">
                <Menu className="h-4 w-4" />
                Menu
              </button>
            </nav>

            {/* Hero center */}
            <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
              <img
                src="/logo.png"
                alt=""
                width={80}
                height={80}
                className="mb-8 h-20 w-20 opacity-90"
              />
              <h1 className="max-w-2xl text-6xl leading-[1.02] tracking-[-0.05em] text-white lg:text-7xl">
                Innovating the{" "}
                <em className="font-serif not-italic italic text-white/80">
                  spirit of bloom
                </em>{" "}
                AI
              </h1>

              <button className="liquid-glass-strong mt-10 flex items-center gap-3 rounded-full py-2 pl-6 pr-2 text-sm text-white transition-transform hover:scale-105 active:scale-95">
                <span>Explore Now</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
                  <Download className="h-3.5 w-3.5" />
                </span>
              </button>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                {["Artistic Gallery", "AI Generation", "3D Structures"].map((p) => (
                  <span
                    key={p}
                    className="liquid-glass rounded-full px-4 py-1.5 text-xs text-white/80"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom quote */}
            <div className="mx-auto max-w-lg text-center">
              <div className="text-xs uppercase tracking-widest text-white/50">
                VISIONARY DESIGN
              </div>
              <p className="mt-4 text-lg text-white/90">
                <span className="font-display">"We </span>
                <span className="font-serif italic text-white/80">imagined</span>
                <span className="font-display"> a </span>
                <span className="font-serif italic text-white/80">realm</span>
                <span className="font-display"> with no </span>
                <span className="font-serif italic text-white/80">ending.</span>
                <span className="font-display">"</span>
              </p>
              <div className="mt-4 flex items-center justify-center gap-3 text-xs tracking-widest text-white/50">
                <span className="h-px w-10 bg-white/30" />
                MARCUS AURELIO
                <span className="h-px w-10 bg-white/30" />
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT PANEL — desktop only */}
        <aside className="relative hidden w-[48%] flex-col p-6 lg:flex">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <div className="liquid-glass flex items-center gap-3 rounded-full px-4 py-2">
              <a
                href="#"
                aria-label="Twitter"
                className="text-white transition-colors hover:text-white/80"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="text-white transition-colors hover:text-white/80"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="text-white transition-colors hover:text-white/80"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <span className="mx-1 h-4 w-px bg-white/20" />
              <ArrowRight className="h-4 w-4 text-white/70" />
            </div>

            <button
              aria-label="Account"
              className="liquid-glass flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95"
            >
              <Sparkles className="h-4 w-4 text-white" />
            </button>
          </div>

          {/* Community card */}
          <div className="mt-6 self-end">
            <div className="liquid-glass w-56 rounded-2xl p-4">
              <div className="text-sm text-white">Enter our ecosystem</div>
              <p className="mt-1 text-xs leading-relaxed text-white/60">
                Join a growing community of botanical designers shaping the future of
                floral AI.
              </p>
            </div>
          </div>

          {/* Bottom feature section */}
          <div className="mt-auto">
            <div className="liquid-glass rounded-[2.5rem] p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="liquid-glass rounded-3xl p-5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                    <Wand2 className="h-4 w-4 text-white" />
                  </div>
                  <div className="mt-4 text-sm text-white">Processing</div>
                  <p className="mt-1 text-xs text-white/60">
                    Real-time generative rendering of botanical forms.
                  </p>
                </div>
                <div className="liquid-glass rounded-3xl p-5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                    <BookOpen className="h-4 w-4 text-white" />
                  </div>
                  <div className="mt-4 text-sm text-white">Growth Archive</div>
                  <p className="mt-1 text-xs text-white/60">
                    A living library of every species, mood, and season.
                  </p>
                </div>
              </div>

              <div className="liquid-glass mt-3 flex items-center gap-4 rounded-3xl p-3">
                <img
                  src={heroFlowers}
                  alt="Bloom sculpting"
                  width={96}
                  height={64}
                  className="h-16 w-24 shrink-0 rounded-2xl object-cover"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-white">
                    Advanced Plant Sculpting
                  </div>
                  <p className="truncate text-xs text-white/60">
                    Shape petals, stems, and light with intuitive control.
                  </p>
                </div>
                <button
                  aria-label="Add"
                  className="liquid-glass flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95"
                >
                  <Plus className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
