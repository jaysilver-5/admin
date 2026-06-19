// app/(dashboard)/price/PriceManagementTab.tsx
"use client";

import * as React from "react";
import { ChevronDown, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";

const percentOptions = Array.from({ length: 20 }, (_, i) => (i + 1) * 5);
const money = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 }).format(n);

function Select({ value, onChange, options, placeholder, className = "" }: { value: string | number; onChange: (v: string) => void; options: Array<string | number>; placeholder?: string; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-[44px] appearance-none rounded-md border border-gray-300 bg-white px-3 pr-9 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-blue-500">
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((o) => <option key={String(o)} value={String(o)}>{String(o)}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className={`relative h-5 w-9 rounded-full transition ${checked ? "bg-[#0B1E5B]" : "bg-gray-300"}`} aria-pressed={checked} type="button">
      <span className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white transition ${checked ? "right-[2px]" : "left-[2px]"}`} />
    </button>
  );
}

type PriceTab = "users" | "merchant" | "riders";

type ServiceFee = { id: string; vehicleType: "BIKE" | "CAR"; deliveryType: "NORMAL" | "EXPRESS" | "SUPER_EXPRESS"; percentage: number; isActive?: boolean };
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
  const [fees, setFees] = React.useState<ServiceFee[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    apiFetch<ServiceFee[]>("/admin/config/service-fees").then(setFees).catch((err) => setMessage(err?.message || "Unable to load service fees"));
  }, []);

  const getFee = (vehicleType: ServiceFee["vehicleType"], deliveryType: ServiceFee["deliveryType"]) => fees.find((f) => f.vehicleType === vehicleType && f.deliveryType === deliveryType);
  const setFeeValue = (vehicleType: ServiceFee["vehicleType"], deliveryType: ServiceFee["deliveryType"], percentage: number) => {
    setFees((prev) => {
      const existing = prev.find((f) => f.vehicleType === vehicleType && f.deliveryType === deliveryType);
      if (existing) return prev.map((f) => f.id === existing.id ? { ...f, percentage } : f);
      return [...prev, { id: `new-${vehicleType}-${deliveryType}`, vehicleType, deliveryType, percentage, isActive: true }];
    });
  };

  const rows: Array<[string, ServiceFee["vehicleType"], ServiceFee["deliveryType"]]> = [
    ["Bike Normal washing", "BIKE", "NORMAL"],
    ["Car Normal washing", "CAR", "NORMAL"],
    ["Bike Express washing", "BIKE", "EXPRESS"],
    ["Car Express washing", "CAR", "EXPRESS"],
    ["Bike super express washing", "BIKE", "SUPER_EXPRESS"],
    ["Car super express washing", "CAR", "SUPER_EXPRESS"],
  ];

  const save = async () => {
    setSaving(true); setMessage(null);
    try {
      await Promise.all(fees.map((f) => f.id.startsWith("new-")
        ? apiFetch("/admin/config/service-fees", { method: "POST", body: JSON.stringify({ vehicleType: f.vehicleType, deliveryType: f.deliveryType, percentage: Number(f.percentage) }) })
        : apiFetch(`/admin/config/service-fees/${f.id}`, { method: "PATCH", body: JSON.stringify({ percentage: Number(f.percentage), isActive: f.isActive ?? true }) })
      ));
      setFees(await apiFetch<ServiceFee[]>("/admin/config/service-fees"));
      setMessage("Updated successfully");
    } catch (err: any) { setMessage(err?.message || "Unable to update service fees"); }
    finally { setSaving(false); }
  };

  return <div className="mt-6 max-w-[580px] space-y-5">
    {message && <div className="text-sm text-gray-600">{message}</div>}
    {rows.map(([label, vehicle, delivery]) => {
      const fee = getFee(vehicle, delivery);
      return <div key={`${vehicle}-${delivery}`}><div className="mb-1 text-[12px] text-gray-600">{label}</div><Select value={`${fee?.percentage ?? 25}%`} onChange={(v) => setFeeValue(vehicle, delivery, stripPercent(v))} options={percentOptions.map((p) => `${p}%`)} /></div>;
    })}
    <div className="pt-2"><button disabled={saving} onClick={save} className="h-11 w-full rounded-md bg-[#0B1E5B] text-white font-semibold">{saving ? "Updating…" : "Update"}</button></div>
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
    {message && <div className="text-sm text-gray-600">{message}</div>}
    {[["Exclusive Merchant percentages", "EXCLUSIVE"], ["Premium Merchant percentages", "PREMIUM"], ["Basic Merchant percentages", "BASIC"]].map(([label, key]) => (
      <div key={key}><div className="mb-1 text-[12px] text-gray-600">{label}</div><Select value={`${tiers[key as Commission["planCategory"]]}%`} onChange={(v) => setTiers((p) => ({ ...p, [key]: stripPercent(v) }))} options={percentOptions.map((p) => `${p}%`)} /></div>
    ))}
    <div className="pt-2"><button disabled={saving} onClick={save} className="h-11 w-full rounded-md bg-[#0B1E5B] text-white font-semibold">{saving ? "Updating…" : "Update"}</button></div>
  </div>;
};

type Tier = { id: string; label: string; minKm: number; maxKm: number; amount: number; enabled: boolean };
const parseRange = (label: string) => {
  const nums = label.match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
  return { minKm: nums[0] ?? 0, maxKm: nums[1] ?? Math.max((nums[0] ?? 0) + 1, 1) };
};

const RidersTab = () => {
  const [percentage, setPercentage] = React.useState("25%");
  const [tiers, setTiers] = React.useState<Tier[]>([]);
  const [newKm, setNewKm] = React.useState({ km: "", amount: "" });
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    Promise.all([apiFetch<any[]>("/admin/config/system"), apiFetch<DistanceTier[]>("/admin/config/rider-distance-pricing")])
      .then(([configs, rows]) => {
        const riderPercent = configs.find((c) => c.key === "RIDER_PERCENTAGE" || c.key === "RIDER_COMMISSION_PERCENT")?.parsedNumber;
        if (riderPercent != null) setPercentage(`${riderPercent}%`);
        setTiers(rows.map((t) => ({ id: t.id, minKm: Number(t.minKm), maxKm: Number(t.maxKm), label: `${t.minKm}km–${t.maxKm}km`, amount: Number(t.amount), enabled: t.isActive !== false })));
      })
      .catch((err) => setMessage(err?.message || "Unable to load rider pricing"));
  }, []);

  const addTier = () => {
    if (!newKm.km || !newKm.amount) return;
    const range = parseRange(newKm.km);
    setTiers((p) => [...p, { id: `new-${crypto.randomUUID()}`, label: `${range.minKm}km–${range.maxKm}km`, minKm: range.minKm, maxKm: range.maxKm, amount: Number(newKm.amount.replace(/[^\d.]/g, "")) || 0, enabled: true }]);
    setNewKm({ km: "", amount: "" });
  };

  const updateTier = (id: string, patch: Partial<Tier>) => setTiers((p) => p.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const save = async () => {
    setSaving(true); setMessage(null);
    try {
      await apiFetch("/admin/config/system/RIDER_PERCENTAGE", { method: "PUT", body: JSON.stringify({ value: String(stripPercent(percentage)), description: "Rider percentage configured from admin panel" }) });
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
    {message && <div className="text-sm text-gray-600">{message}</div>}
    <div><div className="mb-1 text-[12px] text-gray-600">Riders percentages</div><Select value={percentage} onChange={(v) => setPercentage(v)} options={percentOptions.map((p) => `${p}%`)} className="max-w-[580px]" /></div>
    {tiers.map((t) => <div key={t.id} className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-center gap-4"><div><div className="mb-1 text-[12px] text-gray-600">{t.label}</div><Select value={money(t.amount)} onChange={(v) => updateTier(t.id, { amount: Number(String(v).replace(/[^\d.]/g, "")) || 0 })} options={[money(15000), money(20000), money(25000), money(30000), money(35000)]} className="w-full" /></div><div className="sm:justify-self-end"><Toggle checked={t.enabled} onChange={(v) => updateTier(t.id, { enabled: v })} /></div></div>)}
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div><div className="mb-1 text-[12px] text-gray-600">Input kilometer</div><input value={newKm.km} onChange={(e) => setNewKm((p) => ({ ...p, km: e.target.value }))} placeholder="e.g., 600km–650km" className="h-[44px] w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-1 focus:ring-blue-500" /></div><div><div className="mb-1 text-[12px] text-gray-600">Input amount</div><input value={newKm.amount} onChange={(e) => setNewKm((p) => ({ ...p, amount: e.target.value }))} placeholder="₦25,000.00" className="h-[44px] w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-1 focus:ring-blue-500" /></div></div>
    <button onClick={addTier} type="button" className="inline-flex items-center gap-2 text-sm text-gray-700"><Plus className="h-4 w-4" /> Add new kilometer</button>
    <div className="pt-2"><button disabled={saving} onClick={save} className="h-11 w-full rounded-md bg-[#0B1E5B] text-white font-semibold">{saving ? "Saving…" : "Save and Update"}</button></div>
  </div>;
};

export default function PriceManagementTab() {
  const [active, setActive] = React.useState<PriceTab>("users");
  return <div className="bg-transparent"><HeaderTabs active={active} onChange={setActive} /><main className="px-4 sm:px-6 pt-6 pb-10"><div className="rounded-xl bg-white shadow-sm border border-gray-100 p-5 sm:p-8">{active === "users" && <UsersTab />}{active === "merchant" && <MerchantTab />}{active === "riders" && <RidersTab />}</div></main></div>;
}
