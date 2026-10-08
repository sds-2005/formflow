"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, usePathname } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { waitForBuilderSaves } from "@/lib/builder-save-registry";

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  const id = useParams().id as string;
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);
  const formQuery = useQuery({ queryKey: ["forms", id], queryFn: () => apiClient.forms.get(id) });
  const lifecycle = useMutation({ mutationFn: async () => { await waitForBuilderSaves(id); return apiClient.forms.publish(id); }, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["forms", id] }); setNotice("Latest edits published — your public link is live."); setTimeout(() => setNotice(null), 3500); }, onError: (error) => { setNotice(error instanceof Error ? error.message : "Couldn’t publish form"); } });
  const tabClass = (active: boolean) => `rounded-lg px-3 py-1.5 text-sm font-medium transition ${active ? "bg-white text-black shadow-sm" : "text-stone-500 hover:text-black"}`;
  const isResults = pathname.endsWith("/results");
  const isShare = pathname.endsWith("/share");
  return <div className="flex h-screen w-full flex-col overflow-hidden bg-stone-50"><header className="flex h-16 shrink-0 items-center justify-between border-b border-stone-200 bg-white px-3 md:px-5"><div className="flex min-w-0 items-center gap-3"><Link aria-label="Back to forms" href="/forms" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xl hover:bg-stone-100">←</Link><div className="hidden h-5 w-px bg-stone-200 sm:block" /><nav aria-label="Builder sections" className="flex rounded-xl bg-stone-100 p-1"><Link href={`/builder/${id}`} className={tabClass(!isShare && !isResults)}>Content</Link><Link href={`/builder/${id}/share`} className={tabClass(isShare)}>Share</Link><Link href={`/builder/${id}/results`} className={tabClass(isResults)}>Results</Link></nav></div><div className="flex items-center gap-2"><Link href={`/builder/${id}/preview`} target="_blank" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-stone-100">Preview</Link><button onClick={() => lifecycle.mutate()} disabled={lifecycle.isPending || formQuery.isLoading} className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{lifecycle.isPending ? "Publishing…" : formQuery.data?.status === "published" ? "Publish edits" : "Publish"}</button></div></header><main className="min-h-0 flex-1">{children}</main>{notice && <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-black px-5 py-3 text-sm text-white shadow-xl">{notice}</div>}</div>;
}
