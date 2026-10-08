"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { AnswerValue, apiClient, PublicForm, Question } from "@/lib/api-client";

function validate(question: Question, value: AnswerValue | undefined): string | null {
  const empty = value === undefined || value === null || value === "";
  if (question.required && empty) return "This question is required";
  if (empty) return null;
  if (question.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) return "Please enter a valid email address";
  if (question.type === "number") {
    const number = Number(value);
    if (!Number.isFinite(number)) return "Please enter a valid number";
    if (question.settings.min !== undefined && question.settings.min !== "" && number < Number(question.settings.min)) return `Enter ${question.settings.min} or more`;
    if (question.settings.max !== undefined && question.settings.max !== "" && number > Number(question.settings.max)) return `Enter ${question.settings.max} or less`;
  }
  return null;
}

function QuestionControl({ question, value, onChange, onAdvance }: { question: Question; value: AnswerValue | undefined; onChange: (value: AnswerValue) => void; onAdvance: (value?: AnswerValue) => void }) {
  const options = useMemo(() => question.options ?? [], [question.options]);
  const [focusedOption, setFocusedOption] = useState(Math.max(0, options.findIndex((option) => option.id === value)));
  useEffect(() => setFocusedOption(Math.max(0, options.findIndex((option) => option.id === value))), [options, value]);
  const commonInput = "w-full border-b-2 border-white/35 bg-transparent py-3 text-2xl text-white outline-none placeholder:text-white/40 focus:border-white md:text-3xl";
  if (question.type === "long_text") return <><textarea autoFocus rows={4} value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); onAdvance(); } }} placeholder="Type your answer here…" className={`${commonInput} resize-none`} /><p className="mt-2 text-sm text-white/50">Press Ctrl/⌘ + Enter to continue</p></>;
  if (question.type === "multiple_choice") return <div role="radiogroup" aria-label={question.title} className="space-y-2" onKeyDown={(event) => { if (event.key === "ArrowDown" || event.key === "ArrowRight") { event.preventDefault(); setFocusedOption((focusedOption + 1) % options.length); } if (event.key === "ArrowUp" || event.key === "ArrowLeft") { event.preventDefault(); setFocusedOption((focusedOption - 1 + options.length) % options.length); } if (event.key === "Enter" && options[focusedOption]) onAdvance(options[focusedOption].id); if (/^[a-z]$/i.test(event.key)) { const index = event.key.toUpperCase().charCodeAt(0) - 65; if (options[index]) onAdvance(options[index].id); } }}>{options.map((option, index) => <button autoFocus={index === focusedOption} type="button" role="radio" aria-checked={value === option.id} key={option.id} onFocus={() => setFocusedOption(index)} onClick={() => onAdvance(option.id)} className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${value === option.id ? "border-white bg-white text-[#231f3a]" : index === focusedOption ? "border-white bg-white/15" : "border-white/30 bg-white/5 hover:bg-white/10"}`}><span className="grid h-7 w-7 place-items-center rounded border border-current text-xs font-bold">{String.fromCharCode(65 + index)}</span>{option.label}</button>)}</div>;
  if (question.type === "dropdown") return <select autoFocus value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") onAdvance(); }} className="w-full rounded-xl border border-white/30 bg-[#302a52] px-4 py-4 text-lg text-white outline-none focus:border-white"><option value="">Choose an option…</option>{options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select>;
  if (question.type === "yes_no") return <div className="flex flex-wrap gap-3"><button autoFocus type="button" onClick={() => onAdvance(true)} className={`rounded-xl border px-7 py-4 text-lg ${value === true ? "bg-white text-[#231f3a]" : "border-white/30 bg-white/5"}`}><span className="mr-3 rounded border border-current px-2 py-1 text-xs">Y</span>Yes</button><button type="button" onClick={() => onAdvance(false)} className={`rounded-xl border px-7 py-4 text-lg ${value === false ? "bg-white text-[#231f3a]" : "border-white/30 bg-white/5"}`}><span className="mr-3 rounded border border-current px-2 py-1 text-xs">N</span>No</button></div>;
  if (question.type === "rating") { const max = Number(question.settings.max ?? 5); return <div className="flex flex-wrap gap-2">{Array.from({ length: max }, (_, index) => index + 1).map((rating) => <button autoFocus={rating === 1} type="button" key={rating} onClick={() => onAdvance(rating)} className={`grid h-12 min-w-12 place-items-center rounded-lg border px-3 text-lg font-semibold ${value === rating ? "bg-white text-[#231f3a]" : "border-white/30 bg-white/5 hover:bg-white/10"}`}>{rating}</button>)}</div>; }
  return <input autoFocus type={question.type === "email" ? "email" : question.type === "number" ? "number" : "text"} inputMode={question.type === "number" ? "decimal" : undefined} value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); onAdvance(); } }} placeholder={question.type === "email" ? "name@example.com" : question.type === "number" ? "Type a number…" : "Type your answer here…"} className={commonInput} />;
}

export default function RespondentFlow({ form, isPreview = false }: { form: PublicForm; isPreview?: boolean }) {
  const questions = useMemo(() => form.questions ?? [], [form.questions]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [direction, setDirection] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const keyRef = useRef(globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
  const reduceMotion = useReducedMotion();
  const question = questions[index];
  const submit = async (finalAnswers: Record<string, AnswerValue>) => { setIsSubmitting(true); setSubmitError(null); if (isPreview) { setIsSubmitted(true); return; } try { await apiClient.public.submit(form.slug, finalAnswers, form.version_id, keyRef.current); setIsSubmitted(true); } catch (caught) { setSubmitError(caught instanceof Error ? caught.message : "Your response could not be submitted. Please try again."); setIsSubmitting(false); } };
  const next = (override?: AnswerValue) => { if (!question || isSubmitting) return; const value = override !== undefined ? override : answers[question.id]; const validationError = validate(question, value); if (validationError) { setError(validationError); return; } const nextAnswers = override !== undefined ? { ...answers, [question.id]: override } : answers; if (override !== undefined) setAnswers(nextAnswers); setError(null); if (index === questions.length - 1) void submit(nextAnswers); else { setDirection(1); setIndex(index + 1); } };
  const previous = () => { if (index > 0 && !isSubmitting) { setError(null); setDirection(-1); setIndex(index - 1); } };
  useEffect(() => { const handler = (event: KeyboardEvent) => { if (event.key === "ArrowUp" && event.altKey) previous(); }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); });
  if (isSubmitted) return <main className="grid min-h-screen place-items-center bg-[#231f3a] p-6 text-center text-white"><motion.div initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}><div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-white text-3xl text-[#231f3a]">✓</div><h1 className="text-4xl font-semibold">{isPreview ? "That’s the end of the preview" : "Thank you!"}</h1><p className="mt-3 text-lg text-white/65">{isPreview ? "Answers weren’t submitted." : "Your response has been recorded."}</p>{!isPreview && <Link href="/" className="mt-8 inline-block rounded-lg bg-white px-5 py-3 font-semibold text-[#231f3a]">Create your own form</Link>}</motion.div></main>;
  if (!question) return <main className="grid min-h-screen place-items-center bg-[#231f3a] p-6 text-center text-white"><div><h1 className="text-2xl font-semibold">This form isn’t ready yet</h1><p className="mt-2 text-white/60">The creator hasn’t added any questions.</p></div></main>;
  const progress = ((index + 1) / questions.length) * 100;
  return <main className="relative flex min-h-screen overflow-hidden bg-[#231f3a] text-white selection:bg-white/20">
    <div aria-label={`${index + 1} of ${questions.length}`} className="absolute inset-x-0 top-0 h-1 bg-white/15"><div className="h-full bg-[#c8b8ff] transition-[width] duration-300" style={{ width: `${progress}%` }} /></div>
    {isPreview && <div className="absolute left-4 top-4 z-10 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">PREVIEW</div>}
    <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-20 md:px-10"><AnimatePresence mode="wait" custom={direction}><motion.section key={question.id} custom={direction} initial={reduceMotion ? false : { y: direction > 0 ? 55 : -55, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduceMotion ? undefined : { y: direction > 0 ? -55 : 55, opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }} className="w-full"><div className="flex gap-3 md:gap-5"><span className="pt-2 text-sm font-semibold text-[#c8b8ff]">{index + 1} →</span><div className="min-w-0 flex-1"><h1 className="text-2xl font-medium leading-tight md:text-4xl">{question.title}{question.required && <span aria-label="required" className="ml-2 text-[#c8b8ff]">*</span>}</h1>{question.description && <p className="mt-3 text-lg text-white/60">{question.description}</p>}<div className="mt-8"><QuestionControl question={question} value={answers[question.id]} onChange={(value) => { setAnswers({ ...answers, [question.id]: value }); setError(null); }} onAdvance={next} /></div>{error && <p role="alert" className="mt-4 inline-flex rounded-lg bg-red-400/15 px-3 py-2 text-sm text-red-200">⚠ {error}</p>}{submitError && <div role="alert" className="mt-4 rounded-lg bg-red-400/15 p-3 text-sm text-red-100">{submitError} <button onClick={() => void submit(answers)} className="ml-2 underline">Retry</button></div>}<div className="mt-7 flex items-center gap-3"><button onClick={() => next()} disabled={isSubmitting} className="rounded-lg bg-white px-5 py-2.5 font-semibold text-[#231f3a] shadow disabled:opacity-50">{index === questions.length - 1 ? isSubmitting ? "Submitting…" : isPreview ? "Finish preview" : "Submit" : "OK"}</button>{question.type !== "long_text" && !["multiple_choice", "yes_no", "rating"].includes(question.type) && <span className="text-xs text-white/45">press Enter ↵</span>}</div></div></div></motion.section></AnimatePresence></div>
    <div className="fixed bottom-5 right-5 flex overflow-hidden rounded-lg border border-white/20 bg-white/10 backdrop-blur"><button aria-label="Previous question" onClick={previous} disabled={index === 0 || isSubmitting} className="grid h-10 w-11 place-items-center border-r border-white/20 disabled:opacity-30">↑</button><button aria-label="Next question" onClick={() => next()} disabled={isSubmitting} className="grid h-10 w-11 place-items-center disabled:opacity-30">↓</button></div>
  </main>;
}
