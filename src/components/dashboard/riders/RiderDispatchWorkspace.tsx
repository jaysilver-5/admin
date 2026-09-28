"use client";

import * as React from "react";
import {
  AlertTriangle, Bike, CalendarClock, CheckCircle2, Clock3, MapPin,
  Phone, RefreshCw, Search, Settings2, UserRound,
} from "lucide-react";
import {
  assignDispatchRider, DispatchRiderCandidate, fetchDispatchCandidates,
  fetchRiderDispatchAlerts, fetchRiderDispatchSettings, RiderDispatchAlert,
  RiderDispatchSettings, scheduleRiderDispatch, updateRiderDispatchSettings,
} from "@/lib/rider-dispatch";

const EMPTY_SETTINGS: RiderDispatchSettings = { initialRadiusKm: 5, maxRadiusKm: 25, waveSize: 3 };

function ageLabel(value?: string) {
  if (!value) return "Unavailable";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Unavailable";
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function toLocalDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function ErrorBanner({ children }: { children: React.ReactNode }) {
  return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{children}</div>;
}

export default function RiderDispatchWorkspace({ permissions = [] }: { permissions?: string[] }) {
  const granted = React.useMemo(() => new Set(permissions), [permissions]);
  const canManageDispatch = granted.has("orders.manage");
  const canViewSettings = granted.has("pricing.read");
  const canManageSettings = granted.has("system.manage");
  const [workspaceTab, setWorkspaceTab] = React.useState<"dispatch" | "radar">("dispatch");
  const [dispatchTab, setDispatchTab] = React.useState<"riders" | "details">("riders");
  const [candidateScope, setCandidateScope] = React.useState<"eligible" | "unavailable">("eligible");
  const [alerts, setAlerts] = React.useState<RiderDispatchAlert[]>([]);
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);
  const [candidates, setCandidates] = React.useState<DispatchRiderCandidate[]>([]);
  const [selectedRiderId, setSelectedRiderId] = React.useState<string | null>(null);
  const [settings, setSettings] = React.useState<RiderDispatchSettings>(EMPTY_SETTINGS);
  const [search, setSearch] = React.useState("");
  const [loadingAlerts, setLoadingAlerts] = React.useState(true);
  const [loadingCandidates, setLoadingCandidates] = React.useState(false);
  const [assigning, setAssigning] = React.useState(false);
  const [savingSettings, setSavingSettings] = React.useState(false);
  const [savingSchedule, setSavingSchedule] = React.useState(false);
  const [scheduledAt, setScheduledAt] = React.useState("");
  const [scheduleNote, setScheduleNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [settingsError, setSettingsError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const selectedAlert = alerts.find((alert) => alert.orderId === selectedOrderId) ?? null;
  const selectedRider = candidates.find((rider) => rider.riderId === selectedRiderId) ?? null;
  const eligibleCandidates = candidates.filter((rider) => rider.available);
  const unavailableCandidates = candidates.filter((rider) => !rider.available);
  const visibleCandidates = candidateScope === "eligible" ? eligibleCandidates : unavailableCandidates;
  const radiusSteps = React.useMemo(() => {
    const initial = Math.max(0.1, Number(settings.initialRadiusKm) || 5);
    const maximum = Math.max(initial, Number(settings.maxRadiusKm) || 25);
    const steps = [initial];
    while (steps[steps.length - 1] < maximum && steps.length < 12) {
      steps.push(Math.min(steps[steps.length - 1] * 2, maximum));
    }
    return steps;
  }, [settings.initialRadiusKm, settings.maxRadiusKm]);

  React.useEffect(() => {
    setScheduledAt(toLocalDateTime(selectedAlert?.scheduledAt));
    setScheduleNote(selectedAlert?.adminNote ?? "");
  }, [selectedAlert?.orderId, selectedAlert?.scheduledAt, selectedAlert?.adminNote]);

  const loadAlerts = React.useCallback(async () => {
    setLoadingAlerts(true);
    setError(null);
    try {
      const next = await fetchRiderDispatchAlerts();
      setAlerts(next);
      setSelectedOrderId((current) => current && next.some((item) => item.orderId === current) ? current : next[0]?.orderId ?? null);
    } catch (err: any) {
      setError(err?.message || "Unable to load unresolved rider dispatches.");
    } finally {
      setLoadingAlerts(false);
    }
  }, []);

  React.useEffect(() => {
    void loadAlerts();
    if (canViewSettings) {
      fetchRiderDispatchSettings().then(setSettings)
        .catch((err: any) => setSettingsError(err?.message || "Unable to load search settings."));
    }
  }, [canViewSettings, loadAlerts]);

  React.useEffect(() => {
    if (!selectedOrderId) {
      setCandidates([]);
      setSelectedRiderId(null);
      return;
    }
    let alive = true;
    setLoadingCandidates(true);
    setError(null);
    setSelectedRiderId(null);
    setCandidateScope("eligible");
    const role = alerts.find((alert) => alert.orderId === selectedOrderId)?.leg ?? "PICKUP";
    fetchDispatchCandidates(selectedOrderId, role)
      .then((next) => { if (alive) setCandidates(next); })
      .catch((err: any) => {
        if (alive) {
          setCandidates([]);
          setError(err?.message || "Unable to load rider candidates.");
        }
      })
      .finally(() => { if (alive) setLoadingCandidates(false); });
    return () => { alive = false; };
  }, [alerts, selectedOrderId]);

  const visibleAlerts = alerts.filter((alert) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [alert.orderNumber, alert.customerName, alert.customerPhone, alert.locationLabel, alert.leg]
      .some((value) => value.toLowerCase().includes(query));
  });

  const assign = async () => {
    if (!selectedAlert || !selectedRider || !selectedRider.available || selectedRider.activeAssignments >= selectedRider.maxAssignments) return;
    setAssigning(true);
    setError(null);
    setSuccess(null);
    try {
      await assignDispatchRider(selectedAlert.orderId, selectedRider.riderId, selectedAlert.leg);
      setSuccess(`${selectedRider.name} was assigned to ${selectedAlert.orderNumber}.`);
      setSelectedRiderId(null);
      await loadAlerts();
    } catch (err: any) {
      setError(err?.message || "Unable to assign this rider.");
    } finally {
      setAssigning(false);
    }
  };

  const saveSettings = async () => {
    const initial = Number(settings.initialRadiusKm);
    const max = Number(settings.maxRadiusKm);
    const waveSize = Math.floor(Number(settings.waveSize));
    if (!Number.isFinite(initial) || initial <= 0 || !Number.isFinite(max) || max <= 0) {
      setSettingsError("Both distances must be positive numbers.");
      return;
    }
    if (max < initial) {
      setSettingsError("Maximum distance must be greater than or equal to the initial distance.");
      return;
    }
    if (!Number.isFinite(waveSize) || waveSize < 1 || waveSize > 20) {
      setSettingsError("Riders per wave must be between 1 and 20.");
      return;
    }
    setSavingSettings(true);
    setSettingsError(null);
    try {
      await updateRiderDispatchSettings({ initialRadiusKm: initial, maxRadiusKm: max, waveSize });
      setSettings({ initialRadiusKm: initial, maxRadiusKm: max, waveSize });
      setSuccess("Radar settings were updated.");
    } catch (err: any) {
      setSettingsError(err?.message || "Unable to update radar settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const saveSchedule = async () => {
    if (!selectedAlert || !scheduledAt) {
      setError("Choose a pickup or delivery date and time.");
      return;
    }
    const date = new Date(scheduledAt);
    if (!Number.isFinite(date.getTime())) {
      setError("Choose a valid pickup or delivery date and time.");
      return;
    }
    setSavingSchedule(true);
    setError(null);
    setSuccess(null);
    try {
      await scheduleRiderDispatch(selectedAlert.orderId, selectedAlert.leg, date.toISOString(), scheduleNote);
      setSuccess(`${selectedAlert.orderNumber} was scheduled for ${date.toLocaleString()}.`);
      await loadAlerts();
    } catch (err: any) {
      setError(err?.message || "Unable to schedule this dispatch.");
    } finally {
      setSavingSchedule(false);
    }
  };

  return (
    <div className="flex min-h-[620px] flex-col gap-3 lg:h-[calc(100dvh-11rem)] lg:overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm" role="tablist" aria-label="Dispatch tools">
          <button type="button" role="tab" aria-selected={workspaceTab === "dispatch"} onClick={() => setWorkspaceTab("dispatch")} className={`rounded-md px-4 py-2 text-sm font-semibold ${workspaceTab === "dispatch" ? "bg-[#0B1E5B] text-white" : "text-gray-600 hover:bg-gray-50"}`}>Live dispatches</button>
          {canViewSettings && <button type="button" role="tab" aria-selected={workspaceTab === "radar"} onClick={() => setWorkspaceTab("radar")} className={`rounded-md px-4 py-2 text-sm font-semibold ${workspaceTab === "radar" ? "bg-[#0B1E5B] text-white" : "text-gray-600 hover:bg-gray-50"}`}>Radar settings</button>}
        </div>
        {workspaceTab === "dispatch" && <button type="button" onClick={() => void loadAlerts()} disabled={loadingAlerts} className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loadingAlerts ? "animate-spin" : ""}`} /> Refresh</button>}
      </div>

      {error && <ErrorBanner>{error}</ErrorBanner>}
      {success && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>}

      {workspaceTab === "radar" ? (
        <section className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#0B1E5B]"><Settings2 className="h-5 w-5" /></span>
              <div><h2 className="text-lg font-semibold text-gray-950">Rider search radar</h2><p className="mt-1 text-sm text-gray-500">Start nearby and double the radius only when no eligible rider is found.</p></div>
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              <label className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 text-sm font-semibold text-gray-800">Initial radius <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] text-blue-800">Recommended: 5 km</span><input aria-label="Initial search radius in kilometres" type="number" min="0.1" step="0.1" value={settings.initialRadiusKm} onChange={(event) => setSettings((current) => ({ ...current, initialRadiusKm: Number(event.target.value) }))} className="mt-3 h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /><span className="mt-2 block text-xs font-normal text-gray-500">The first and fastest search area.</span></label>
              <label className="rounded-xl border border-gray-200 p-4 text-sm font-semibold text-gray-800">Maximum radius<input aria-label="Maximum search radius in kilometres" type="number" min="0.1" step="0.1" value={settings.maxRadiusKm} onChange={(event) => setSettings((current) => ({ ...current, maxRadiusKm: Number(event.target.value) }))} className="mt-3 h-11 w-full rounded-lg border border-gray-200 px-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /><span className="mt-2 block text-xs font-normal text-gray-500">Search stops here and alerts an admin.</span></label>
              <label className="rounded-xl border border-gray-200 p-4 text-sm font-semibold text-gray-800">Riders per wave<input aria-label="Riders notified per wave" type="number" min="1" max="20" step="1" value={settings.waveSize} onChange={(event) => setSettings((current) => ({ ...current, waveSize: Number(event.target.value) }))} className="mt-3 h-11 w-full rounded-lg border border-gray-200 px-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /><span className="mt-2 block text-xs font-normal text-gray-500">Nearest eligible riders notified together.</span></label>
            </div>
            <div className="mt-6 rounded-xl border border-gray-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-gray-900">Search progression</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {radiusSteps.map((radius, index) => <React.Fragment key={`${radius}-${index}`}><span className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-sm font-semibold text-[#0B1E5B]">{radius} km</span>{index < radiusSteps.length - 1 && <span className="text-gray-400">→</span>}</React.Fragment>)}
              </div>
              <p className="mt-3 text-xs leading-5 text-gray-500">A rider must be online, verified, within capacity, and have sent a GPS update in the last 15 minutes. Distance alone does not make a rider eligible.</p>
            </div>
            {settingsError && <p role="alert" className="mt-4 text-sm text-red-600">{settingsError}</p>}
            {canManageSettings && <button type="button" onClick={() => void saveSettings()} disabled={savingSettings} className="mt-5 h-11 rounded-lg bg-[#0B1E5B] px-5 text-sm font-semibold text-white hover:bg-[#10276e] disabled:opacity-50">{savingSettings ? "Saving…" : "Save radar settings"}</button>}
          </div>
        </section>
      ) : (
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <section className="flex min-h-0 flex-col rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-50 text-amber-700"><AlertTriangle className="h-5 w-5" /></span><div><h2 className="font-semibold text-gray-950">Needs attention</h2><p className="text-xs text-gray-500">{alerts.length} unresolved dispatch{alerts.length === 1 ? "" : "es"}</p></div></div>
            <div className="relative mt-3"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order or customer" className="h-10 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></div>
            <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {loadingAlerts && <div className="py-10 text-center text-sm text-gray-500">Loading dispatches…</div>}
              {!loadingAlerts && visibleAlerts.map((alert) => {
                const selected = alert.orderId === selectedOrderId;
                return <button key={`${alert.orderId}-${alert.leg}`} type="button" onClick={() => setSelectedOrderId(alert.orderId)} className={`w-full rounded-xl border p-3 text-left transition ${selected ? "border-blue-300 bg-blue-50/70 ring-1 ring-blue-100" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate font-semibold text-gray-950">{alert.orderNumber}</p><p className="mt-0.5 truncate text-sm text-gray-700">{alert.customerName}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${alert.leg === "PICKUP" ? "bg-blue-100 text-blue-800" : "bg-violet-100 text-violet-800"}`}>{alert.leg}</span></div><p className="mt-2 truncate text-xs text-gray-500">{alert.locationLabel}</p><p className="mt-1 text-xs text-gray-500">{ageLabel(alert.createdAt)}</p></button>;
              })}
              {!loadingAlerts && visibleAlerts.length === 0 && <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center"><CheckCircle2 className="mx-auto h-7 w-7 text-emerald-500" /><p className="mt-2 text-sm font-medium text-gray-700">No unresolved dispatches</p></div>}
            </div>
          </section>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            {!selectedAlert ? <div className="grid h-full place-items-center p-8 text-center text-sm text-gray-500">Select a dispatch to review its riders and details.</div> : <>
              <div className="border-b border-gray-100 px-5 pt-4">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h2 className="font-semibold text-gray-950">{selectedAlert.orderNumber}</h2><span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">{selectedAlert.status}</span></div><p className="mt-1 text-sm text-gray-500">{selectedAlert.customerName} · {selectedAlert.locationLabel}</p></div><div className="text-right text-xs text-gray-500"><p>{selectedAlert.attempts || 1} search attempt{selectedAlert.attempts === 1 ? "" : "s"}</p>{selectedAlert.lastRadiusKm !== undefined && <p className="mt-1 font-medium text-gray-700">Reached {selectedAlert.lastRadiusKm} km</p>}</div></div>
                <div className="mt-4 flex gap-5" role="tablist" aria-label="Selected dispatch"><button type="button" role="tab" aria-selected={dispatchTab === "riders"} onClick={() => setDispatchTab("riders")} className={`border-b-2 pb-3 text-sm font-semibold ${dispatchTab === "riders" ? "border-[#0B1E5B] text-[#0B1E5B]" : "border-transparent text-gray-500"}`}>Riders</button><button type="button" role="tab" aria-selected={dispatchTab === "details"} onClick={() => setDispatchTab("details")} className={`border-b-2 pb-3 text-sm font-semibold ${dispatchTab === "details" ? "border-[#0B1E5B] text-[#0B1E5B]" : "border-transparent text-gray-500"}`}>Details & schedule</button></div>
              </div>

              {dispatchTab === "riders" ? <>
                <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3"><div className="flex rounded-lg bg-gray-100 p-1" role="tablist" aria-label="Rider eligibility"><button type="button" onClick={() => setCandidateScope("eligible")} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${candidateScope === "eligible" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-600"}`}>Eligible {eligibleCandidates.length}</button><button type="button" onClick={() => setCandidateScope("unavailable")} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${candidateScope === "unavailable" ? "bg-white text-amber-700 shadow-sm" : "text-gray-600"}`}>Unavailable {unavailableCandidates.length}</button></div><p className="hidden text-xs text-gray-500 sm:block">Nearest riders first</p></div>
                <div className="min-h-0 flex-1 overflow-y-auto p-5">
                  {loadingCandidates && <div className="py-12 text-center text-sm text-gray-500">Checking rider availability…</div>}
                  {!loadingCandidates && visibleCandidates.length > 0 && <div className="grid gap-3 xl:grid-cols-2">{visibleCandidates.map((rider) => {
                    const selected = rider.riderId === selectedRiderId;
                    const full = rider.activeAssignments >= rider.maxAssignments;
                    return <button key={rider.riderId} type="button" disabled={!rider.available || !canManageDispatch} onClick={() => setSelectedRiderId(rider.riderId)} className={`rounded-xl border p-4 text-left transition ${!rider.available ? "cursor-default border-gray-200 bg-gray-50" : selected ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100" : "border-gray-200 hover:border-blue-200 hover:bg-blue-50/30"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-gray-950">{rider.name}</p><p className="mt-0.5 truncate text-xs text-gray-500">ID: {rider.identifier || rider.riderId}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${full ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"}`}>{rider.activeAssignments}/{rider.maxAssignments}</span></div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-600"><span className="inline-flex items-center gap-1"><Bike className="h-3.5 w-3.5" /> {rider.vehicle}</span>{rider.distanceKm !== undefined && <span>{rider.distanceKm.toFixed(1)} km away</span>}<span className={rider.available ? "font-medium text-emerald-700" : "font-medium text-amber-700"}>{rider.available ? "Available now" : rider.isOnline && !rider.locationFresh ? `GPS last seen ${ageLabel(rider.locationUpdatedAt)}` : rider.isOnline ? "Online" : "Offline"}</span></div>{rider.ineligibilityReasons.length > 0 && <ul className="mt-2 space-y-1 text-xs text-amber-700">{rider.ineligibilityReasons.slice(0, 2).map((reason) => <li key={reason}>• {reason}</li>)}</ul>}</button>;
                  })}</div>}
                  {!loadingCandidates && visibleCandidates.length === 0 && candidateScope === "eligible" && <div className="mx-auto max-w-md rounded-xl border border-dashed border-amber-200 bg-amber-50/50 px-6 py-10 text-center"><AlertTriangle className="mx-auto h-7 w-7 text-amber-600" /><p className="mt-2 font-semibold text-gray-900">No rider is eligible right now</p><p className="mt-1 text-sm leading-5 text-gray-600">Distance is only one check. Review the unavailable list for the exact offline, stale GPS, capacity, or radius reason.</p>{unavailableCandidates.length > 0 && <button type="button" onClick={() => setCandidateScope("unavailable")} className="mt-4 text-sm font-semibold text-blue-700 hover:underline">View {unavailableCandidates.length} unavailable rider{unavailableCandidates.length === 1 ? "" : "s"}</button>}</div>}
                  {!loadingCandidates && visibleCandidates.length === 0 && candidateScope === "unavailable" && <div className="py-12 text-center text-sm text-gray-500">No unavailable riders to show.</div>}
                </div>
                {canManageDispatch && <div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-100 bg-white px-5 py-3"><p className="truncate text-sm text-gray-600">{selectedRider ? <><strong className="text-gray-900">{selectedRider.name}</strong> will receive this assignment.</> : eligibleCandidates.length ? "Select an eligible rider." : "No rider can be assigned yet."}</p><button type="button" onClick={() => void assign()} disabled={!selectedRider || assigning || !selectedRider.available} className="h-10 shrink-0 rounded-lg bg-[#0B1E5B] px-5 text-sm font-semibold text-white hover:bg-[#10276e] disabled:cursor-not-allowed disabled:opacity-45">{assigning ? "Assigning…" : "Assign rider"}</button></div>}
              </> : <div className="min-h-0 flex-1 overflow-y-auto p-5"><div className="grid gap-5 xl:grid-cols-2"><div className="rounded-xl border border-gray-200 bg-gray-50 p-4"><h3 className="font-semibold text-gray-950">Dispatch detail</h3><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-1"><div><dt className="text-xs uppercase tracking-wide text-gray-500">Customer</dt><dd className="mt-1 flex items-center gap-2 font-medium text-gray-900"><UserRound className="h-4 w-4 text-gray-400" /> {selectedAlert.customerName}</dd></div><div><dt className="text-xs uppercase tracking-wide text-gray-500">Contact</dt><dd className="mt-1">{selectedAlert.customerPhone ? <a href={`tel:${selectedAlert.customerPhone}`} className="inline-flex items-center gap-2 font-medium text-blue-700 hover:underline"><Phone className="h-4 w-4" /> {selectedAlert.customerPhone}</a> : <span className="text-gray-500">Unavailable</span>}</dd></div><div><dt className="text-xs uppercase tracking-wide text-gray-500">{selectedAlert.leg === "PICKUP" ? "Pickup" : "Delivery"} location</dt><dd className="mt-1 flex items-start gap-2 text-gray-800"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" /> {selectedAlert.locationLabel}</dd></div><div><dt className="text-xs uppercase tracking-wide text-gray-500">Reason escalated</dt><dd className="mt-1 text-gray-800">{selectedAlert.reason}</dd></div><div><dt className="text-xs uppercase tracking-wide text-gray-500">Waiting</dt><dd className="mt-1 flex items-center gap-2 text-gray-800"><Clock3 className="h-4 w-4 text-gray-400" /> {ageLabel(selectedAlert.createdAt)}</dd></div></dl></div>{canManageDispatch && <div className="rounded-xl border border-gray-200 p-4"><div className="flex items-center gap-2"><CalendarClock className="h-5 w-5 text-[#0B1E5B]" /><h3 className="font-semibold text-gray-950">Schedule manually</h3></div><p className="mt-1 text-xs text-gray-500">Record an agreed pickup or delivery window.</p><label className="mt-4 block text-xs font-medium text-gray-700">Date and time<input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label><label className="mt-3 block text-xs font-medium text-gray-700">Admin note (optional)<textarea rows={4} value={scheduleNote} onChange={(event) => setScheduleNote(event.target.value)} placeholder="Call outcome, landmark, or handoff note" className="mt-1.5 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label><button type="button" onClick={() => void saveSchedule()} disabled={!scheduledAt || savingSchedule} className="mt-3 h-10 w-full rounded-lg border border-[#0B1E5B] bg-white px-4 text-sm font-semibold text-[#0B1E5B] hover:bg-blue-50 disabled:opacity-45">{savingSchedule ? "Saving…" : selectedAlert.scheduledAt ? "Update schedule" : "Save schedule"}</button></div>}</div></div>}
            </>}
          </section>
        </div>
      )}
    </div>
  );
}
