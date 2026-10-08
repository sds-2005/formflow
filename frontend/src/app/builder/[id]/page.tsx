"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiClient,
  Question,
  QuestionPayload,
  QuestionType,
} from "@/lib/api-client";

const QUESTION_TYPES: Array<{ type: QuestionType; label: string; icon: string }> = [
  { type: "short_text", label: "Short text", icon: "Aa" },
  { type: "long_text", label: "Long text", icon: "¶" },
  { type: "multiple_choice", label: "Multiple choice", icon: "◉" },
  { type: "dropdown", label: "Dropdown", icon: "⌄" },
  { type: "email", label: "Email", icon: "@" },
  { type: "number", label: "Number", icon: "#" },
  { type: "yes_no", label: "Yes / No", icon: "Y/N" },
  { type: "rating", label: "Rating", icon: "★" },
];

function AnswerPreview({ question }: { question: Question }) {
  if (question.type === "multiple_choice") {
    return <div className="space-y-2">{question.options.map((option, index) => <div key={option.id} className="flex items-center gap-3 rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-700"><span className="grid h-7 w-7 place-items-center rounded border border-stone-300 text-xs font-semibold">{String.fromCharCode(65 + index)}</span>{option.label}</div>)}</div>;
  }
  if (question.type === "dropdown") return <div className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-500">Choose an option <span className="float-right">⌄</span></div>;
  if (question.type === "yes_no") return <div className="flex gap-3"><div className="rounded-xl border border-stone-300 bg-white px-6 py-3">Y&nbsp;&nbsp; Yes</div><div className="rounded-xl border border-stone-300 bg-white px-6 py-3">N&nbsp;&nbsp; No</div></div>;
  if (question.type === "rating") return <div className="flex flex-wrap gap-2">{Array.from({ length: Number(question.settings.max ?? 5) }, (_, index) => <span key={index} className="grid h-11 w-11 place-items-center rounded-lg border border-stone-300 bg-white text-lg">{index + 1}</span>)}</div>;
  return <div className="border-b-2 border-stone-400 pb-2 text-2xl text-stone-400">{question.type === "email" ? "name@example.com" : question.type === "number" ? "Type a number…" : "Type your answer here…"}</div>;
}

