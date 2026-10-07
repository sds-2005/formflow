"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";

export default function WorkspacePage() {
  const [creatorName, setCreatorName] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      try {
        const me = await apiClient.auth.me();
        setCreatorName(me.display_name);
      } catch (err) {
        console.error("Failed to load user info:", err);
        // Might be logged out or token expired
        router.push("/");
      }
    }
    loadUser();
  }, [router]);

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome back{creatorName ? `, ${creatorName}` : ""}
          </h1>
          <p className="mt-2 text-gray-600">
            Create a new form or manage your existing ones.
          </p>
        </div>
        <button className="rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800">
          + Create form
        </button>
      </div>

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
    </div>
  );
}
