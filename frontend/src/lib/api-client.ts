export type QuestionType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "dropdown"
  | "email"
  | "number"
  | "yes_no"
  | "rating";

export type AnswerValue = string | number | boolean | null;

export interface QuestionOption {
  id: string;
  label: string;
  position: number;
}

export interface Question {
  id: string;
  form_id: string;
  type: QuestionType;
  title: string;
  description: string | null;
  required: boolean;
  position: number;
  settings: Record<string, number | string | boolean>;
  options: QuestionOption[];
}

export interface FormSummary {
  id: string;
  creator_id: string;
  title: string;
  status: "draft" | "published";
  slug: string;
  created_at: string;
  updated_at: string;
  response_count: number;
  question_count: number;
  published_version_id: string | null;
}

export interface PublicForm {
  id: string;
  title: string;
  slug: string;
  version_id?: string;
  questions: Question[];
}

export interface SubmissionRow {
  id: string;
  submitted_at: string;
  answers: Record<string, AnswerValue>;
}

export interface QuestionSummary {
  question_id: string;
  title: string;
  type: QuestionType;
  total_answers: number;
  summary: {
    options?: Array<{ label: string; count: number; percentage: number }>;
    average?: number | null;
    min?: number | null;
    max?: number | null;
    count?: number;
    recent_values?: AnswerValue[];
    total_count?: number;
  };
}

export interface Results {
  total_submissions: number;
  submissions: SubmissionRow[];
  questions: QuestionSummary[];
}

export interface SubmissionDetail {
  id: string;
  submitted_at: string;
  answers: Array<{
    question_id: string;
    question_title: string;
    question_type: QuestionType;
    value: AnswerValue;
  }>;
}

export interface QuestionPayload {
  type?: QuestionType;
  title?: string;
  description?: string | null;
  required?: boolean;
  settings?: Record<string, number | string | boolean>;
  options?: Array<{ id?: string; label: string }>;
}

export class APIError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    const detail =
      typeof data === "object" && data !== null && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : "An API error occurred";
    super(detail);
    this.name = "APIError";
    this.status = status;
    this.data = data;
  }
}

export async function fetchProxy<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  headers.set("X-Requested-With", "XMLHttpRequest");
  const response = await fetch(`/api/proxy/${path}`, { ...options, headers });
  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = { detail: await response.text() };
    }
    throw new APIError(response.status, errorData);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const apiClient = {
  auth: {
    createDemoWorkspace: () =>
      fetchProxy<{ session_id: string; creator_id: string; display_name: string }>("auth/demo", { method: "POST" }),
    me: () => fetchProxy<{ creator_id: string; display_name: string }>("auth/me"),
  },
  forms: {
    list: (search = "") => fetchProxy<{ forms: FormSummary[] }>(`forms${search ? `?search=${encodeURIComponent(search)}` : ""}`),
    get: (id: string) => fetchProxy<FormSummary>(`forms/${id}`),
    create: (data: { title: string }) => fetchProxy<FormSummary>("forms", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: { title: string }) => fetchProxy<FormSummary>(`forms/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => fetchProxy<void>(`forms/${id}`, { method: "DELETE" }),
    duplicate: (id: string) => fetchProxy<FormSummary>(`forms/${id}/duplicate`, { method: "POST" }),
    publish: (id: string) => fetchProxy<FormSummary>(`forms/${id}/publish`, { method: "POST" }),
    unpublish: (id: string) => fetchProxy<FormSummary>(`forms/${id}/unpublish`, { method: "POST" }),
    results: (id: string) => fetchProxy<Results>(`forms/${id}/results`),
    submission: (id: string, submissionId: string) => fetchProxy<SubmissionDetail>(`forms/${id}/results/${submissionId}`),
  },
  questions: {
    list: (formId: string) => fetchProxy<Question[]>(`forms/${formId}/questions`),
    create: (formId: string, data: QuestionPayload) => fetchProxy<Question>(`forms/${formId}/questions`, { method: "POST", body: JSON.stringify(data) }),
    update: (formId: string, questionId: string, data: QuestionPayload) => fetchProxy<Question>(`forms/${formId}/questions/${questionId}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (formId: string, questionId: string) => fetchProxy<void>(`forms/${formId}/questions/${questionId}`, { method: "DELETE" }),
    duplicate: (formId: string, questionId: string) => fetchProxy<Question>(`forms/${formId}/questions/${questionId}/duplicate`, { method: "POST" }),
    reorder: (formId: string, questionIds: string[]) => fetchProxy<Question[]>(`forms/${formId}/questions/reorder`, { method: "PUT", body: JSON.stringify({ question_ids: questionIds }) }),
  },
  public: {
    submit: (slug: string, answers: Record<string, AnswerValue>, versionId: string | undefined, idempotencyKey: string) =>
      fetchProxy<{ id: string }>(`public/forms/${slug}/submissions`, {
        method: "POST",
        body: JSON.stringify({ answers, version_id: versionId, idempotency_key: idempotencyKey }),
      }),
  },
};
