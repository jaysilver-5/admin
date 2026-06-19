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
    <div className="lg:hidden sticky top-16 z-30 bg-[#F7F8FA] px-4 py-3 border-b border-gray-200">
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {items.map((it) => (
          <button
            key={it.name}
            onClick={() => onSelect(it.name)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border
              ${
                active === it.name
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-200"
              }`}
          >
            {it.icon}
            <span>{it.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
