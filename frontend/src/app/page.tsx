"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleEnterWorkspace = async () => {
    setIsLoading(true);
    try {
      await apiClient.auth.createDemoWorkspace();
      // The API proxy will set the HttpOnly cookie for us.
      // Redirect to workspace.
      router.push("/forms");
      router.refresh(); // to trigger middleware/layouts to read new cookie
    } catch (err) {
      console.error(err);
      alert("Failed to create demo workspace. See console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <main className="mx-auto w-full max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
            </svg>
          </div>
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900">
          FormFlow
        </h1>
        <p className="mb-8 text-lg text-gray-600">
          Create beautiful, interactive forms that people actually want to fill out.
        </p>

        <button
          onClick={handleEnterWorkspace}
          disabled={isLoading}
          className="group relative inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-lg bg-black px-8 font-medium text-white transition-all duration-300 hover:bg-gray-800 disabled:bg-gray-400"
        >
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <span className="flex items-center gap-2">
              Enter Demo Workspace
              <svg
                className="transition-transform group-hover:translate-x-1"
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
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          )}
        </button>

        <p className="mt-6 text-sm text-gray-500">
          This creates a temporary demo workspace. No sign-up required.
        </p>
      </main>
    </div>
  );
}
