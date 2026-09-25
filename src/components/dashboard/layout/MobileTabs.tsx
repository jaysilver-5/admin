"use client";
import * as React from "react";

export default function MobileTabs({
  items,
  active,
  onSelect,
}: {
  items: { name: string; icon: React.ReactNode }[];
  active: string;
  onSelect: (name: string) => void;
}) {
  return (
    <div className="sticky top-16 z-30 border-b border-gray-200 bg-[#F7F8FA] px-4 py-3 lg:hidden">
      <div className="relative after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-10 after:bg-gradient-to-l after:from-[#F7F8FA] after:to-transparent">
      <div className="flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Admin sections">
        {items.map((it) => (
          <button
            key={it.name}
            onClick={() => onSelect(it.name)}
            role="tab"
            aria-selected={active === it.name}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border
              ${
                active === it.name
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-200"
              }`}
          >
            {it.icon}
            <span className="whitespace-nowrap">{it.name}</span>
          </button>
        ))}
      </div>
      </div>
    </div>
  );
}
