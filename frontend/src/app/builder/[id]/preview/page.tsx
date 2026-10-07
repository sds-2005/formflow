"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import RespondentFlow from "@/components/respondent-flow";

export default function PreviewPage({
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

  if (formLoading || questionsLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-black"></div>
      </div>
    );
  }

  const previewForm = {
    ...form,
    questions: questions || [],
  };

  return (
    <div className="h-full w-full">
      <RespondentFlow form={previewForm} isPreview={true} />
    </div>
  );
}
