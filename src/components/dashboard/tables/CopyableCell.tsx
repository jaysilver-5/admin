"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

type CopyableCellProps = {
  value?: React.ReactNode;
  copyValue?: string | number | null;
  label?: string;
  className?: string;
  lines?: 1 | 2;
  mono?: boolean;
};

const deletedValue = (value: string) =>
  value.startsWith("deleted_") || value.endsWith("@deleted.local");

export default function CopyableCell({
  value,
  copyValue,
  label = "value",
  className = "",
  lines = 1,
  mono = false,
}: CopyableCellProps) {
  const raw = String(copyValue ?? value ?? "").trim();
  const isDeleted = deletedValue(raw);
  const display = isDeleted ? "Deleted user" : value || "—";
  const textToCopy = isDeleted ? "Deleted user" : raw;
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!textToCopy || textToCopy === "—") return;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };

  const clamp = lines === 2
    ? "line-clamp-2 whitespace-normal break-words"
    : "truncate whitespace-nowrap";

  return (
    <div className={`group/cell relative flex min-w-0 items-center gap-1 ${className}`}>
      <span
        className={`min-w-0 flex-1 ${clamp} ${mono ? "font-mono text-xs" : ""}`}
        title={isDeleted ? "Deleted user" : raw || undefined}
      >
        {display}
      </span>
      {textToCopy && textToCopy !== "—" && (
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-transparent text-gray-400 opacity-0 transition hover:border-gray-200 hover:bg-white hover:text-gray-700 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 group-hover/cell:opacity-100 group-focus-within/cell:opacity-100"
          aria-label={copied ? `${label} copied` : `Copy ${label}`}
          title={copied ? "Copied" : `Copy ${label}`}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      )}
      <span className="sr-only" aria-live="polite">{copied ? `${label} copied` : ""}</span>
    </div>
  );
}
