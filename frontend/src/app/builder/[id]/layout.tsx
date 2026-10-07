"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useParams } from "next/navigation";

export default function BuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
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
          <span className="font-semibold text-gray-900">Builder</span>
          
          {publishedUrl && (
            <a href={publishedUrl} target="_blank" rel="noreferrer" className="ml-4 text-sm text-blue-600 hover:underline">
              View Published Form
            </a>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-lg px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100">
            Preview
          </button>
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
