"use client";

import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";

const DOCS = [
  { slug: "privacy-policy", label: "Политика обработки персональных данных субъектов ООО «SHORTWAY»" },
  { slug: "terms-of-service", label: "Пользовательское соглашение" },
  { slug: "cookie-policy", label: "Политика использования файлов cookie" },
  { slug: "listing-rules", label: "Правила публикации объявлений" },
];

export default function LegalHubPage() {
  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="max-w-[1400px] mx-auto py-8 sm:py-10 px-4 sm:px-6">
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6 overflow-x-auto whitespace-nowrap hide-scrollbar">
          <Link href="/" className="hover:text-gray-700 transition shrink-0">
            Главная
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <span className="text-gray-700 shrink-0">Правила площадки</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">Правила площадки</h1>
        <p className="text-gray-500 mb-8">
          Юридические документы и условия, на основе которых работает BizTorg.
        </p>

        {/* Full width on mobile, 2/3 on large screens — left-aligned (no
            mx-auto) so it starts at the same x-position as the heading
            above rather than centering independently within the page. */}
        <div className="w-full lg:w-2/3 bg-white border border-gray-100 rounded-2xl divide-y divide-gray-100 overflow-hidden">
          {DOCS.map((doc) => (
            <Link
              key={doc.slug}
              href={`/legal/${doc.slug}`}
              className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 shrink-0">
                <FileText className="w-4.5 h-4.5 text-gray-500" />
              </span>
              <span className="flex-1 text-[15px] text-gray-800">{doc.label}</span>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}