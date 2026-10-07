"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useParams, usePathname } from "next/navigation";

export default function BuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  const publishMutation = useMutation({
    mutationFn: () => apiClient.forms.publish(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["forms", id] });
      setPublishedUrl(`${window.location.origin}/f/${data.slug}`);
      alert(`Published! URL: ${window.location.origin}/f/${data.slug}`);
    },
  });

  const isResultsPage = pathname?.endsWith("/results");
  const isSharePage = pathname?.endsWith("/share");
  const isCreatePage = !isResultsPage && !isSharePage;

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-gray-50">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Link
            href="/forms"
            className="flex items-center justify-center rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="h-4 w-px bg-gray-300"></div>
          
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <Link 
              href={`/builder/${id}`}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${isCreatePage ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"}`}
            >
              Create
            </Link>
            <Link 
              href={`/builder/${id}/share`}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${isSharePage ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"}`}
            >
              Share
            </Link>
            <Link 
              href={`/builder/${id}/results`}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${isResultsPage ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"}`}
            >
              Results
            </Link>
          </div>
          
          {publishedUrl && (
            <a href={publishedUrl} target="_blank" rel="noreferrer" className="ml-4 text-sm text-blue-600 hover:underline">
              View Published Form
            </a>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/builder/${id}/preview`}
            target="_blank"
            className="rounded-lg px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Preview
          </Link>
          <button 
            onClick={() => publishMutation.mutate()}
            disabled={publishMutation.isPending}
            className="rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
          >
            {publishMutation.isPending ? "Publishing..." : "Publish"}
          </button>
        </div>
      </header>
      <main className="flex min-h-0 flex-1">{children}</main>
    </div>
  );
}
