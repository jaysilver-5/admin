"use client";
import * as React from "react";

export default function UserTabs({
  active,
  counts,
  onChange,
}: {
  active: "all" | "new";
  counts: { all: number; new: number };
  onChange: (t: "all" | "new") => void;
}) {
  const Tab = ({
    id,
    label,
    count,
  }: {
    id: "all" | "new";
    label: string;
    count?: number;
  }) => {
    const isActive = active === id;
    return (
      <button
        type="button"
        onClick={() => onChange(id)}
        role="tab"
        aria-selected={isActive}
        className={`relative px-2 py-2 text-sm font-medium ${
          isActive ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
        }`}
      >
        <span>{label}</span>
        {typeof count === "number" && (
          <span className="ml-1 text-gray-400">({count})</span>
        )}
        {/* underline */}
        <span
          className={`absolute left-0 -bottom-[2px] h-[2px] w-full rounded bg-blue-600 transition
            ${isActive ? "opacity-100" : "opacity-0"}`}
        />
      </button>
    );
  };

  return (
    <div className="flex items-center gap-6 overflow-x-auto border-b border-gray-200" role="tablist" aria-label="User status">
      <Tab id="all" label="All users list" count={counts.all} />
      <Tab id="new" label="New User" count={counts.new} />
    </div>
  );
}
