"use client";

import * as React from "react";
import { AlertTriangle, Bike, Check, Clock3, PackageCheck, Phone, RotateCcw, Search, Store, UserRound, X } from "lucide-react";
import { cancelOrder, fetchOrderDetail, fetchOrders, updateOrderStatus, type UiOrder as Order } from "@/lib/orders";
import { formatNigerianPhone } from "@/lib/api";
import { TableLoadingState } from "@/components/dashboard/ui/LoadingState";

const FLOW = [
  ["PENDING_PICKUP", "Pickup requested", "The merchant accepted and pickup dispatch can begin."],
  ["PICKUP_ASSIGNED", "Pickup rider offered", "A pickup rider has been offered or assigned."],
  ["PICKUP_IN_PROGRESS", "Pickup in progress", "The accepted rider is collecting the clothes."],
  ["AT_MERCHANT", "At merchant", "The merchant has custody of the clothes."],
  ["SORTING_AND_PRICING", "Sorting and pricing", "Garments, services and the final price are being confirmed."],
  ["AWAITING_PAYMENT", "Awaiting payment", "The customer has received the final price and must pay."],
  ["IN_PROGRESS", "Laundry in progress", "Payment is confirmed and the merchant is processing the order."],
  ["AWAITING_DELIVERY_LOCATION", "Delivery location needed", "The customer needs to confirm the return location."],
  ["READY_FOR_DELIVERY", "Ready for delivery", "The clothes are ready and delivery dispatch can begin."],
  ["DELIVERY_ASSIGNED", "Delivery rider offered", "A delivery rider has been offered or assigned."],
  ["DELIVERY_IN_PROGRESS", "Delivery in progress", "The rider has the clothes and is heading to the customer."],
  ["AWAITING_DELIVERY_CONFIRMATION", "Awaiting confirmation", "The customer must confirm that the clothes arrived."],
  ["COMPLETED", "Completed", "Delivery is confirmed and the journey is closed."],
] as const;

const NEXT: Record<string, string[]> = {
  PENDING_PICKUP: ["PICKUP_ASSIGNED"], PICKUP_ASSIGNED: ["PICKUP_IN_PROGRESS", "PENDING_PICKUP"],
  PICKUP_IN_PROGRESS: ["AT_MERCHANT"], AT_MERCHANT: ["SORTING_AND_PRICING"], SORTING_AND_PRICING: ["AWAITING_PAYMENT"],
  AWAITING_PAYMENT: ["IN_PROGRESS"], IN_PROGRESS: ["AWAITING_DELIVERY_LOCATION", "READY_FOR_DELIVERY"],
  AWAITING_DELIVERY_LOCATION: ["READY_FOR_DELIVERY"], READY_FOR_DELIVERY: ["DELIVERY_ASSIGNED"],
  DELIVERY_ASSIGNED: ["DELIVERY_IN_PROGRESS", "READY_FOR_DELIVERY"], DELIVERY_IN_PROGRESS: ["AWAITING_DELIVERY_CONFIRMATION"],
  AWAITING_DELIVERY_CONFIRMATION: ["COMPLETED"],
};

const humanize = (value?: unknown) => String(value || "—").replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());

