"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export default function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: form, isLoading: formLoading } = useQuery({
    queryKey: ["forms", id],
    queryFn: () => apiClient.forms.get(id),
  });

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ["forms", id, "questions"],
    queryFn: () => apiClient.questions.list(id),
  });

  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: ["forms", id, "results"],
    queryFn: () => apiClient.forms.results(id),
  });

  if (formLoading || questionsLoading || resultsLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-black"></div>
      </div>
    );
  }

  const submissions = results?.submissions || [];

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-gray-50 p-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{form?.title}</h1>
            <p className="mt-2 text-gray-500">Results and Analytics</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Total Responses</p>
            <p className="mt-1 text-3xl font-bold text-black">{submissions.length}</p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-gray-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <h3 className="text-lg font-medium text-gray-900">No responses yet</h3>
              <p className="mt-1 text-gray-500">Share your form to start collecting data.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">Submitted At</th>
                    {questions?.map((q) => (
                      <th key={q.id} className="px-6 py-4 whitespace-nowrap">{q.title}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {submissions.map((sub: any) => (
                    <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {new Date(sub.submitted_at).toLocaleString()}
                      </td>
                      {questions?.map((q) => (
                        <td key={q.id} className="px-6 py-4">
                          {sub.answers[q.id] || <span className="text-gray-300">-</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
