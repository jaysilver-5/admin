"use client";

import * as React from "react";
import {
  AlertTriangle,
  Bike,
  CalendarClock,
  CheckCircle2,
  Clock3,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Settings2,
  UserRound,
} from "lucide-react";

import {
  assignDispatchRider,
  DispatchRiderCandidate,
  fetchDispatchCandidates,
  fetchRiderDispatchAlerts,
  fetchRiderDispatchSettings,
  RiderDispatchAlert,
  RiderDispatchSettings,
  scheduleRiderDispatch,
  updateRiderDispatchSettings,
} from "@/lib/rider-dispatch";

const EMPTY_SETTINGS: RiderDispatchSettings = { initialRadiusKm: 100, maxRadiusKm: 200 };

function ageLabel(value: string) {
  if (!value) return "Age unavailable";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Age unavailable";
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function ErrorBanner({ children }: { children: React.ReactNode }) {
  return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{children}</div>;
}

function toLocalDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function RiderDispatchWorkspace({ permissions = [] }: { permissions?: string[] }) {
  const granted = React.useMemo(() => new Set(permissions), [permissions]);
  const canManageDispatch = granted.has("orders.manage");
  const canViewSettings = granted.has("pricing.read");
  const canManageSettings = granted.has("system.manage");
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
      fetchRiderDispatchSettings()
        .then(setSettings)
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
    const role = alerts.find((alert) => alert.orderId === selectedOrderId)?.leg ?? "PICKUP";
    fetchDispatchCandidates(selectedOrderId, role)
      .then((next) => {
        if (alive) setCandidates(next);
      })
      .catch((err: any) => {
        if (alive) {
          setCandidates([]);
          setError(err?.message || "Unable to load rider candidates.");
        }
      })
      .finally(() => {
        if (alive) setLoadingCandidates(false);
      });
    return () => {
      alive = false;
    };
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
      setSuccess(`${selectedRider.name} was assigned to ${selectedAlert.orderNumber}. The customer and merchant can now be notified.`);
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
    if (!Number.isFinite(initial) || initial <= 0 || !Number.isFinite(max) || max <= 0) {
      setSettingsError("Both distances must be positive numbers.");
      return;
    }
    if (max < initial) {
      setSettingsError("Maximum distance must be greater than or equal to the initial distance.");
      return;
    }
    setSavingSettings(true);
    setSettingsError(null);
    try {
      await updateRiderDispatchSettings({ initialRadiusKm: initial, maxRadiusKm: max });
      setSettings({ initialRadiusKm: initial, maxRadiusKm: max });
      setSuccess("Rider search distances were updated.");
    } catch (err: any) {
      setSettingsError(err?.message || "Unable to update rider search distances.");
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
    <div className="space-y-5">
      <div className={`grid gap-4 ${canViewSettings ? "xl:grid-cols-[minmax(0,1fr)_360px]" : ""}`}>
        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-50 text-amber-700"><AlertTriangle className="h-5 w-5" /></span>
                <div>
                  <h2 className="font-semibold text-gray-950">Unresolved dispatches</h2>
                  <p className="text-sm text-gray-500">Orders where automatic rider matching needs admin help.</p>
                </div>
              </div>
            </div>
            <button type="button" onClick={() => void loadAlerts()} disabled={loadingAlerts} className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loadingAlerts ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>

          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, customer or location" className="h-11 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>

          <div className="mt-4 max-h-[430px] space-y-2 overflow-y-auto pr-1">
            {loadingAlerts && <div className="py-12 text-center text-sm text-gray-500">Loading unresolved dispatches…</div>}
            {!loadingAlerts && visibleAlerts.map((alert) => {
              const selected = alert.orderId === selectedOrderId;
              return (
                <button key={`${alert.orderId}-${alert.leg}`} type="button" onClick={() => setSelectedOrderId(alert.orderId)} className={`w-full rounded-xl border p-4 text-left transition ${selected ? "border-blue-300 bg-blue-50/60 ring-1 ring-blue-100" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-950">{alert.orderNumber}</p>
                      <p className="mt-1 text-sm text-gray-700">{alert.customerName}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${alert.leg === "PICKUP" ? "bg-blue-100 text-blue-800" : "bg-violet-100 text-violet-800"}`}>{alert.leg}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {alert.locationLabel}</span>
                    <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {ageLabel(alert.createdAt)}</span>
                    {alert.scheduledAt && <span className="inline-flex items-center gap-1 font-medium text-blue-700"><CalendarClock className="h-3.5 w-3.5" /> Scheduled {new Date(alert.scheduledAt).toLocaleString()}</span>}
                  </div>
                </button>
              );
            })}
            {!loadingAlerts && visibleAlerts.length === 0 && <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center"><CheckCircle2 className="mx-auto h-7 w-7 text-emerald-500" /><p className="mt-2 text-sm font-medium text-gray-700">No unresolved dispatches</p><p className="mt-1 text-xs text-gray-500">New rider matching failures will appear here.</p></div>}
          </div>
        </section>

        {canViewSettings && <aside className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2"><Settings2 className="h-5 w-5 text-[#0B1E5B]" /><h2 className="font-semibold text-gray-950">Search distance</h2></div>
          <p className="mt-1 text-sm text-gray-500">The system begins nearby, then expands progressively up to the maximum.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <label className="text-sm font-medium text-gray-700">Initial (km)<input type="number" min="0.1" step="0.1" value={settings.initialRadiusKm} onChange={(event) => setSettings((current) => ({ ...current, initialRadiusKm: Number(event.target.value) }))} className="mt-1.5 h-11 w-full rounded-lg border border-gray-200 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
            <label className="text-sm font-medium text-gray-700">Maximum (km)<input type="number" min="0.1" step="0.1" value={settings.maxRadiusKm} onChange={(event) => setSettings((current) => ({ ...current, maxRadiusKm: Number(event.target.value) }))} className="mt-1.5 h-11 w-full rounded-lg border border-gray-200 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
          </div>
          {settingsError && <p role="alert" className="mt-3 text-sm text-red-600">{settingsError}</p>}
          {canManageSettings && <button type="button" onClick={() => void saveSettings()} disabled={savingSettings} className="mt-4 h-10 w-full rounded-lg bg-[#0B1E5B] px-4 text-sm font-semibold text-white hover:bg-[#10276e] disabled:opacity-50">{savingSettings ? "Saving…" : "Save distance settings"}</button>}
          <div className="mt-5 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">Rider capacity is enforced at <strong>5 active orders per trip</strong>. Full riders remain visible for context but cannot be selected.</div>
        </aside>}
      </div>

      {error && <ErrorBanner>{error}</ErrorBanner>}
      {success && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>}

      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        {!selectedAlert ? (
          <div className="py-16 text-center text-sm text-gray-500">Select an unresolved dispatch to review its details and assign a rider.</div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-2"><h3 className="font-semibold text-gray-950">Dispatch detail</h3><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">{selectedAlert.status}</span></div>
              <dl className="mt-4 space-y-4 text-sm">
                <div><dt className="text-xs uppercase tracking-wide text-gray-500">Customer</dt><dd className="mt-1 flex items-center gap-2 font-medium text-gray-900"><UserRound className="h-4 w-4 text-gray-400" /> {selectedAlert.customerName}</dd></div>
                <div><dt className="text-xs uppercase tracking-wide text-gray-500">Contact</dt><dd className="mt-1">{selectedAlert.customerPhone ? <a href={`tel:${selectedAlert.customerPhone}`} className="inline-flex items-center gap-2 font-medium text-blue-700 hover:underline"><Phone className="h-4 w-4" /> {selectedAlert.customerPhone}</a> : <span className="text-gray-500">Unavailable</span>}</dd></div>
                <div><dt className="text-xs uppercase tracking-wide text-gray-500">{selectedAlert.leg === "PICKUP" ? "Pickup" : "Delivery"} location</dt><dd className="mt-1 flex items-start gap-2 text-gray-800"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" /> {selectedAlert.locationLabel}</dd></div>
                <div><dt className="text-xs uppercase tracking-wide text-gray-500">Reason escalated</dt><dd className="mt-1 text-gray-800">{selectedAlert.reason}</dd></div>
                <div><dt className="text-xs uppercase tracking-wide text-gray-500">Waiting</dt><dd className="mt-1 text-gray-800">{ageLabel(selectedAlert.createdAt)}</dd></div>
                <div><dt className="text-xs uppercase tracking-wide text-gray-500">Search progress</dt><dd className="mt-1 text-gray-800">{selectedAlert.attempts || 1} attempt{selectedAlert.attempts === 1 ? "" : "s"}{selectedAlert.lastRadiusKm !== undefined ? ` · ${selectedAlert.lastRadiusKm} km reached` : ""}</dd></div>
              </dl>
              {canManageDispatch && <div className="mt-5 border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-900">Schedule manually</h4>
                <p className="mt-1 text-xs text-gray-500">Record the agreed pickup or delivery window after speaking with the customer.</p>
                <label className="mt-3 block text-xs font-medium text-gray-700">Date and time<input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
                <label className="mt-3 block text-xs font-medium text-gray-700">Admin note (optional)<textarea rows={3} value={scheduleNote} onChange={(event) => setScheduleNote(event.target.value)} placeholder="Call outcome, landmark, or handoff note" className="mt-1.5 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
                <button type="button" onClick={() => void saveSchedule()} disabled={!scheduledAt || savingSchedule} className="mt-3 h-10 w-full rounded-lg border border-[#0B1E5B] bg-white px-4 text-sm font-semibold text-[#0B1E5B] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-45">{savingSchedule ? "Saving schedule…" : selectedAlert.scheduledAt ? "Update schedule" : "Save schedule"}</button>
              </div>}
            </div>

            <div>
              <div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="font-semibold text-gray-950">Choose a rider</h3><p className="mt-1 text-sm text-gray-500">Candidates are ordered by the backend&apos;s current dispatch ranking.</p></div><span className="text-xs font-medium text-gray-500">{candidates.length} candidate{candidates.length === 1 ? "" : "s"}</span></div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {loadingCandidates && <div className="col-span-full py-12 text-center text-sm text-gray-500">Finding available riders…</div>}
                {!loadingCandidates && candidates.map((rider) => {
                  const full = rider.activeAssignments >= rider.maxAssignments;
                  const unavailable = !canManageDispatch || full || !rider.available;
                  const selected = rider.riderId === selectedRiderId;
                  return (
                    <button key={rider.riderId} type="button" disabled={unavailable} onClick={() => setSelectedRiderId(rider.riderId)} className={`rounded-xl border p-4 text-left transition ${unavailable ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-65" : selected ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100" : "border-gray-200 hover:border-blue-200 hover:bg-blue-50/30"}`}>
                      <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-gray-950">{rider.name}</p><p className="mt-0.5 text-xs text-gray-500">ID: {rider.identifier || rider.riderId}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${full ? "bg-red-100 text-red-700" : rider.activeAssignments >= 4 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{rider.activeAssignments}/{rider.maxAssignments}</span></div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-600"><span className="inline-flex items-center gap-1"><Bike className="h-3.5 w-3.5" /> {rider.vehicle}</span>{rider.distanceKm !== undefined && <span>{rider.distanceKm.toFixed(1)} km away</span>}<span>{rider.isOnline ? "Online" : "Offline"}</span></div>
                      {full && <p className="mt-2 text-xs font-medium text-red-700">Capacity reached — finish an active order first.</p>}
                      {!full && !rider.available && <p className="mt-2 text-xs font-medium text-amber-700">This rider is not currently eligible for assignment.</p>}
                    </button>
                  );
                })}
                {!loadingCandidates && candidates.length === 0 && <div className="col-span-full rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500">No riders are currently eligible within the configured search range.</div>}
              </div>
              {canManageDispatch && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4"><p className="text-sm text-gray-600">{selectedRider ? <><strong className="text-gray-900">{selectedRider.name}</strong> will receive this {selectedAlert.leg.toLowerCase()} assignment.</> : "Select an available rider to continue."}</p><button type="button" onClick={() => void assign()} disabled={!selectedRider || assigning || !selectedRider.available || selectedRider.activeAssignments >= selectedRider.maxAssignments} className="h-11 rounded-lg bg-[#0B1E5B] px-5 text-sm font-semibold text-white hover:bg-[#10276e] disabled:cursor-not-allowed disabled:opacity-45">{assigning ? "Assigning…" : "Assign rider"}</button></div>}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
