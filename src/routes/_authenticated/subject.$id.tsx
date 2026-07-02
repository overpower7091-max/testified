import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, BookOpen, ArrowRight, PlayCircle } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/subject/$id")({
  head: () => ({ meta: [{ title: "Chapters — Testified" }] }),
  component: SubjectDetail,
});

function SubjectDetail() {
  const { id } = Route.useParams();
  const [subject, setSubject] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const [{ data: s }, { data: chs }, { data: roles }] = await Promise.all([
        supabase.from("subjects").select("id, name").eq("id", id).maybeSingle(),
        supabase.from("chapters").select("id, name, position").eq("subject_id", id).order("position"),
        userRes.user ? supabase.from("user_roles").select("role").eq("user_id", userRes.user.id) : Promise.resolve({ data: [] } as any),
      ]);
      setSubject(s);
      // For each chapter count questions + user attempts
      const enriched = await Promise.all((chs ?? []).map(async (c: any) => {
        const { data: topics } = await supabase.from("topics").select("id").eq("chapter_id", c.id);
        const topicIds = (topics ?? []).map((t: any) => t.id);
        let qCount = 0; let attempts = 0; let correct = 0;
        if (topicIds.length) {
          const { data: banks } = await supabase.from("question_banks").select("id").in("topic_id", topicIds);
          const bankIds = (banks ?? []).map((b: any) => b.id);
          if (bankIds.length) {
            const { count } = await supabase.from("questions").select("*", { count: "exact", head: true }).in("question_bank_id", bankIds);
            qCount = count ?? 0;
          }
        }
        if (userRes.user) {
          const { data: att } = await supabase.from("quiz_attempts")
            .select("is_correct").eq("user_id", userRes.user.id).eq("chapter_id", c.id);
          attempts = att?.length ?? 0;
          correct = att?.filter((a: any) => a.is_correct).length ?? 0;
        }
        return { ...c, questions: qCount, attempts, correct };
      }));
      setChapters(enriched);
      setIsAdmin(!!roles?.some((r: any) => r.role === "admin"));
      setLoading(false);
    })();
  }, [id]);

  return (
    <div className="min-h-screen">
      <AppHeader isAdmin={isAdmin} back={{ to: "/subjects" }} />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-6">
        <div className="glass-strong rounded-3xl p-6 sm:p-8">
          <div className="text-xs uppercase tracking-[0.2em] text-primary/80 font-medium">Subject</div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">{subject?.name ?? "…"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Choose a chapter to start practising.</p>
        </div>

        <div className="mt-6 space-y-3">
          {loading ? (
            <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : chapters.length === 0 ? (
            <div className="glass rounded-3xl p-10 text-center text-sm text-muted-foreground">No chapters yet.</div>
          ) : chapters.map((c) => {
            const acc = c.attempts ? Math.round((c.correct / c.attempts) * 100) : 0;
            return (
              <Link
                key={c.id}
                to="/practice/$chapterId"
                params={{ chapterId: c.id }}
                className="group glass rounded-2xl p-4 sm:p-5 hover:scale-[1.01] transition-transform flex items-center gap-4"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl glass-tint text-primary shrink-0">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{c.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.questions} questions · {c.attempts ? `${acc}% accuracy over ${c.attempts} attempts` : "Not started"}
                  </div>
                  {c.attempts > 0 && (
                    <div className="mt-2 h-1.5 w-full rounded-full bg-white/50 overflow-hidden">
                      <div className="h-full btn-gradient rounded-full" style={{ width: `${acc}%` }} />
                    </div>
                  )}
                </div>
                <button className="btn-gradient rounded-full inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium">
                  <PlayCircle className="h-3.5 w-3.5" /> Practice
                </button>
                <ArrowRight className="hidden sm:block h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
