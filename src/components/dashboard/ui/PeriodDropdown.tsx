"use client";
import * as React from "react";
import { ChevronDown } from "lucide-react";
import { PeriodDropdownProps } from "@/types/dashboard";

export default function PeriodDropdown({
  selectedPeriod,
  onPeriodChange,
  className = "",
}: PeriodDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const periods = ["Today", "This Week", "This Month", "This Year"];

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-[13px] text-gray-500 hover:text-gray-700"
      >
        <span>{selectedPeriod}</span>
        <ChevronDown className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => {
                onPeriodChange(p);
                setOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 ${
                selectedPeriod === p ? "text-blue-600 bg-blue-50" : "text-gray-700"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
