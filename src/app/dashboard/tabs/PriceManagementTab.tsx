// app/(dashboard)/price/PriceManagementTab.tsx
"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";

const money = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 }).format(n);

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className={`relative h-5 w-9 rounded-full transition ${checked ? "bg-[#0B1E5B]" : "bg-gray-300"}`} aria-pressed={checked} type="button">
      <span className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white transition ${checked ? "right-[2px]" : "left-[2px]"}`} />
    </button>
  );
}

type PriceTab = "users" | "merchant" | "riders";

type SpeedFee = { id?: string; deliveryType: "EXPRESS" | "SUPER_EXPRESS"; percentage: number; maxDurationMinutes: number; isActive: boolean };
type Commission = { id?: string; planCategory: "EXCLUSIVE" | "PREMIUM" | "BASIC"; commissionPercent: number; isActive?: boolean };
type DistanceTier = { id: string; minKm: number; maxKm: number; amount: number; isActive?: boolean };

const HeaderTabs = ({ active, onChange }: { active: PriceTab; onChange: (t: PriceTab) => void }) => {
  const Tab = ({ k, label }: { k: PriceTab; label: string }) => {
    const is = active === k;
    return <button onClick={() => onChange(k)} className={`relative px-2 pb-3 text-[18px] sm:text-[16px] font-normal leading-none ${is ? "text-[#0B1E5B] font-semibold" : "text-gray-500"}`}>{label}{is && <span className="absolute left-0 right-0 mx-auto -bottom-[1px] h-[2px] w-[80px] bg-[#0B1E5B] rounded-full" />}</button>;
  };
  return <div className="border-b border-gray-100"><div className="flex items-center gap-10"><Tab k="users" label="Users" /><Tab k="merchant" label="Merchant" /><Tab k="riders" label="Riders" /></div></div>;
};

const stripPercent = (v: string) => Number(String(v).replace(/[^\d.]/g, "")) || 0;

const UsersTab = () => {
  const [fees, setFees] = React.useState<SpeedFee[]>([
    { deliveryType: "SUPER_EXPRESS", percentage: 0, maxDurationMinutes: 300, isActive: true },
    { deliveryType: "EXPRESS", percentage: 0, maxDurationMinutes: 2880, isActive: true },
  ]);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    apiFetch<SpeedFee[]>("/admin/config/delivery-speed-fees")
      .then((rows) => setFees((defaults) => defaults.map((item) => rows.find((row) => row.deliveryType === item.deliveryType) ?? item)))
      .catch((err) => setMessage(err?.message || "Unable to load speed fee settings"));
  }, []);

  const updateFee = (deliveryType: SpeedFee["deliveryType"], patch: Partial<SpeedFee>) =>
    setFees((current) => current.map((fee) => fee.deliveryType === deliveryType ? { ...fee, ...patch } : fee));

  const save = async () => {
    setSaving(true); setMessage(null);
    try {
      await Promise.all(fees.map((fee) => apiFetch(`/admin/config/delivery-speed-fees/${fee.deliveryType}`, {
        method: "PUT",
        body: JSON.stringify({ percentage: Number(fee.percentage), maxDurationMinutes: Number(fee.maxDurationMinutes), isActive: fee.isActive }),
      })));
      setFees(await apiFetch<SpeedFee[]>("/admin/config/delivery-speed-fees"));
      setMessage("Speed fees and delivery promises updated");
    } catch (err: any) { setMessage(err?.message || "Unable to update speed fee settings"); }
    finally { setSaving(false); }
  };

  return <div className="mt-6 max-w-[760px] space-y-5">
    <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950">
      <div className="font-semibold">Speed fee paid by the customer</div>
      <p className="mt-1 text-blue-900/80">This is a Clothify surcharge on the merchant&apos;s service subtotal only. Rider pickup and delivery charges are excluded. If the merchant misses the promise measured from successful payment until clothes are marked ready, this surcharge is automatically returned to the customer&apos;s wallet.</p>
    </div>
    {message && <div className="text-sm text-gray-600">{message}</div>}
    {fees.map((fee) => {
      const exampleFee = 10000 * (fee.percentage / 100);
      const hours = fee.maxDurationMinutes / 60;
      const durationText = hours >= 24 && hours % 24 === 0
        ? `${hours} hours (${hours / 24} ${hours / 24 === 1 ? "day" : "days"})`
        : `${hours} ${hours === 1 ? "hour" : "hours"}`;
      return <div key={fee.deliveryType} className="rounded-lg border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-4"><div><div className="font-semibold text-gray-900">{fee.deliveryType === "SUPER_EXPRESS" ? "Super Express" : "Express"}</div><div className="mt-1 text-xs leading-5 text-gray-500">{fee.deliveryType === "SUPER_EXPRESS" ? "Default promise: clothes ready within 5 hours after successful payment." : "Default promise: clothes ready within 48 hours (2 days) after successful payment."} This can be changed below and does not include rider travel time.</div></div><Toggle checked={fee.isActive} onChange={(isActive) => updateFee(fee.deliveryType, { isActive })} /></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-xs text-gray-600">Speed fee percentage<input type="number" min="0" max="100" step="0.1" value={fee.percentage} onChange={(e) => updateFee(fee.deliveryType, { percentage: Number(e.target.value) })} className="mt-1 h-11 w-full rounded-md border border-gray-300 px-3 text-sm" /></label>
          <label className="text-xs text-gray-600">Maximum time to mark clothes ready (hours)<input type="number" min="0.0167" step="0.5" value={hours} onChange={(e) => updateFee(fee.deliveryType, { maxDurationMinutes: Math.max(1, Math.round(Number(e.target.value) * 60)) })} className="mt-1 h-11 w-full rounded-md border border-gray-300 px-3 text-sm" /><span className="mt-1 block leading-5 text-gray-500">Current promise: the merchant must mark the clothes ready within {durationText} after successful payment.</span></label>
        </div>
        <div className="mt-3 rounded-md bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-600">Example: on a {money(10000)} service subtotal, the customer pays {money(exampleFee)} for {fee.deliveryType === "SUPER_EXPRESS" ? "Super Express" : "Express"}. Logistics is added separately. If the merchant misses the {durationText} processing promise, this speed fee is returned to the customer&apos;s wallet.</div>
      </div>;
    })}
    <div className="pt-2"><button disabled={saving} onClick={save} className="h-11 w-full rounded-md bg-[#0B1E5B] text-white font-semibold">{saving ? "Updating…" : "Save speed settings"}</button></div>
  </div>;
};

const MerchantTab = () => {
  const [tiers, setTiers] = React.useState<Record<Commission["planCategory"], number>>({ EXCLUSIVE: 25, PREMIUM: 25, BASIC: 25 });
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    apiFetch<Commission[]>("/admin/config/merchant-commissions").then((rows) => {
      setTiers((prev) => ({ ...prev, ...Object.fromEntries(rows.map((r) => [r.planCategory, Number(r.commissionPercent || 0)])) } as any));
    }).catch((err) => setMessage(err?.message || "Unable to load merchant percentages"));
  }, []);

  const save = async () => {
    setSaving(true); setMessage(null);
    try {
      await Promise.all((Object.keys(tiers) as Commission["planCategory"][]).map((planCategory) => apiFetch(`/admin/config/merchant-commissions/${planCategory}`, { method: "PATCH", body: JSON.stringify({ commissionPercent: tiers[planCategory], isActive: true }) })));
      setMessage("Updated successfully");
    } catch (err: any) { setMessage(err?.message || "Unable to update merchant percentages"); }
    finally { setSaving(false); }
  };

  return <div className="mt-6 max-w-[580px] space-y-5">
    <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-950">
      <div className="font-semibold">Merchant commission retained by Clothify</div>
      <p className="mt-1 text-amber-900/80">This percentage is deducted from the merchant&apos;s service subtotal. It does not include rider logistics or the customer&apos;s Express speed fee.</p>
      <p className="mt-2 text-xs text-amber-900/70">Example at 25%: for {money(10000)} of laundry services, the merchant receives {money(7500)} and Clothify retains {money(2500)}.</p>
    </div>
    {message && <div className="text-sm text-gray-600">{message}</div>}
    {[["Exclusive plan commission", "EXCLUSIVE"], ["Premium plan commission", "PREMIUM"], ["Basic plan commission", "BASIC"]].map(([label, key]) => (
      <label key={key} className="block text-[12px] text-gray-600">{label}<div className="relative mt-1"><input type="number" min="0" max="100" step="0.1" value={tiers[key as Commission["planCategory"]]} onChange={(e) => setTiers((p) => ({ ...p, [key]: Number(e.target.value) }))} className="h-11 w-full rounded-md border border-gray-300 px-3 pr-9 text-sm" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">%</span></div></label>
    ))}
    <div className="pt-2"><button disabled={saving} onClick={save} className="h-11 w-full rounded-md bg-[#0B1E5B] text-white font-semibold">{saving ? "Updating…" : "Save merchant commissions"}</button></div>
  </div>;
};

type Tier = { id: string; label: string; minKm: number; maxKm: number; amount: number; enabled: boolean };
const parseRange = (label: string) => {
  const nums = label.match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
  return { minKm: nums[0] ?? 0, maxKm: nums[1] ?? Math.max((nums[0] ?? 0) + 1, 1) };
};

const RidersTab = () => {
  const [percentage, setPercentage] = React.useState("75");
  const [tiers, setTiers] = React.useState<Tier[]>([]);
  const [newKm, setNewKm] = React.useState({ km: "", amount: "" });
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    Promise.all([apiFetch<any[]>("/admin/config/system"), apiFetch<DistanceTier[]>("/admin/config/rider-distance-pricing")])
      .then(([configs, rows]) => {
        const riderPercent = configs.find((c) => c.key === "RIDER_EARNINGS_PERCENT")?.parsedNumber;
        if (riderPercent != null) setPercentage(String(riderPercent));
        setTiers(rows.map((t) => ({ id: t.id, minKm: Number(t.minKm), maxKm: Number(t.maxKm), label: `${t.minKm}km–${t.maxKm}km`, amount: Number(t.amount), enabled: t.isActive !== false })));
      })
      .catch((err) => setMessage(err?.message || "Unable to load rider pricing"));
  }, []);

  const addTier = () => {
    if (!newKm.km || !newKm.amount) return;
    const range = parseRange(newKm.km);
    setTiers((p) => [...p, { id: `new-${crypto.randomUUID()}`, label: `${range.minKm}km–${range.maxKm}km`, minKm: range.minKm, maxKm: range.maxKm, amount: Math.round((Number(newKm.amount.replace(/[^\d.]/g, "")) || 0) * 100), enabled: true }]);
    setNewKm({ km: "", amount: "" });
  };

  const updateTier = (id: string, patch: Partial<Tier>) => setTiers((p) => p.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const save = async () => {
    setSaving(true); setMessage(null);
    try {
      await apiFetch("/admin/config/system/RIDER_EARNINGS_PERCENT", { method: "PUT", body: JSON.stringify({ value: String(stripPercent(percentage)), description: "Percentage of each logistics leg paid to the assigned rider" }) });
      await Promise.all(tiers.map((t) => t.id.startsWith("new-")
        ? apiFetch("/admin/config/rider-distance-pricing", { method: "POST", body: JSON.stringify({ minKm: t.minKm, maxKm: t.maxKm, amount: t.amount, isActive: t.enabled }) })
        : apiFetch(`/admin/config/rider-distance-pricing/${t.id}`, { method: "PATCH", body: JSON.stringify({ minKm: t.minKm, maxKm: t.maxKm, amount: t.amount, isActive: t.enabled }) })
      ));
      const rows = await apiFetch<DistanceTier[]>("/admin/config/rider-distance-pricing");
      setTiers(rows.map((t) => ({ id: t.id, minKm: Number(t.minKm), maxKm: Number(t.maxKm), label: `${t.minKm}km–${t.maxKm}km`, amount: Number(t.amount), enabled: t.isActive !== false })));
      setMessage("Updated successfully");
    } catch (err: any) { setMessage(err?.message || "Unable to update rider pricing"); }
    finally { setSaving(false); }
  };

  return <div className="mt-6 space-y-5">
    <div className="max-w-[760px] rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-950">
      <div className="font-semibold">Logistics pricing and rider payout</div>
      <p className="mt-1 text-emerald-900/80">The distance tier sets what the customer pays for each logistics leg: customer → merchant and merchant → customer. The rider earns the percentage below from the applicable leg; Clothify retains the remainder.</p>
    </div>
    {message && <div className="text-sm text-gray-600">{message}</div>}
    <label className="block max-w-[580px] text-[12px] text-gray-600">Rider share of each logistics leg<div className="relative mt-1"><input type="number" min="0" max="100" step="0.1" value={percentage} onChange={(e) => setPercentage(e.target.value)} className="h-11 w-full rounded-md border border-gray-300 px-3 pr-9 text-sm" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">%</span></div></label>
    {tiers.map((t) => <div key={t.id} className="grid max-w-[760px] grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_1fr_auto]"><label className="text-[12px] text-gray-600">Distance range<input value={t.label} onChange={(e) => { const range = parseRange(e.target.value); updateTier(t.id, { label: e.target.value, ...range }); }} className="mt-1 h-11 w-full rounded-md border border-gray-300 px-3 text-sm" /></label><label className="text-[12px] text-gray-600">Customer charge per leg (NGN)<input type="number" min="0" step="50" value={t.amount / 100} onChange={(e) => updateTier(t.id, { amount: Math.round(Number(e.target.value) * 100) })} className="mt-1 h-11 w-full rounded-md border border-gray-300 px-3 text-sm" /></label><div className="h-11 flex items-center"><Toggle checked={t.enabled} onChange={(v) => updateTier(t.id, { enabled: v })} /></div></div>)}
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div><div className="mb-1 text-[12px] text-gray-600">Input kilometer</div><input value={newKm.km} onChange={(e) => setNewKm((p) => ({ ...p, km: e.target.value }))} placeholder="e.g., 600km–650km" className="h-[44px] w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-1 focus:ring-blue-500" /></div><div><div className="mb-1 text-[12px] text-gray-600">Input amount</div><input value={newKm.amount} onChange={(e) => setNewKm((p) => ({ ...p, amount: e.target.value }))} placeholder="₦25,000.00" className="h-[44px] w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-1 focus:ring-blue-500" /></div></div>
    <button onClick={addTier} type="button" className="inline-flex items-center gap-2 text-sm text-gray-700"><Plus className="h-4 w-4" /> Add new kilometer</button>
    <div className="max-w-[760px] pt-2"><button disabled={saving} onClick={save} className="h-11 w-full rounded-md bg-[#0B1E5B] text-white font-semibold">{saving ? "Saving…" : "Save rider pricing"}</button></div>
  </div>;
};

export default function PriceManagementTab() {
  const [active, setActive] = React.useState<PriceTab>("users");
  return <div className="bg-transparent"><HeaderTabs active={active} onChange={setActive} /><main className="px-4 sm:px-6 pt-6 pb-10"><div className="rounded-xl bg-white shadow-sm border border-gray-100 p-5 sm:p-8">{active === "users" && <UsersTab />}{active === "merchant" && <MerchantTab />}{active === "riders" && <RidersTab />}</div></main></div>;
}
