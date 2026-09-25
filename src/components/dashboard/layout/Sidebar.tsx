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
      className="sticky top-0 z-40 hidden h-screen w-max self-start flex-col border-r border-gray-100 bg-white py-2 lg:flex"
      aria-label="Primary"
    >
      <nav className="w-max overflow-y-auto p-3">
        <ul className="w-max space-y-1">
          {items.map((it) => (
            <li key={it.name}>
              <button
                onClick={() => onSelect(it.name)}
                className={`inline-flex w-fit items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-[14px] transition
                  ${
                    active === it.name
                      ? "bg-[#91ADF6] text-blue-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <span className="shrink-0">{it.icon}</span>
                <span>{it.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
