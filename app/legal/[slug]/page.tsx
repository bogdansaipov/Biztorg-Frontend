"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LEGAL_DOCS } from "@/app/content/legal";

export default function LegalDocPage() {
  const params = useParams<{ slug: string }>();
  const doc = LEGAL_DOCS[params.slug];

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="max-w-[1400px] mx-auto py-8 sm:py-10 px-4 sm:px-6">
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6 overflow-x-auto whitespace-nowrap hide-scrollbar">
          <Link href="/" className="hover:text-gray-700 transition shrink-0">
            Главная
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <Link href="/legal" className="hover:text-gray-700 transition shrink-0">
            Правила площадки
          </Link>
          {doc && (
            <>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              <span className="text-gray-700 truncate">{doc.title}</span>
            </>
          )}
        </nav>

        {!doc ? (
          <>
            <Link
              href="/legal"
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 -ml-1 w-fit"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Правила площадки</span>
            </Link>
            <p className="text-gray-400">Документ не найден.</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">{doc.title}</h1>
            <p className="text-gray-400 text-sm mb-8">г. Ташкент, {doc.date}</p>

            {/* No boxed card here, matching birbir's actual document page —
                content just flows directly on the page. whitespace-pre-line
                preserves the original document's paragraph breaks exactly
                as authored, without needing to parse it into individual
                <p> elements. */}
            <div className="prose prose-sm sm:prose-base max-w-none whitespace-pre-line text-gray-700 leading-relaxed">
              {doc.content}
            </div>
          </>
        )}
      </div>
    </div>
  );
}