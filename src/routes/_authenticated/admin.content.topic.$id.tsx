import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Eye, Sparkles, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { AppHeader } from "@/components/app-header";
import { Latex } from "@/components/latex";
import { supabase } from "@/integrations/supabase/client";
import { parseMCQs } from "@/lib/mcq-import.functions";

export const Route = createFileRoute("/_authenticated/admin/content/topic/$id")({
  head: () => ({ meta: [{ title: "Manage MCQs — Admin" }] }),
  component: ManageTopic,
});

type Question = { id: string; question: string; options: string[]; correct_answer: number; explanation: string | null; difficulty: string };

const EMPTY = { question: "", options: ["", "", "", ""], correct: 0, explanation: "", difficulty: "medium" };

function ManageTopic() {
  const { id: topicId } = Route.useParams();
  const [topic, setTopic] = useState<any>(null);
  const [bankId, setBankId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY, options: [...EMPTY.options] });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: t } = await supabase.from("topics").select("id, name").eq("id", topicId).maybeSingle();
    setTopic(t);
    let { data: banks } = await supabase.from("question_banks").select("id").eq("topic_id", topicId);
    let bId = banks?.[0]?.id ?? null;
    if (!bId) {
      const { data: created } = await supabase.from("question_banks").insert({ topic_id: topicId, name: "Default Bank" }).select("id").maybeSingle();
      bId = created?.id ?? null;
    }
    setBankId(bId);
    if (bId) {
      const { data: qs } = await supabase.from("questions")
        .select("id, question, options, correct_answer, explanation, difficulty")
        .eq("question_bank_id", bId)
        .order("created_at", { ascending: false });
      setQuestions((qs ?? []).map((q: any) => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : [],
        correct_answer: typeof q.correct_answer === "number" ? q.correct_answer : Number(q.correct_answer ?? 0),
      })));
    } else {
      setQuestions([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [topicId]);

  const add = async () => {
    if (!bankId) return;
    if (!form.question.trim() || form.options.some((o) => !o.trim())) {
      return toast.error("Fill the question and all 4 options.");
    }
    setSaving(true);
    const { error } = await supabase.from("questions").insert({
      question_bank_id: bankId,
      type: "single",
      question: form.question,
      options: form.options,
      correct_answer: form.correct,
      explanation: form.explanation || null,
      difficulty: form.difficulty as any,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("MCQ added");
    setForm({ ...EMPTY, options: ["", "", "", ""] });
    load();
  };

  const remove = async (qid: string) => {
    if (!confirm("Delete this question?")) return;
    const { error } = await supabase.from("questions").delete().eq("id", qid);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="min-h-screen">
      <AppHeader isAdmin back={{ to: "/admin/content" }} />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-6 space-y-6">
        <div className="glass-strong rounded-3xl p-6 sm:p-8">
          <div className="text-xs uppercase tracking-[0.2em] text-primary/80 font-medium">Subtopic</div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">{topic?.name ?? "…"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Use $...$ for inline math and $$...$$ for block math. Example: <code className="glass-tint rounded px-1">$P = \dfrac&#123;F&#125;&#123;A&#125;$</code></p>
        </div>

        {/* Add form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass rounded-3xl p-5 space-y-3">
            <div className="text-sm font-semibold">New question</div>
            <textarea value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })}
              placeholder="Question text (LaTeX supported)"
              className="w-full min-h-24 glass-tint rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
            {form.options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <button onClick={() => setForm({ ...form, correct: i })}
                  className={`h-8 w-8 rounded-full text-xs font-semibold shrink-0 ${form.correct === i ? "btn-gradient" : "glass-tint text-primary"}`}>
                  {String.fromCharCode(65 + i)}
                </button>
                <input value={o} onChange={(e) => {
                  const opts = [...form.options]; opts[i] = e.target.value;
                  setForm({ ...form, options: opts });
                }} placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  className="flex-1 glass-tint rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
            ))}
            <textarea value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })}
              placeholder="Explanation (optional)"
              className="w-full min-h-16 glass-tint rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
            <div className="flex items-center gap-2">
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="glass-tint rounded-xl px-3 py-2 text-sm outline-none">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <div className="text-xs text-muted-foreground">Correct: <b>{String.fromCharCode(65 + form.correct)}</b></div>
              <button onClick={add} disabled={saving} className="ml-auto btn-gradient rounded-full px-4 py-2 text-sm font-medium inline-flex items-center gap-1 disabled:opacity-50">
                <Plus className="h-4 w-4" /> {saving ? "Adding…" : "Add MCQ"}
              </button>
            </div>
          </div>

          <div className="glass rounded-3xl p-5 space-y-3">
            <div className="text-sm font-semibold inline-flex items-center gap-1"><Eye className="h-4 w-4" /> Live preview</div>
            <div className="glass-tint rounded-2xl p-4">
              <div className="text-sm font-medium"><Latex>{form.question || "Question will render here…"}</Latex></div>
              <div className="mt-3 space-y-2">
                {form.options.map((o, i) => (
                  <div key={i} className={`glass rounded-xl px-3 py-2 text-sm flex items-center gap-2 ${form.correct === i ? "ring-1 ring-emerald-500/40" : ""}`}>
                    <span className="h-6 w-6 rounded-full glass-tint text-primary text-[10px] font-semibold flex items-center justify-center">{String.fromCharCode(65 + i)}</span>
                    <span className="flex-1"><Latex>{o || `Option ${String.fromCharCode(65 + i)}`}</Latex></span>
                  </div>
                ))}
              </div>
              {form.explanation && (
                <div className="mt-3 text-xs text-muted-foreground"><Latex>{form.explanation}</Latex></div>
              )}
            </div>
          </div>
        </div>

        {/* Existing questions */}
        <div className="glass rounded-3xl p-5">
          <div className="text-sm font-semibold">Questions in this subtopic ({questions.length})</div>
          {loading ? (
            <div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : questions.length === 0 ? (
            <div className="mt-3 text-sm text-muted-foreground">No questions yet.</div>
          ) : (
            <div className="mt-3 space-y-3">
              {questions.map((q, i) => (
                <div key={q.id} className="glass-tint rounded-2xl p-4">
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-muted-foreground shrink-0 mt-1">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium"><Latex>{q.question}</Latex></div>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((o, oi) => (
                          <div key={oi} className={`text-xs glass rounded-lg px-2 py-1.5 flex items-center gap-2 ${oi === q.correct_answer ? "ring-1 ring-emerald-500/40" : ""}`}>
                            <span className="text-[10px] font-semibold">{String.fromCharCode(65 + oi)}</span>
                            <span className="flex-1"><Latex>{o}</Latex></span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => remove(q.id)} className="glass rounded-full p-2 text-red-500 hover:scale-105 transition-transform"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
