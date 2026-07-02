import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Calculator, Atom, FlaskConical, Leaf, BookOpen, ArrowRight } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/subjects")({
  head: () => ({ meta: [{ title: "Subjects — Testified" }] }),
  component: Subjects,
});

const ICONS: Record<string, any> = {
  Mathematics: Calculator,
  "Physical Science": Atom,
  Physics: Atom,
  "Life Science": Leaf,
  Chemistry: FlaskConical,
};

function Subjects() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) return;
      const [{ data: p }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("class").eq("id", userRes.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userRes.user.id),
      ]);
      setIsAdmin(!!roles?.some((r) => r.role === "admin"));
      if (!p?.class) { setLoading(false); return; }
      setLevel(p.class);
      const { data: cls } = await supabase.from("classes").select("id").eq("level", p.class).maybeSingle();
      if (!cls) { setLoading(false); return; }
      const { data: subs } = await supabase
        .from("subjects").select("id, name").eq("class_id", cls.id).order("position");
      // For each subject compute chapters count + attempts count
      const enriched = await Promise.all((subs ?? []).map(async (s: any) => {
        const [{ count: chapCount }, { count: attempts }] = await Promise.all([
          supabase.from("chapters").select("*", { count: "exact", head: true }).eq("subject_id", s.id),
          supabase.from("quiz_attempts").select("*", { count: "exact", head: true }).eq("user_id", userRes.user!.id).eq("subject_id", s.id),
        ]);
        return { ...s, chapters: chapCount ?? 0, attempts: attempts ?? 0 };
      }));
      setSubjects(enriched);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen">
      <AppHeader isAdmin={isAdmin} back={{ to: "/home" }} />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-6">
        <div className="glass-strong rounded-3xl p-6 sm:p-8">
          <div className="text-xs uppercase tracking-[0.2em] text-primary/80 font-medium">Class {level || "—"}</div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">Pick a <span className="gradient-text">subject</span></h1>
          <p className="mt-2 text-sm text-muted-foreground">Practice MCQs chapter by chapter.</p>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {loading ? (
            <div className="col-span-full py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : subjects.length === 0 ? (
            <div className="col-span-full glass rounded-3xl p-10 text-center text-sm text-muted-foreground">
              No subjects available for your class yet.
            </div>
          ) : subjects.map((s) => {
            const Icon = ICONS[s.name] ?? BookOpen;
            return (
              <Link
                key={s.id}
                to="/subject/$id"
                params={{ id: s.id }}
                className="group glass rounded-2xl p-5 hover:scale-[1.02] transition-transform"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl glass-tint text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="mt-4">
                  <div className="text-base font-semibold">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.chapters} chapters · {s.attempts} attempts</div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
