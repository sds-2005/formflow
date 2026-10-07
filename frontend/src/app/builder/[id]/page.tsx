"use client";

import { useState, use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export default function BuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  const { data: form, isLoading: formLoading } = useQuery({
    queryKey: ["forms", id],
    queryFn: () => apiClient.forms.get(id),
  });

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ["forms", id, "questions"],
    queryFn: () => apiClient.questions.list(id),
  });

  const createQuestion = useMutation({
    mutationFn: (type: string) => apiClient.questions.create(id, { type, title: `New ${type} question` }),
    onSuccess: (newQ) => {
      queryClient.invalidateQueries({ queryKey: ["forms", id, "questions"] });
      setActiveQuestionId(newQ.id);
    },
  });

  if (formLoading || questionsLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-black"></div>
      </div>
    );
  }

  const activeQuestion = questions?.find((q) => q.id === activeQuestionId);

  return (
    <div className="flex h-full w-full">
      {/* LEFT PANE: Navigator */}
      <div className="flex w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900">Questions</h2>
          <button
            onClick={() => createQuestion.mutate("text")}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-black"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {questions?.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No questions yet. Click + to add one.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {questions?.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setActiveQuestionId(q.id)}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    activeQuestionId === q.id
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-gray-200 text-[10px] font-bold text-gray-500">
                    {i + 1}
                  </span>
                  <span className="truncate">{q.title || "Untitled"}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CENTER PANE: Canvas */}
      <div className="flex flex-1 flex-col overflow-y-auto bg-gray-50">
        <div className="mx-auto w-full max-w-3xl p-8">
          <input
            type="text"
            className="mb-8 w-full border-none bg-transparent text-3xl font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-0"
            defaultValue={form?.title}
            placeholder="Form Title"
            onBlur={(e) => {
              if (e.target.value !== form?.title) {
                apiClient.forms.update(id, { title: e.target.value });
              }
            }}
          />

          {activeQuestion ? (
            <div className="flex w-full h-full items-center justify-center p-8">
              <div className="w-full max-w-3xl space-y-4">
                <div className="flex items-start gap-4">
                  <span className="text-2xl font-bold text-blue-600 flex-shrink-0 mt-1">
                    {questions.findIndex((q) => q.id === activeQuestion.id) + 1} &rarr;
                  </span>
                  <div className="flex-1 space-y-4">
                    <input
                      type="text"
                      className="w-full border-none bg-transparent text-3xl font-medium text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-0"
                      defaultValue={activeQuestion.title}
                      placeholder="Your question here..."
                      onBlur={(e) => {
                        if (e.target.value !== activeQuestion.title) {
                          apiClient.questions.update(id, activeQuestion.id, { title: e.target.value }).then(() => {
                            queryClient.invalidateQueries({ queryKey: ["forms", id, "questions"] });
                          });
                        }
                      }}
                    />
                    <input
                      type="text"
                      className="w-full border-none bg-transparent text-xl text-gray-500 placeholder:text-gray-300 focus:outline-none focus:ring-0"
                      defaultValue={activeQuestion.description || ""}
                      placeholder="Description (optional)"
                      onBlur={(e) => {
                        if (e.target.value !== activeQuestion.description) {
                          apiClient.questions.update(id, activeQuestion.id, { description: e.target.value }).then(() => {
                            queryClient.invalidateQueries({ queryKey: ["forms", id, "questions"] });
                          });
                        }
                      }}
                    />
                    
                    <div className="mt-12 pt-4">
                       {activeQuestion.type === "text" && (
                         <div className="text-2xl text-blue-300 border-b-2 border-blue-200 pb-2 w-full max-w-2xl">Type your answer here...</div>
                       )}
                       {activeQuestion.type === "long_text" && (
                         <div className="text-2xl text-blue-300 border-b-2 border-blue-200 pb-12 w-full max-w-2xl">Type a long answer here...</div>
                       )}
                       {activeQuestion.type === "email" && (
                         <div className="text-2xl text-blue-300 border-b-2 border-blue-200 pb-2 w-full max-w-2xl">name@example.com</div>
                       )}
                       {activeQuestion.type === "number" && (
                         <div className="text-2xl text-blue-300 border-b-2 border-blue-200 pb-2 w-full max-w-2xl">123</div>
                       )}
                       {activeQuestion.type === "phone" && (
                         <div className="text-2xl text-blue-300 border-b-2 border-blue-200 pb-2 w-full max-w-2xl">(555) 555-5555</div>
                       )}
                       {activeQuestion.type === "url" && (
                         <div className="text-2xl text-blue-300 border-b-2 border-blue-200 pb-2 w-full max-w-2xl">https://...</div>
                       )}
                       {activeQuestion.type === "boolean" && (
                         <div className="flex gap-4">
                            <div className="rounded-lg border border-blue-200 bg-blue-50 px-8 py-3 text-xl font-medium text-blue-700">Y / Yes</div>
                            <div className="rounded-lg border border-gray-200 bg-gray-50 px-8 py-3 text-xl font-medium text-gray-500">N / No</div>
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white/50 text-gray-500">
              Select a question to edit, or add a new one.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANE: Inspector */}
      <div className="w-80 shrink-0 border-l border-gray-200 bg-white p-4">
        <h2 className="mb-4 font-semibold text-gray-900">Settings</h2>
        {activeQuestion ? (
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
              <select 
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                value={activeQuestion.type}
                onChange={(e) => {
                  apiClient.questions.update(id, activeQuestion.id, { type: e.target.value }).then(() => {
                    queryClient.invalidateQueries({ queryKey: ["forms", id, "questions"] });
                  });
                }}
              >
                <option value="text">Short Text</option>
                <option value="long_text">Long Text</option>
                <option value="email">Email</option>
                <option value="number">Number</option>
                <option value="phone">Phone Number</option>
                <option value="url">Website URL</option>
                <option value="boolean">Yes/No</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="required" 
                checked={activeQuestion.required} 
                onChange={(e) => {
                  apiClient.questions.update(id, activeQuestion.id, { required: e.target.checked }).then(() => {
                    queryClient.invalidateQueries({ queryKey: ["forms", id, "questions"] });
                  });
                }} 
                className="rounded border-gray-300 text-black focus:ring-black" 
              />
              <label htmlFor="required" className="text-sm font-medium text-gray-700">Required</label>
            </div>
            <div className="mt-8 pt-4 border-t border-gray-200">
              <button 
                onClick={() => {
                  apiClient.questions.delete(id, activeQuestion.id).then(() => {
                    queryClient.invalidateQueries({ queryKey: ["forms", id, "questions"] });
                    setActiveQuestionId(null);
                  });
                }}
                className="w-full rounded-md bg-red-50 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
              >
                Delete Question
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Select a question to view its settings.</p>
        )}
      </div>
    </div>
  );
}