function Inspector({ question, onSave, onDelete, onDuplicate }: { question: Question; onSave: (data: QuestionPayload) => void; onDelete: () => void; onDuplicate: () => void }) {
  const [options, setOptions] = useState<Array<{ id?: string; label: string }>>(question.options.map(({ id, label }) => ({ id, label })));
  useEffect(() => setOptions(question.options.map(({ id, label }) => ({ id, label }))), [question]);
  const isChoice = question.type === "multiple_choice" || question.type === "dropdown";
  const saveOptions = (next: typeof options) => { setOptions(next); onSave({ options: next }); };
  const updateNumericSetting = (key: "min" | "max", rawValue: string) => {
    const settings = { ...question.settings };
    if (rawValue === "") delete settings[key];
    else settings[key] = Number(rawValue);
    onSave({ settings });
  };
  return <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-stone-200 bg-white p-5 lg:block">
    <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-stone-500">Question settings</h2>
    <label className="mb-2 block text-sm font-medium">Type</label>
    <select className="mb-5 w-full rounded-lg border border-stone-300 bg-white p-3 text-sm" value={question.type} onChange={(event) => {
      const type = event.target.value as QuestionType;
      const becomesChoice = type === "multiple_choice" || type === "dropdown";
      if (isChoice && !becomesChoice && options.length && !window.confirm("Changing type will remove your choices. Continue?")) return;
      onSave({ type, options: becomesChoice && !isChoice ? [{ label: "Option 1" }, { label: "Option 2" }] : isChoice && !becomesChoice ? [] : undefined });
    }}>
      {QUESTION_TYPES.map((item) => <option key={item.type} value={item.type}>{item.label}</option>)}
    </select>
    <label className="mb-5 flex cursor-pointer items-center justify-between rounded-lg border border-stone-200 p-3 text-sm font-medium">
      Required
      <input aria-label="Required question" type="checkbox" checked={question.required} onChange={(event) => onSave({ required: event.target.checked })} className="h-5 w-5 accent-black" />
    </label>
    {isChoice && <div className="mb-6">
      <div className="mb-2 flex items-center justify-between"><span className="text-sm font-medium">Options</span><button onClick={() => saveOptions([...options, { label: `Option ${options.length + 1}` }])} className="text-sm font-semibold">+ Add</button></div>
      <div className="space-y-2">{options.map((option, index) => <div key={option.id ?? index} className="flex gap-2"><input aria-label={`Option ${index + 1}`} value={option.label} onChange={(event) => setOptions(options.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} onBlur={() => option.label.trim() && onSave({ options })} className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm" /><button aria-label={`Delete option ${index + 1}`} disabled={options.length === 1} onClick={() => saveOptions(options.filter((_, itemIndex) => itemIndex !== index))} className="px-2 text-stone-400 hover:text-red-600 disabled:opacity-30">×</button></div>)}</div>
    </div>}
    {question.type === "rating" && <label className="mb-5 block text-sm font-medium">Rating scale<select value={Number(question.settings.max ?? 5)} onChange={(event) => onSave({ settings: { ...question.settings, max: Number(event.target.value) } })} className="mt-2 w-full rounded-lg border border-stone-300 p-3"><option value={5}>1 to 5</option><option value={10}>1 to 10</option></select></label>}
    {question.type === "number" && <div className="mb-5 grid grid-cols-2 gap-2"><label className="text-xs text-stone-500">Minimum<input type="number" value={String(question.settings.min ?? "")} onChange={(event) => updateNumericSetting("min", event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-sm" /></label><label className="text-xs text-stone-500">Maximum<input type="number" value={String(question.settings.max ?? "")} onChange={(event) => updateNumericSetting("max", event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-sm" /></label></div>}
    <div className="mb-6 space-y-2 rounded-xl bg-stone-50 p-4"><p className="text-sm font-medium">Theme</p><p className="text-xs text-stone-500">Custom colors and fonts — Coming soon</p><p className="pt-2 text-sm font-medium">Thank-you screen</p><p className="text-xs text-stone-500">Custom endings — Coming soon</p></div>
    <div className="grid grid-cols-2 gap-2 border-t border-stone-200 pt-4"><button onClick={onDuplicate} className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium">Duplicate</button><button onClick={onDelete} className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">Delete</button></div>
  </aside>;
}

export default function BuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const formQuery = useQuery({ queryKey: ["forms", id], queryFn: () => apiClient.forms.get(id) });
  const questionsQuery = useQuery({ queryKey: ["forms", id, "questions"], queryFn: () => apiClient.questions.list(id) });
  const questions = useMemo(() => questionsQuery.data ?? [], [questionsQuery.data]);
  useEffect(() => { if (!activeId && questions[0]) setActiveId(questions[0].id); }, [activeId, questions]);
  const activeQuestion = questions.find((question) => question.id === activeId) ?? null;
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["forms", id, "questions"] });
  const save = async (questionId: string, payload: QuestionPayload) => { setSaveState("saving"); try { await apiClient.questions.update(id, questionId, payload); await refresh(); setSaveState("saved"); } catch { setSaveState("error"); } };
  const addMutation = useMutation({ mutationFn: (type: QuestionType) => apiClient.questions.create(id, { type, title: "Untitled question", settings: type === "rating" ? { max: 5 } : {} }), onSuccess: async (question) => { await refresh(); setActiveId(question.id); setShowPicker(false); } });
  const reorder = async (sourceId: string, targetId: string) => { if (sourceId === targetId) return; const next = [...questions]; const from = next.findIndex((item) => item.id === sourceId); const to = next.findIndex((item) => item.id === targetId); const [moved] = next.splice(from, 1); next.splice(to, 0, moved); queryClient.setQueryData(["forms", id, "questions"], next); await apiClient.questions.reorder(id, next.map((item) => item.id)); await refresh(); };
  const moveByKeyboard = (questionId: string, delta: number) => { const index = questions.findIndex((item) => item.id === questionId); const target = questions[index + delta]; if (target) void reorder(questionId, target.id); };
  if (formQuery.isLoading || questionsQuery.isLoading) return <div className="grid h-full w-full place-items-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-black" /></div>;
  if (formQuery.isError || questionsQuery.isError) return <div className="grid h-full w-full place-items-center text-center"><div><h2 className="text-xl font-semibold">Couldn&apos;t load this form</h2><button onClick={() => { void formQuery.refetch(); void questionsQuery.refetch(); }} className="mt-4 rounded-lg bg-black px-4 py-2 text-white">Retry</button></div></div>;
  return <div className="flex h-full w-full min-w-0">
    <aside className="hidden w-64 shrink-0 flex-col border-r border-stone-200 bg-white md:flex">
      <div className="flex items-center justify-between border-b border-stone-100 p-4"><div><h2 className="font-semibold">Content</h2><p className={`text-xs ${saveState === "error" ? "text-red-600" : "text-stone-400"}`}>{saveState === "saving" ? "Saving…" : saveState === "error" ? "Couldn’t save" : "All changes saved"}</p></div><button onClick={() => setShowPicker(!showPicker)} className="grid h-9 w-9 place-items-center rounded-lg bg-black text-xl text-white">+</button></div>
      {showPicker && <div className="grid grid-cols-2 gap-2 border-b border-stone-200 p-3">{QUESTION_TYPES.map((item) => <button key={item.type} onClick={() => addMutation.mutate(item.type)} className="rounded-lg border border-stone-200 p-2 text-left hover:border-black"><span className="block text-base font-semibold">{item.icon}</span><span className="text-xs">{item.label}</span></button>)}</div>}
      <div className="flex-1 space-y-1 overflow-y-auto p-2">{questions.map((question, index) => <button key={question.id} draggable onDragStart={() => setDraggedId(question.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedId) void reorder(draggedId, question.id); setDraggedId(null); }} onKeyDown={(event) => { if (event.altKey && event.key === "ArrowUp") { event.preventDefault(); moveByKeyboard(question.id, -1); } if (event.altKey && event.key === "ArrowDown") { event.preventDefault(); moveByKeyboard(question.id, 1); } }} onClick={() => setActiveId(question.id)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left text-sm ${activeId === question.id ? "bg-stone-900 text-white" : "hover:bg-stone-100"}`}><span className="cursor-grab opacity-50">⋮⋮</span><span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-white/15 text-xs">{index + 1}</span><span className="truncate">{question.title}</span>{question.required && <span className="ml-auto">*</span>}</button>)}</div>
      <button onClick={() => setShowPicker(true)} className="m-3 rounded-lg border border-stone-300 py-2.5 text-sm font-semibold">+ Add question</button>
    </aside>
    <main className="min-w-0 flex-1 overflow-y-auto bg-[#f5f3ef] p-5 md:p-10">
      <div className="mx-auto max-w-3xl"><input aria-label="Form title" defaultValue={formQuery.data?.title} onBlur={async (event) => { const title = event.target.value.trim() || "Untitled form"; if (title !== formQuery.data?.title) { setSaveState("saving"); try { await apiClient.forms.update(id, { title }); await queryClient.invalidateQueries({ queryKey: ["forms", id] }); setSaveState("saved"); } catch { setSaveState("error"); } } }} className="mb-10 w-full bg-transparent text-2xl font-semibold outline-none" />
        {activeQuestion ? <section key={activeQuestion.id} className="rounded-2xl border border-stone-200 bg-white p-7 shadow-sm md:p-12"><div className="flex gap-4"><span className="pt-2 text-sm font-semibold text-stone-500">{questions.findIndex((item) => item.id === activeQuestion.id) + 1} →</span><div className="min-w-0 flex-1"><input aria-label="Question title" defaultValue={activeQuestion.title} onBlur={(event) => { const title = event.target.value.trim() || "Untitled question"; if (title !== activeQuestion.title) void save(activeQuestion.id, { title }); }} className="w-full bg-transparent text-2xl font-medium outline-none md:text-3xl" /><input aria-label="Question description" defaultValue={activeQuestion.description ?? ""} onBlur={(event) => { if (event.target.value !== (activeQuestion.description ?? "")) void save(activeQuestion.id, { description: event.target.value }); }} placeholder="Add a description (optional)" className="mt-3 w-full bg-transparent text-lg text-stone-500 outline-none" /><div className="mt-10"><AnswerPreview question={activeQuestion} /></div></div></div></section> : <div className="grid min-h-80 place-items-center rounded-2xl border-2 border-dashed border-stone-300 text-center text-stone-500"><div><p className="text-lg font-medium">Your form is empty</p><button onClick={() => setShowPicker(true)} className="mt-3 rounded-lg bg-black px-4 py-2 text-white">Add your first question</button></div></div>}
      </div>
    </main>
    {activeQuestion && <Inspector question={activeQuestion} onSave={(payload) => void save(activeQuestion.id, payload)} onDuplicate={() => { void apiClient.questions.duplicate(id, activeQuestion.id).then(async (question) => { await refresh(); setActiveId(question.id); }); }} onDelete={() => { if (window.confirm(`Delete “${activeQuestion.title}”?`)) void apiClient.questions.delete(id, activeQuestion.id).then(async () => { setActiveId(null); await refresh(); }); }} />}
  </div>;
}
