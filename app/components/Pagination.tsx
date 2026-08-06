"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Page switcher for the listing boards. Kept deliberately small: numbers
 * around the current page, with first/last always reachable.
 */
export default function Pagination({
  page,
  pageCount,
  onChange,
  className = "",
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  className?: string;
}) {
  if (pageCount <= 1) return null;

  const numbers: (number | "gap")[] = [];
  for (let n = 1; n <= pageCount; n++) {
    if (n === 1 || n === pageCount || Math.abs(n - page) <= 1) {
      numbers.push(n);
    } else if (numbers[numbers.length - 1] !== "gap") {
      numbers.push("gap");
    }
  }

  const btn =
    "min-w-9 h-9 px-3 inline-flex items-center justify-center text-xs font-semibold rounded-lg border transition-colors";

  return (
    <nav
      aria-label="Pagination"
      className={`flex items-center justify-center gap-1.5 flex-wrap ${className}`}
    >
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
        className={`${btn} bg-white text-gray-600 border-gray-200 hover:border-gray-300 disabled:opacity-40 disabled:hover:border-gray-200`}
      >
        <ChevronLeft size={15} />
      </button>

      {numbers.map((n, i) =>
        n === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-xs text-gray-400">
            …
          </span>
        ) : (
          <button
            key={n}
            onClick={() => onChange(n)}
            aria-current={n === page ? "page" : undefined}
            className={`${btn} ${
              n === page
                ? "bg-mustard-500 text-gray-900 border-mustard-500"
                : "bg-white text-gray-600 border-gray-200 hover:border-mustard-300 hover:text-mustard-600"
            }`}
          >
            {n}
          </button>
        )
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === pageCount}
        aria-label="Next page"
        className={`${btn} bg-white text-gray-600 border-gray-200 hover:border-gray-300 disabled:opacity-40 disabled:hover:border-gray-200`}
      >
        <ChevronRight size={15} />
      </button>
    </nav>
  );
}
