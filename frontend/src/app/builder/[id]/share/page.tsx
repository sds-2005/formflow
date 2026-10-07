"use client";

import { use, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import Link from "next/link";

export default function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const { data: form, isLoading } = useQuery({
    queryKey: ["forms", id],
    queryFn: () => apiClient.forms.get(id),
  });

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-black"></div>
      </div>
    );
  }

  const isPublished = form?.status === "published" && form?.slug;
  const shareUrl = isPublished ? `${origin}/f/${form.slug}` : "";

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-lg">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
        </div>
        
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Share your form</h1>
        <p className="mb-8 text-gray-500 text-lg">Send this link to your audience to start collecting responses.</p>

        {isPublished ? (
          <div className="relative">
            <div className="flex w-full items-center justify-between rounded-xl border-2 border-gray-200 bg-gray-50 p-4 transition-colors hover:border-gray-300">
              <span className="truncate text-lg font-medium text-gray-700">{shareUrl}</span>
              <button
                onClick={handleCopy}
                className="ml-4 shrink-0 rounded-lg bg-black px-6 py-2.5 font-medium text-white hover:bg-gray-800 transition-colors focus:ring-4 focus:ring-gray-200"
              >
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>
            <div className="mt-8">
               <a 
                 href={shareUrl} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="inline-flex items-center font-semibold text-blue-600 hover:text-blue-800 hover:underline"
               >
                 Open form in new tab 
                 <svg className="ml-1" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
               </a>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6">
            <h3 className="font-semibold text-yellow-800 text-lg mb-2">Form not published yet</h3>
            <p className="text-yellow-700 mb-4">You need to publish your form before you can share it with others.</p>
            <Link 
              href={`/builder/${id}`}
              className="inline-flex items-center rounded-lg bg-yellow-500 px-6 py-2.5 font-medium text-white hover:bg-yellow-600 transition-colors"
            >
              Go to Builder to Publish
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
