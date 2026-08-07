"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Landmark, RefreshCw, WalletCards } from "lucide-react";
import { formatNaira } from "@/lib/api";
import {
  FinanceSummary,
  Reconciliation,
  RevenuePoint,
  fetchFinanceSummary,
  fetchReconciliation,
  fetchRevenueSeries,
} from "@/lib/finance";

const monthRange = () => {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    from: from.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
};

function Change({ value }: { value?: number }) {
  const positive = Number(value || 0) >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${positive ? "text-emerald-600" : "text-red-600"}`}>
      {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
      {Math.abs(Number(value || 0)).toFixed(1)}%
    </span>
  );
}

function MoneyCard({ label, value, change, emphasis }: { label: string; value: number; change?: number; emphasis?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${emphasis ? "border-[#172554] bg-[#172554] text-white" : "border-slate-200 bg-white"}`}>
      <p className={`text-xs font-medium uppercase tracking-[0.12em] ${emphasis ? "text-blue-200" : "text-slate-500"}`}>{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-2xl font-semibold tracking-tight">{formatNaira(value)}</p>
        {change !== undefined && <Change value={change} />}
      </div>
    </div>
  );
}

export default function FinanceTab() {
  const [range, setRange] = React.useState(monthRange);
  const [summary, setSummary] = React.useState<FinanceSummary | null>(null);
  const [series, setSeries] = React.useState<RevenuePoint[]>([]);
  const [reconciliation, setReconciliation] = React.useState<Reconciliation | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [version, setVersion] = React.useState(0);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.all([
      fetchFinanceSummary(range),
      fetchRevenueSeries(range),
      fetchReconciliation(),
    ])
      .then(([nextSummary, nextSeries, nextReconciliation]) => {
        if (!alive) return;
        setSummary(nextSummary);
        setSeries(nextSeries);
        setReconciliation(nextReconciliation);
      })
      .catch((err) => alive && setError(err?.message || "Unable to load finance data"))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [range, version]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Finance</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Revenue and reconciliation</h1>
          <p className="mt-1 text-sm text-slate-500">Gross collections, partner payouts, refunds, and Clothify&apos;s retained revenue.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-2">
          <label className="text-xs text-slate-500">From<input aria-label="Finance start date" type="date" value={range.from} onChange={(e) => setRange((v) => ({ ...v, from: e.target.value }))} className="ml-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-800" /></label>
          <label className="text-xs text-slate-500">To<input aria-label="Finance end date" type="date" value={range.to} onChange={(e) => setRange((v) => ({ ...v, to: e.target.value }))} className="ml-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-800" /></label>
          <button onClick={() => setVersion((v) => v + 1)} className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200" aria-label="Refresh finance data"><RefreshCw className="h-4 w-4" /></button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {loading && !summary ? <div className="h-40 animate-pulse rounded-2xl bg-slate-200" /> : summary && <>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MoneyCard label="Net platform revenue" value={summary.netPlatformRevenue} change={summary.changes.netPlatformRevenue} emphasis />
          <MoneyCard label="Gross payment volume" value={summary.grossVolume} change={summary.changes.grossVolume} />
          <MoneyCard label="Merchant payouts" value={summary.merchantPayouts} />
          <MoneyCard label="Rider payouts" value={summary.riderPayouts} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold text-slate-900">Revenue movement</h2><p className="text-xs text-slate-500">Daily gross volume compared with retained revenue</p></div></div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ left: 4, right: 8 }}>
                  <defs><linearGradient id="gross" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#93c5fd" stopOpacity={0.55}/><stop offset="95%" stopColor="#93c5fd" stopOpacity={0}/></linearGradient><linearGradient id="net" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#172554" stopOpacity={0.45}/><stop offset="95%" stopColor="#172554" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false}/>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8"/>
                  <YAxis tickFormatter={(v) => `₦${Math.round(Number(v) / 100000) / 10}k`} tick={{ fontSize: 11 }} stroke="#94a3b8"/>
                  <Tooltip formatter={(value) => formatNaira(Number(value))}/>
                  <Area type="monotone" dataKey="grossVolume" name="Gross volume" stroke="#60a5fa" fill="url(#gross)" strokeWidth={2}/>
                  <Area type="monotone" dataKey="netPlatformRevenue" name="Net revenue" stroke="#172554" fill="url(#net)" strokeWidth={2}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">Revenue composition</h2>
            <div className="mt-4 space-y-3 text-sm">
              {[
                ["Merchant commission", summary.merchantCommissions],
                ["Logistics fees", summary.logisticsFees],
                ["Speed fees", summary.deliverySpeedFees],
                ["Cancellation fees", summary.cancellationFees],
                ["Refunds", -summary.refunds],
              ].map(([label, amount]) => <div key={String(label)} className="flex items-center justify-between border-b border-slate-100 pb-3"><span className="text-slate-500">{label}</span><span className={`font-semibold ${Number(amount) < 0 ? "text-red-600" : "text-slate-900"}`}>{formatNaira(Number(amount))}</span></div>)}
            </div>
          </section>
        </div>
      </>}

      {reconciliation && <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2"><Landmark className="h-5 w-5 text-blue-700"/><h2 className="font-semibold text-slate-900">Liability and reconciliation snapshot</h2></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl bg-slate-50 p-4"><WalletCards className="h-4 w-4 text-slate-500"/><p className="mt-3 text-xs text-slate-500">User wallets</p><p className="mt-1 font-semibold">{formatNaira(reconciliation.walletLiabilities.users)}</p></div>
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Merchant wallets</p><p className="mt-1 font-semibold">{formatNaira(reconciliation.walletLiabilities.merchants)}</p></div>
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Rider wallets</p><p className="mt-1 font-semibold">{formatNaira(reconciliation.walletLiabilities.riders)}</p></div>
          <div className="rounded-xl bg-amber-50 p-4"><p className="text-xs text-amber-700">Reserved withdrawals</p><p className="mt-1 font-semibold text-amber-950">{formatNaira(reconciliation.reservedWithdrawals.amount)}</p></div>
          <div className={`rounded-xl p-4 ${reconciliation.anomalies.negativeWallets || reconciliation.anomalies.staleWithdrawals ? "bg-red-50" : "bg-emerald-50"}`}><AlertTriangle className="h-4 w-4"/><p className="mt-3 text-xs">Exceptions</p><p className="mt-1 font-semibold">{reconciliation.anomalies.negativeWallets + reconciliation.anomalies.staleWithdrawals}</p></div>
        </div>
      </section>}
    </div>
  );
}
