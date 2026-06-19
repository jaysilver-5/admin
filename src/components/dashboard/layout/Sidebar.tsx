"use client";
import * as React from "react";

export default function Sidebar({
  items,
  active,
  onSelect,
}: {
  items: { name: string; icon: React.ReactNode }[];
  active: string;
  onSelect: (name: string) => void;
}) {
  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[280px] bg-white py-2 hidden lg:flex flex-col z-40"
      aria-label="Primary"
    >
      <nav className="p-3 overflow-y-auto">
        <ul className="space-y-1">
          {items.map((it) => (
            <li key={it.name}>
              <button
                onClick={() => onSelect(it.name)}
                className={`w-full flex items-center gap-3 rounded-full px-3 py-2.5 text-[14px] transition
                  ${
                    active === it.name
                      ? "bg-[#91ADF6] text-blue-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <span className="shrink-0">{it.icon}</span>
                <span className="truncate">{it.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
