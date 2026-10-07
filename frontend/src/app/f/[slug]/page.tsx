import { notFound } from "next/navigation";
import RespondentFlow from "@/components/respondent-flow";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

async function getForm(slug: string) {
  const res = await fetch(`${BACKEND_URL}/api/v1/public/forms/${slug}`, {
    cache: "no-store", // For now, no-store so we immediately see updates after publish
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Failed to fetch form");
  }
  return res.json();
}

export default async function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await params;
  const form = await getForm(p.slug);

  if (!form) {
    notFound();
  }

  return <RespondentFlow form={form} />;
}
