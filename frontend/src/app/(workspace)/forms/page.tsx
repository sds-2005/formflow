"use client";

import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";

export default function WorkspacePage() {
  const router = useRouter();

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiClient.auth.me(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["forms"],
    queryFn: () => apiClient.forms.list(),
  });

  const createMutation = useMutation({
    mutationFn: (title: string) => apiClient.forms.create({ title }),
    onSuccess: (newForm) => {
      router.push(`/builder/${newForm.id}`);
    },
  });

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome back{user?.display_name ? `, ${user.display_name}` : ""}
          </h1>
          <p className="mt-2 text-gray-600">
            Create a new form or manage your existing ones.
          </p>
        </div>
        <button
          onClick={() => createMutation.mutate("My new form")}
          disabled={createMutation.isPending}
          className="rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:bg-gray-400"
        >
          {createMutation.isPending ? "Creating..." : "+ Create form"}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black"></div>
        </div>
      ) : data?.forms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-500"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">No forms yet</h3>
          <p className="mb-6 max-w-md text-gray-600">
            You haven't created any forms in this demo workspace yet. Click the button above to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data?.forms.map((form) => (
            <Link
              key={form.id}
              href={`/builder/${form.id}`}
              className="group block rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-colors group-hover:bg-black group-hover:text-white">
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
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    form.status === "published"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {form.status}
                </span>
              </div>
              <h3 className="mb-1 truncate text-lg font-semibold text-gray-900">
                {form.title}
              </h3>
              <p className="text-sm text-gray-500">
                {form.response_count} response{form.response_count !== 1 && "s"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
