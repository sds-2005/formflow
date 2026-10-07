import Link from "next/link";

export default function BuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-lg px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100">
            Preview
          </button>
          <button className="rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gray-800">
            Publish
          </button>
        </div>
      </header>
      <main className="flex min-h-0 flex-1">{children}</main>
    </div>
  );
}
