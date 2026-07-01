import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, ArrowRight, GraduationCap, Check } from "lucide-react";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Testified — Quality MCQ Practice & Live Mock Tests" },
      {
        name: "description",
        content:
          "Testified helps students in classes 6–12 master Science and Math with quality MCQs and live mock tests.",
      },
      { property: "og:title", content: "Testified — MCQ Practice for Science & Math" },
      {
        property: "og:description",
        content:
          "Sign up free. Practice MCQs and take live mock tests in Science and Math, classes 6 to 12.",
      },
    ],
  }),
  component: TestifiedLanding,
});

type Step = "auth" | "details" | "done";

function TestifiedLanding() {
  const [step, setStep] = useState<Step>("auth");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [selectedClass, setSelectedClass] = useState<number | null>(null);

  const classes = [6, 7, 8, 9, 10, 11, 12];

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
      <div className="absolute inset-0 z-0 bg-black/30" />

      {/* Top brand bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6 lg:px-12">
        <div className="flex items-center gap-2">
          <div className="liquid-glass flex h-9 w-9 items-center justify-center rounded-full">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">
            testified
          </span>
        </div>
        <span className="liquid-glass hidden rounded-full px-4 py-1.5 text-xs text-white/80 sm:inline-flex">
          MCQs · Live Mock Tests
        </span>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex min-h-[calc(100vh-88px)] items-center justify-center px-6 pb-16">
        <div className="grid w-full max-w-5xl grid-cols-1 items-center gap-10 lg:grid-cols-2">
          {/* Left: pitch */}
          <div className="hidden text-left lg:block">
            <h1 className="text-5xl leading-[1.05] tracking-[-0.04em] text-white lg:text-6xl">
              Master{" "}
              <em className="font-serif not-italic italic text-white/80">Science</em>{" "}
              &{" "}
              <em className="font-serif not-italic italic text-white/80">Math</em>{" "}
              one MCQ at a time.
            </h1>
            <p className="mt-5 max-w-md text-base text-white/70">
              Quality question banks and live mock tests built for students of
              classes 6 to 12.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Topic-wise MCQs", "Live Mock Tests", "Instant Analytics"].map(
                (p) => (
                  <span
                    key={p}
                    className="liquid-glass rounded-full px-3 py-1 text-xs text-white/80"
                  >
                    {p}
                  </span>
                ),
              )}
            </div>
          </div>

          {/* Right: auth card */}
          <div className="mx-auto w-full max-w-md">
            <div className="liquid-glass-strong rounded-3xl p-6 sm:p-8">
              {step === "auth" && (
                <>
                  <h2 className="text-2xl font-medium tracking-tight text-white">
                    Get started
                  </h2>
                  <p className="mt-1 text-sm text-white/60">
                    Sign in or create your free Testified account.
                  </p>

                  <button
                    onClick={() => setStep("details")}
                    className="liquid-glass mt-6 flex w-full items-center justify-center gap-3 rounded-full py-3 text-sm text-white transition-transform hover:scale-[1.02] active:scale-95"
                  >
                    <GoogleGlyph />
                    Continue with Google
                  </button>

                  <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-widest text-white/40">
                    <span className="h-px flex-1 bg-white/15" />
                    or
                    <span className="h-px flex-1 bg-white/15" />
                  </div>

                  <label className="block text-xs text-white/60">Email</label>
                  <div className="liquid-glass mt-2 flex items-center gap-2 rounded-full px-4 py-2.5">
                    <Mail className="h-4 w-4 text-white/60" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@school.com"
                      className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={() => setStep("details")}
                    disabled={!email.includes("@")}
                    className="liquid-glass-strong mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm text-white transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
                  >
                    Continue with email
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <p className="mt-5 text-center text-[11px] text-white/40">
                    By continuing you agree to our Terms & Privacy Policy.
                  </p>
                </>
              )}

              {step === "details" && (
                <>
                  <div className="text-xs uppercase tracking-widest text-white/50">
                    Step 2 of 2
                  </div>
                  <h2 className="mt-2 text-2xl font-medium tracking-tight text-white">
                    Finish your profile
                  </h2>
                  <p className="mt-1 text-sm text-white/60">
                    Tell us your name and class to personalise your MCQs.
                  </p>

                  <label className="mt-6 block text-xs text-white/60">
                    Full name
                  </label>
                  <div className="liquid-glass mt-2 rounded-full px-4 py-2.5">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ananya Sharma"
                      className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                    />
                  </div>

                  <label className="mt-5 block text-xs text-white/60">
                    Select your class
                  </label>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {classes.map((c) => {
                      const active = selectedClass === c;
                      return (
                        <button
                          key={c}
                          onClick={() => setSelectedClass(c)}
                          className={`${
                            active ? "liquid-glass-strong" : "liquid-glass"
                          } rounded-2xl py-3 text-sm text-white transition-transform hover:scale-105 active:scale-95`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setStep("done")}
                    disabled={!name.trim() || !selectedClass}
                    className="liquid-glass-strong mt-6 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm text-white transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
                  >
                    Finish signup
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setStep("auth")}
                    className="mt-3 w-full text-center text-xs text-white/50 hover:text-white/80"
                  >
                    ← Back
                  </button>
                </>
              )}

              {step === "done" && (
                <div className="py-4 text-center">
                  <div className="liquid-glass mx-auto flex h-14 w-14 items-center justify-center rounded-full">
                    <Check className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="mt-5 text-2xl font-medium tracking-tight text-white">
                    Welcome{name ? `, ${name.split(" ")[0]}` : ""}.
                  </h2>
                  <p className="mt-2 text-sm text-white/60">
                    Class {selectedClass} MCQs in Science and Math are ready for
                    you.
                  </p>
                  <button className="liquid-glass-strong mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm text-white transition-transform hover:scale-105 active:scale-95">
                    Start practising
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <p className="mt-4 text-center text-xs text-white/50 lg:hidden">
              Quality MCQs & live mock tests · Classes 6–12
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12z"
      />
    </svg>
  );
}
