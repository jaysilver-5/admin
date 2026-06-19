"use client";
import * as React from "react";
import { ChevronLeft, ChevronRight, ArrowLeft, ArrowRight } from "lucide-react";

export default function Pagination({
  page,
  totalPages,
  onChange,
  className = "",
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
  className?: string;
}) {
  // Build a window of up to 5 pages, with ellipses when needed
  const windowSize = 5;

  const build = () => {
    if (totalPages <= windowSize) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    // center around current page when possible
    let start = Math.max(1, page - Math.floor(windowSize / 2));
    let end = start + windowSize - 1;
    if (end > totalPages) {
      end = totalPages;
      start = totalPages - windowSize + 1;
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const windowPages = build();
  const showLeftDots = windowPages[0] > 2;
  const showRightDots = windowPages[windowPages.length - 1] < totalPages - 1;

  const pill = (n: number) => (
    <button
      key={n}
      onClick={() => onChange(n)}
      className={`h-10 w-10 min-w-9 px-3 rounded-full text-sm transition border
        ${
          n === page
            ? "bg-[#233A78] text-white border-blue-600"
            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
        }`}
    >
      {String(n).padStart(2, "0")}
    </button>
  );

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        className="h-10 w-10 rounded-full border bg-[#91ADF6] border-gray-200 hover:bg-gray-50 grid place-items-center"
        aria-label="Previous"
        disabled={page === 1}
      >
        <ArrowLeft className="h-4 w-4 text-gray-700" />
      </button>

      {/* First page & left dots */}
      {totalPages > windowSize && (
        <>
          {windowPages[0] > 1 && pill(1)}
          {showLeftDots && <span className="px-1 text-gray-400">…</span>}
        </>
      )}

      {/* Window */}
      {windowPages.map(pill)}

      {/* Right dots & last page */}
      {totalPages > windowSize && (
        <>
          {showRightDots && <span className="px-1 text-gray-400">…</span>}
          {windowPages[windowPages.length - 1] < totalPages && pill(totalPages)}
        </>
      )}

      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        className="h-10 w-10 rounded-full border border-gray-200 bg-[#91ADF6] hover:bg-gray-50 grid place-items-center"
        aria-label="Next"
        disabled={page === totalPages}
      >
        <ArrowRight className="h-4 w-4 text-gray-700" />
      </button>
    </div>
  );
}
