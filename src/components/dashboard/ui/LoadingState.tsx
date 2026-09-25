import * as React from "react";

function Bar({ className = "" }: { className?: string }) {
  return <span className={`block rounded-full bg-slate-200 ${className}`} />;
}

export function TableLoadingState({
  rows = 5,
  columns = 5,
  className = "",
  label = "Loading data",
}: {
  rows?: number;
  columns?: number;
  className?: string;
  label?: string;
}) {
  return (
    <div className={`animate-pulse space-y-1 ${className}`} role="status" aria-label={label}>
      <span className="sr-only">{label}…</span>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="grid min-h-12 items-center gap-3 border-b border-slate-100 px-3 py-2.5 last:border-0" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }, (_, column) => (
            <Bar key={column} className={`h-3 ${column === columns - 1 ? "w-1/2 justify-self-end" : column % 2 ? "w-3/4" : "w-full"}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ListLoadingState({ rows = 3, label = "Loading results" }: { rows?: number; label?: string }) {
  return (
    <div className="animate-pulse divide-y divide-slate-100" role="status" aria-label={label}>
      <span className="sr-only">{label}…</span>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex items-center gap-3 px-2 py-3">
          <span className="h-9 w-9 shrink-0 rounded-full bg-slate-200" />
          <span className="min-w-0 flex-1 space-y-2"><Bar className="h-3 w-2/5" /><Bar className="h-2.5 w-3/5" /></span>
          <span className="h-5 w-5 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

export function PageLoadingState({ label = "Loading dashboard" }: { label?: string }) {
  return (
    <div className="min-h-screen bg-[#F7F8FA]" role="status" aria-label={label}>
      <span className="sr-only">{label}…</span>
      <div className="h-16 border-b border-slate-100 bg-white px-6 py-5"><Bar className="h-4 w-44 animate-pulse" /></div>
      <div className="mx-auto max-w-[1440px] animate-pulse space-y-6 p-6">
        <div className="space-y-2"><Bar className="h-6 w-52" /><Bar className="h-3 w-80 max-w-full" /></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><Bar className="h-3 w-24" /><Bar className="mt-5 h-7 w-32" /></div>)}
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"><TableLoadingState rows={6} columns={5} /></div>
      </div>
    </div>
  );
}

export function DashboardContentLoadingState({ label = "Loading dashboard data" }: { label?: string }) {
  return (
    <div className="animate-pulse space-y-6" role="status" aria-label={label}>
      <span className="sr-only">{label}…</span>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><Bar className="h-3 w-24" /><Bar className="mt-5 h-7 w-32" /></div>)}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
        <div className="h-80 rounded-2xl border border-slate-100 bg-white p-5"><Bar className="h-4 w-40" /><div className="mt-8 h-56 rounded-xl bg-slate-100" /></div>
        <div className="h-80 rounded-2xl border border-slate-100 bg-white p-5"><Bar className="h-4 w-32" /><div className="mt-8 space-y-5">{Array.from({ length: 4 }, (_, index) => <Bar key={index} className="h-4 w-full" />)}</div></div>
      </div>
    </div>
  );
}
