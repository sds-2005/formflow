import { notFound } from "next/navigation";

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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-4 text-3xl font-bold text-gray-900">{form.title}</h1>
        
        {form.questions.length === 0 ? (
          <p className="text-gray-500">This form has no questions.</p>
        ) : (
          <div className="flex flex-col gap-8 mt-8">
            {form.questions.map((q: any, i: number) => (
              <div key={q.id} className="border-b border-gray-100 pb-8 last:border-0 last:pb-0">
                <h3 className="mb-2 text-xl font-medium text-gray-900">
                  <span className="mr-2 text-gray-400">{i + 1}.</span>
                  {q.title}
                  {q.required && <span className="ml-1 text-red-500">*</span>}
                </h3>
                {q.description && <p className="mb-4 text-gray-500">{q.description}</p>}
                
                {/* Basic rendering placeholder for now */}
                <input
                  type="text"
                  disabled
                  placeholder="Respondent will type answer here..."
                  className="w-full border-b-2 border-gray-300 bg-transparent py-2 text-lg focus:border-black focus:outline-none"
                />
              </div>
            ))}
            <button
              disabled
              className="mt-4 w-full rounded-lg bg-black px-6 py-3 font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
            >
              Submit Form (Coming Soon)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