export default function OrderManagementTab({ permissions = [] }: { permissions?: string[] }) {
  const granted = React.useMemo(() => new Set(permissions), [permissions]);
  const [tab, setTab] = React.useState<"active" | "completed" | "cancelled">("active");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [items, setItems] = React.useState<Order[]>([]);
  const [total, setTotal] = React.useState(0);
  const [pages, setPages] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [selected, setSelected] = React.useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [version, setVersion] = React.useState(0);
  const perPage = 8;

  React.useEffect(() => setPage(1), [search, tab]);
  React.useEffect(() => {
    let alive = true;
    setLoading(true); setError("");
    fetchOrders(tab, page, perPage, search).then((result) => {
      if (!alive) return;
      setItems(result.items); setTotal(result.total); setPages(result.totalPages); setPage(result.page);
    }).catch((nextError) => alive && setError(nextError?.message || "Unable to load orders")).finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [tab, page, search, version]);

  async function openOrder(order: Order) {
    setSelected(order); setDetailLoading(true);
    try { setSelected(await fetchOrderDetail(order.id)); } catch { /* list row remains usable */ }
    finally { setDetailLoading(false); }
  }

  return <div className="px-4 py-6 sm:px-6 lg:px-8">
    <nav className="flex gap-6" aria-label="Order status">{(["active", "completed", "cancelled"] as const).map((item) => <button key={item} onClick={() => setTab(item)} className={`border-b-2 pb-3 text-sm font-medium capitalize ${tab === item ? "border-[#1e3a8a] text-[#1e3a8a]" : "border-transparent text-gray-500"}`}>{item}</button>)}</nav>
    <div className="relative mt-6 max-w-[720px]"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order ID, customer, phone, merchant or location" className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-sm" /></div>
    <div className="mt-6 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="hidden grid-cols-12 gap-4 bg-gray-50 px-6 py-3 text-[13px] font-semibold text-gray-600 md:grid"><div className="col-span-2">Order</div><div className="col-span-2">Customer</div><div className="col-span-2">Service</div><div className="col-span-2">Merchant</div><div className="col-span-2">Location</div><div className="col-span-2">Requested</div></div>
      <div className="p-2">{error && <p className="p-4 text-sm text-red-600">{error}</p>}{loading && <TableLoadingState rows={6} columns={6} label="Loading orders" />}{!loading && items.map((order) => <button key={order.id} onClick={() => void openOrder(order)} className="block w-full rounded-lg px-3 py-4 text-left hover:bg-gray-50 md:grid md:grid-cols-12 md:items-center md:gap-4"><div className="md:col-span-2"><p className="font-semibold text-gray-950">{order.orderNumber}</p><p className="text-xs text-gray-500">{humanize(order.raw?.status)}</p></div><p className="mt-2 text-gray-900 md:col-span-2 md:mt-0">{order.userName}</p><p className="text-gray-700 md:col-span-2">{order.washType}</p><p className="text-gray-700 md:col-span-2">{order.merchantName}</p><p className="text-gray-700 md:col-span-2">{order.state}, {order.city}</p><p className="text-gray-700 md:col-span-2">{order.requestDate}<br /><span className="text-xs text-gray-500">{order.requestTime}</span></p></button>)}{!loading && !items.length && <p className="p-8 text-center text-gray-500">No orders found.</p>}</div>
      <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-gray-500">{total ? `Showing ${(page - 1) * perPage + 1} to ${Math.min(page * perPage, total)} of ${total}` : "0 entries"}</p><div className="flex gap-2"><button disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="h-9 rounded-lg border px-3 disabled:opacity-40">Previous</button><span className="grid h-9 place-items-center px-2 text-sm">{page} / {pages}</span><button disabled={page === pages} onClick={() => setPage((value) => value + 1)} className="h-9 rounded-lg border px-3 disabled:opacity-40">Next</button></div></div>
    </div>
    {selected && <OrderModal order={selected} loading={detailLoading} canManage={granted.has("orders.manage")} canCancel={granted.has("orders.cancel")} onClose={() => setSelected(null)} onChanged={(next) => { setSelected(next); setVersion((value) => value + 1); }} />}
  </div>;
}

function OrderModal({ order, loading, canManage, canCancel, onClose, onChanged }: { order: Order; loading: boolean; canManage: boolean; canCancel: boolean; onClose: () => void; onChanged: (order: Order) => void }) {
  const raw = order.raw || {};
  const status = String(raw.status || "").toUpperCase();
  const nextStatuses = NEXT[status] || [];
  const [nextStatus, setNextStatus] = React.useState(nextStatuses[0] || "");
  const [note, setNote] = React.useState("");
  const [cancelReason, setCancelReason] = React.useState("");
  const [showCancel, setShowCancel] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [actionError, setActionError] = React.useState("");
  const returnOrder = raw.journeyPurpose === "CANCELLATION_RETURN" || Boolean(raw.cancellationRequestedAt);
  const cancellationAllowed = canCancel && !raw.cancellationRequestedAt && ["PENDING_PICKUP", "PICKUP_ASSIGNED", "PICKUP_IN_PROGRESS", "AT_MERCHANT", "SORTING_AND_PRICING", "AWAITING_PAYMENT"].includes(status);

  React.useEffect(() => { setNextStatus((NEXT[status] || [])[0] || ""); setNote(""); setActionError(""); }, [status]);
  React.useEffect(() => { const listener = (event: KeyboardEvent) => event.key === "Escape" && onClose(); window.addEventListener("keydown", listener); return () => window.removeEventListener("keydown", listener); }, [onClose]);
  const refresh = async () => onChanged(await fetchOrderDetail(order.id));

  async function advance() {
    if (!nextStatus || !note.trim()) { setActionError("Select the next stage and add an audit note."); return; }
    setSaving(true); setActionError("");
    try { await updateOrderStatus(order.id, nextStatus, note.trim()); await refresh(); }
    catch (error: any) { setActionError(error?.message || "Unable to update the order."); }
    finally { setSaving(false); }
  }
  async function cancel() {
    if (!cancelReason.trim()) { setActionError("Enter a customer-facing cancellation reason."); return; }
    setSaving(true); setActionError("");
    try { await cancelOrder(order.id, cancelReason.trim()); await refresh(); setShowCancel(false); }
    catch (error: any) { setActionError(error?.message || "Unable to cancel the order."); }
    finally { setSaving(false); }
  }

  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-2 sm:p-4" role="dialog" aria-modal="true" aria-label={`Order ${order.orderNumber}`}>
    <div className="flex max-h-[96dvh] w-full max-w-[1040px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b px-5 py-4 sm:px-7"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold text-slate-950">Order {order.orderNumber}</h2><Status status={status} /></div><p className="mt-1 text-sm text-gray-500">Requested {order.requestDate} at {order.requestTime}</p></div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border" aria-label="Close"><X className="h-5 w-5" /></button></header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7">
        {loading && <p className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">Refreshing full order details…</p>}
        <section className="grid gap-3 md:grid-cols-3"><Contact icon={<UserRound className="h-5 w-5" />} title="Customer" name={order.userName} publicId={order.userPublicId} phone={order.customerPhone} detail={raw.pickupAddress || `${order.city}, ${order.state}`} /><Contact icon={<Store className="h-5 w-5" />} title="Merchant" name={order.merchantName} publicId={order.merchantPublicId} phone={order.merchantPhone} detail={order.merchantAddress} /><div className="rounded-xl border p-4"><p className="flex items-center gap-2 text-sm font-semibold text-gray-500"><PackageCheck className="h-5 w-5 text-indigo-600" />Order summary</p><dl className="mt-3 space-y-2 text-sm"><Summary label="Service" value={order.washType} /><Summary label="Custody" value={humanize(raw.custody)} /><Summary label="Payment" value={raw.paidAt || raw.paymentStatus === "PAID" ? "Paid" : status === "AWAITING_PAYMENT" ? "Awaiting payment" : "Not confirmed"} /></dl></div></section>
        {returnOrder && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="flex items-center gap-2 font-semibold text-amber-950"><RotateCcw className="h-4 w-4" />Cancellation return</p><p className="mt-1 text-sm text-amber-800">Custody: {humanize(raw.custody)} · Return logistics: ₦{Number(raw.cancellationBreakdown?.total || raw.cancellationFee || 0).toLocaleString()}</p></div>}

        <section className="mt-6"><h3 className="font-semibold text-gray-950">Rider assignments</h3><p className="text-sm text-gray-500">Pickup and delivery riders are separated, with their acceptance state and phone number.</p>{order.riderAssignments.length ? <div className="mt-3 grid gap-3 sm:grid-cols-2">{order.riderAssignments.map((assignment) => <Rider key={assignment.id} assignment={assignment} />)}</div> : <p className="mt-3 rounded-xl border border-dashed p-5 text-sm text-gray-500">No rider has been offered or assigned. Use the Rider Dispatch workspace to assign one manually.</p>}</section>
        <section className="mt-7"><h3 className="font-semibold text-gray-950">Order journey</h3><p className="text-sm text-gray-500">Completed, current and upcoming stages of the full order flow.</p><Journey status={status} /></section>
        <section className="mt-7"><h3 className="font-semibold text-gray-950">Activity log</h3>{order.timeline?.length ? <ol className="mt-3 space-y-3 border-l-2 pl-5">{order.timeline.map((event, index) => <li key={`${event.date}-${index}`} className="relative"><span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-500 ring-4 ring-white" /><p className="text-sm font-semibold">{humanize(event.title)}</p>{event.body && <p className="text-sm text-gray-600">{event.body}</p>}<p className="mt-1 text-xs text-gray-400">{event.date}</p></li>)}</ol> : <p className="mt-3 rounded-lg bg-gray-50 p-4 text-sm text-gray-500">No activity events have been recorded yet.</p>}</section>
        <section className="mt-7 grid gap-3 sm:grid-cols-3"><Money label="Merchant amount" value={order.merchantRate} /><Money label="Delivery amount" value={order.deliveryRate} /><div className="rounded-xl border p-4"><p className="text-xs font-semibold uppercase text-gray-500">Transaction reference</p><p className="mt-2 break-all text-sm font-semibold">{order.transactionId || "—"}</p></div></section>

        {(canManage || cancellationAllowed) && <section className="mt-7 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 sm:p-5"><h3 className="font-semibold text-indigo-950">Manual admin controls</h3><p className="mt-1 text-sm text-indigo-800">Only backend-approved next stages are available. Status changes are written to the activity log.</p>{canManage && nextStatuses.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-[220px_1fr_auto]"><select value={nextStatus} onChange={(event) => setNextStatus(event.target.value)} className="h-11 rounded-lg border bg-white px-3 text-sm">{nextStatuses.map((next) => <option key={next} value={next}>{humanize(next)}</option>)}</select><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Required audit note" className="h-11 rounded-lg border bg-white px-3 text-sm" /><button disabled={saving} onClick={() => void advance()} className="h-11 rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Update stage"}</button></div>}{canManage && !nextStatuses.length && !["COMPLETED", "CANCELLED"].includes(status) && <p className="mt-3 text-sm text-amber-700">This stage must be completed through its dedicated payment, return, or dispatch workflow.</p>}{cancellationAllowed && !showCancel && <button onClick={() => setShowCancel(true)} className="mt-4 text-sm font-semibold text-red-700">Cancel on behalf of customer</button>}{showCancel && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4"><textarea value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="Customer-facing cancellation reason" className="min-h-24 w-full rounded-lg border bg-white p-3 text-sm" /><div className="mt-3 flex justify-end gap-2"><button onClick={() => setShowCancel(false)} className="px-4 py-2 text-sm font-semibold">Keep order</button><button disabled={saving} onClick={() => void cancel()} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white">Confirm cancellation</button></div></div>}{actionError && <p className="mt-3 flex items-center gap-2 text-sm font-medium text-red-700"><AlertTriangle className="h-4 w-4" />{actionError}</p>}</section>}
      </div>
    </div>
  </div>;
}

function Status({ status }: { status: string }) { return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" : status === "CANCELLED" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-800"}`}>{humanize(status)}</span>; }
function Contact({ icon, title, name, publicId, phone, detail }: { icon: React.ReactNode; title: string; name: string; publicId?: string; phone?: string; detail?: string }) { const callable = phone && phone !== "—"; return <div className="rounded-xl border p-4"><p className="flex items-center gap-2 text-sm font-semibold text-gray-500"><span className="text-indigo-600">{icon}</span>{title}</p><p className="mt-3 font-semibold">{name}</p>{publicId && <p className="text-xs font-semibold tracking-wider text-gray-500">ID {publicId}</p>}<p className="mt-2 min-h-10 text-sm text-gray-600">{detail || "No address available"}</p>{callable ? <a href={`tel:${String(phone).replace(/[^+\d]/g, "")}`} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700"><Phone className="h-4 w-4" />{formatNigerianPhone(phone)}</a> : <p className="mt-3 text-sm text-gray-400">No phone number</p>}</div>; }
function Rider({ assignment }: { assignment: Order["riderAssignments"][number] }) { const accepted = ["ACCEPTED", "COMPLETED"].includes(assignment.status); return <div className="rounded-xl border p-4"><div className="flex justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-gray-500">{humanize(assignment.role)} rider</p><p className="mt-1 font-semibold">{assignment.name}</p>{assignment.publicId && <p className="text-xs font-semibold tracking-wider text-gray-500">ID {assignment.publicId}</p>}</div><span className={`h-fit rounded-full px-2.5 py-1 text-xs font-semibold ${accepted ? "bg-emerald-100 text-emerald-800" : assignment.status === "OFFERED" ? "bg-amber-100 text-amber-800" : "bg-gray-100"}`}>{accepted ? "Accepted" : humanize(assignment.status)}</span></div><p className="mt-3 flex items-center gap-2 text-sm text-gray-500"><Bike className="h-4 w-4" />{humanize(assignment.vehicle || "Vehicle not set")}</p>{assignment.phone ? <a href={`tel:${assignment.phone.replace(/[^+\d]/g, "")}`} className="mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold"><Phone className="h-4 w-4" />{formatNigerianPhone(assignment.phone)}</a> : <p className="mt-3 text-sm text-gray-400">No rider phone number</p>}</div>; }
function Journey({ status }: { status: string }) { const current = FLOW.findIndex(([key]) => key === status); return <ol className="mt-4 grid gap-2 md:grid-cols-2">{FLOW.map(([key, label, body], index) => { const complete = status === "COMPLETED" || (current >= 0 && index < current); const active = index === current; return <li key={key} className={`flex gap-3 rounded-xl border p-3 ${active ? "border-indigo-300 bg-indigo-50" : complete ? "border-emerald-200 bg-emerald-50/60" : "border-gray-200"}`}><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${complete ? "bg-emerald-600 text-white" : active ? "bg-indigo-700 text-white" : "bg-gray-100 text-gray-400"}`}>{complete ? <Check className="h-4 w-4" /> : active ? <Clock3 className="h-4 w-4" /> : index + 1}</span><div><p className="text-sm font-semibold">{label}</p><p className="text-xs leading-5 text-gray-500">{body}</p></div></li>; })}</ol>; }
function Summary({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-3"><dt className="text-gray-500">{label}</dt><dd className="text-right font-semibold">{value}</dd></div>; }
function Money({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border p-4"><p className="text-xs font-semibold uppercase text-gray-500">{label}</p><p className="mt-2 text-xl font-bold">₦{Number(value || 0).toLocaleString()}</p></div>; }
