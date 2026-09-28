// app/(tab)/OrderManagementTab.tsx
"use client";
import * as React from "react";
import {
  Search as SearchIcon,
  Filter,
  X,
  MapPin,
  Phone,
  CheckCircle,
  RotateCcw,
} from "lucide-react";
import { cancelOrder, fetchOrderDetail, fetchOrders, type UiOrder as Order, type UiOrderStatus as OrderStatus } from "@/lib/orders";
import { TableLoadingState } from "@/components/dashboard/ui/LoadingState";

/* ------------------------ Pagination util ----------------------- */
function buildWindow(page: number, total: number, windowSize = 5) {
  if (total <= windowSize) return Array.from({ length: total }, (_, i) => i + 1);
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  let end = start + windowSize - 1;
  if (end > total) {
    end = total;
    start = total - windowSize + 1;
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/* ------------------------- Component ---------------------------- */
export default function OrderManagementTab() {
  const [tab, setTab] = React.useState<"active" | "completed" | "cancelled">("active");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const perPage = 8;

  // modal state
  const [open, setOpen] = React.useState(false);
  const [activeOrder, setActiveOrder] = React.useState<Order | null>(null);

  // filter button
  const filterBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const [filterOpen, setFilterOpen] = React.useState(false);

  const [pageItems, setPageItems] = React.useState<Order[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [safePage, setSafePage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  React.useEffect(() => setPage(1), [search, tab]);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetchOrders(tab, page, perPage, search)
      .then((list) => {
        if (!alive) return;
        setPageItems(list.items);
        setTotal(list.total);
        setTotalPages(list.totalPages);
        setSafePage(list.page);
      })
      .catch((err) => { if (alive) setError(err?.message || "Unable to load orders"); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [tab, page, perPage, search, refreshKey]);

  async function openOrderModal(o: Order) {
    setActiveOrder(o);
    setOpen(true);
    try {
      setActiveOrder(await fetchOrderDetail(o.id));
    } catch {
      // keep row data if detail fetch fails
    }
  }

  function closeModal() {
    setOpen(false);
    // keep activeOrder for possible animation; clear after small delay
    setTimeout(() => setActiveOrder(null), 200);
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      {/* Tabs header */}
      <div>
        <nav className="flex gap-6 text-sm font-medium text-gray-600">
          <TabButton active={tab === "active"} onClick={() => setTab("active")}>
            Active
          </TabButton>
          <TabButton active={tab === "completed"} onClick={() => setTab("completed")}>
            Completed
          </TabButton>
          <TabButton active={tab === "cancelled"} onClick={() => setTab("cancelled")}>
            Cancelled
          </TabButton>
        </nav>
      </div>

      {/* Search + filter row */}
      <div className="mt-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-[720px]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, Name , city , state"
            className="w-full h-11 rounded-md border border-gray-200 bg-white pl-10 pr-12 text-sm placeholder:text-gray-400 focus:ring-1 focus:ring-blue-500"
          />
          <button
            ref={filterBtnRef}
            onClick={() => setFilterOpen((v) => !v)}
            aria-label="Filter"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md bg-white border border-gray-200 grid place-items-center"
          >
            <Filter className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* filterUI placeholder */}
        {filterOpen && (
          <div className="rounded-md bg-white p-3 shadow-md border border-gray-100">
            <div className="text-sm text-gray-600">Filters (placeholder)</div>
            <div className="mt-2 text-xs text-gray-500">Add filters here</div>
          </div>
        )}
      </div>

      {/* Table / list */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* table headings */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-[13px] text-gray-600 font-semibold">
          <div className="col-span-3">User Name</div>
          <div className="col-span-2">Wash Type</div>
          <div className="col-span-3">Merchant Name</div>
          <div className="col-span-2">State and city</div>
          <div className="col-span-2">Request date and Time</div>
        </div>

        {/* rows */}
        <div className="px-2 py-2">
          {error && <div className="p-4 text-sm text-red-600">{error}</div>}
          {loading && <TableLoadingState rows={6} columns={5} label="Loading orders" />}
          {!loading && pageItems.map((o) => (
            <div
              key={o.id}
              onClick={() => openOrderModal(o)}
              className="cursor-pointer hover:bg-gray-50 rounded-md px-3 py-4 md:grid md:grid-cols-12 md:gap-4 items-center"
              role="button"
            >
              <div className="md:col-span-3 text-[15px] text-gray-900">{o.userName}</div>
              <div className="md:col-span-2 text-gray-700">{o.washType}</div>
              <div className="md:col-span-3 text-gray-700">{o.merchantName}</div>
              <div className="md:col-span-2 text-gray-700">{o.state}, {o.city}</div>
              <div className="md:col-span-2 text-gray-700">{o.requestDate} &nbsp; {o.requestTime}</div>
              <div className="md:hidden mt-2 text-sm text-gray-500">Tap for details</div>
            </div>
          ))}

          {!loading && pageItems.length === 0 && (
            <div className="p-8 text-center text-gray-500">No orders found.</div>
          )}
        </div>

        {/* footer pagination */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">Showing {(safePage - 1) * perPage + 1} to {Math.min(safePage * perPage, total)} of {total} entries</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="h-10 w-10 rounded-full border bg-[#91ADF6] grid place-items-center" aria-label="Prev" disabled={safePage === 1}>
              ←
            </button>

            {/* page pills */}
            <PagePills page={safePage} total={totalPages} onChange={setPage} />

            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="h-10 w-10 rounded-full border bg-[#91ADF6] grid place-items-center" aria-label="Next" disabled={safePage === totalPages}>
              →
            </button>
          </div>
        </div>
      </div>

      {/* Modal(s) */}
      {open && activeOrder && (
        <OrderModal
          order={activeOrder}
          onClose={closeModal}
          variant={activeOrder.status}
          onOrderChanged={(next) => {
            setActiveOrder(next);
            setRefreshKey((value) => value + 1);
          }}
        />
      )}
    </div>
  );
}

/* ------------------------- Small UI bits ------------------------ */

function TabButton({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`pb-3 border-b-2 ${active ? "border-[#1e3a8a] text-[#1e3a8a]" : "border-transparent text-gray-500"} `}
    >
      {children}
    </button>
  );
}

function PagePills({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const windowPages = buildWindow(page, total, 5);
  const leftDots = windowPages[0] > 2;
  const rightDots = windowPages[windowPages.length - 1] < total - 1;

  const pill = (n: number) => (
    <button key={n} onClick={() => onChange(n)} className={`h-10 w-10 min-w-[40px] px-3 rounded-full text-sm transition border ${n === page ? "bg-[#233A78] text-white" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>
      {String(n).padStart(2, "0")}
    </button>
  );

  return (
    <div className="flex items-center gap-2">
      {total > 5 && (
        <>
          {windowPages[0] > 1 && pill(1)}
          {leftDots && <span className="px-1 text-gray-400">…</span>}
        </>
      )}
      {windowPages.map((p) => pill(p))}
      {total > 5 && (
        <>
          {rightDots && <span className="px-1 text-gray-400">…</span>}
          {windowPages[windowPages.length - 1] < total && pill(total)}
        </>
      )}
    </div>
  );
}

/* --------------------------- Modals ---------------------------- */

function OrderModal({ order, onClose, variant, onOrderChanged }: { order: Order; onClose: () => void; variant: OrderStatus; onOrderChanged: (order: Order) => void }) {
  // local collapse state for tracking
  const [openTracking, setOpenTracking] = React.useState(true);
  const [showCancel, setShowCancel] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState("");
  const [cancelling, setCancelling] = React.useState(false);
  const [actionError, setActionError] = React.useState("");
  const raw = order.raw || {};
  const backendStatus = String(raw.status || "").toUpperCase();
  const isReturn = raw.journeyPurpose === "CANCELLATION_RETURN" || Boolean(raw.cancellationRequestedAt);
  const canCancel = !raw.cancellationRequestedAt && [
    "PENDING_PICKUP",
    "PICKUP_ASSIGNED",
    "PICKUP_IN_PROGRESS",
    "AT_MERCHANT",
    "SORTING_AND_PRICING",
    "AWAITING_PAYMENT",
  ].includes(backendStatus);
  const cancellationBreakdown = raw.cancellationBreakdown || {
    collectionLeg: Number(raw.cancellationPickupFee || 0),
    returnLeg: Number(raw.cancellationReturnFee || 0),
    total: Number(raw.cancellationFee || 0),
  };

  const submitCancellation = async () => {
    if (!cancelReason.trim()) {
      setActionError("Enter the customer-facing reason for this cancellation.");
      return;
    }
    setCancelling(true);
    setActionError("");
    try {
      await cancelOrder(order.id, cancelReason.trim());
      const next = await fetchOrderDetail(order.id);
      onOrderChanged(next);
      setShowCancel(false);
      setCancelReason("");
    } catch (error: any) {
      setActionError(error?.message || "Unable to cancel this order.");
    } finally {
      setCancelling(false);
    }
  };

  // common close
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/30 p-4">
      <div className="w-full max-w-[760px] rounded-2xl bg-white p-6 sm:p-8 shadow-xl overflow-auto no-scrollbar max-h-[92vh]">
        <div className="w-full flex justify-end md-4">
          <button onClick={onClose} className="rounded-md p-2 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {variant === "completed" ? <StatusBadgeCompleted text="Clothes delivered" /> : variant === "cancelled" ? <StatusBadgeCancelled text="Cancelled" /> : isReturn ? <StatusBadgeReturn text="Cancellation return in progress" /> : <StatusBadge text={backendStatus.replaceAll("_", " ")} />}
          </div>
        </div>

        {/* main info */}
        <div className="mt-4 space-y-3">
          <InfoPill label="User" value={order.userName} />
          <div className="flex gap-4 items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-indigo-700" />
                <div className="text-gray-900">{order.state}, {order.city}</div>
              </div>
              <div className="mt-1 text-gray-600">{order.washType} wash order</div>
            </div>

            <div className="text-right">
              <Phone className="h-4 w-4 text-gray-600" />
              <div className="text-gray-900">{order.riderPhone ?? "—"}</div>
            </div>
          </div>

          <InfoPill label="Merchant" value={order.merchantName} />

          <div className="flex gap-3 mt-2">
            <SmallCard label="Merchant Rate" value={`₦${order.merchantRate?.toLocaleString() ?? "0"}`} />
            <SmallCard label="Delivery Rate" value={`₦${order.deliveryRate?.toLocaleString() ?? "0"}`} />
            <SmallCard label="Transaction ID" value={`${order.transactionId}`} />
          </div>
        </div>

        {isReturn && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 font-semibold text-amber-950"><RotateCcw className="h-4 w-4" /> Customer return</div>
            <p className="mt-1 text-sm text-amber-800">Custody: {String(raw.custody || "UNKNOWN").replaceAll("_", " ")}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <SmallCard label="Collection leg" value={`₦${Number(cancellationBreakdown.collectionLeg || 0).toLocaleString()}`} />
              <SmallCard label="Return leg" value={`₦${Number(cancellationBreakdown.returnLeg || 0).toLocaleString()}`} />
              <SmallCard label="Customer total" value={`₦${Number(cancellationBreakdown.total || 0).toLocaleString()}`} />
            </div>
            <p className="mt-3 text-xs font-medium text-amber-900">{raw.cancellationPaidAt ? "Return logistics paid. Dispatch uses the nearest-rider broadcast." : backendStatus === "PICKUP_IN_PROGRESS" ? "The pickup rider must first secure the clothes at the merchant." : "Waiting for the customer to pay the two-leg logistics charge."}</p>
          </div>
        )}

        {/* tracking */}
        <div className="mt-5">
          <div className="inline-flex items-center gap-2">
            <button onClick={() => setOpenTracking((v) => !v)} className="rounded-full bg-blue-50 px-3 py-2 text-sm text-gray-800">
              Clothes Tracking {openTracking ? "▲" : "▼"}
            </button>
          </div>

          {openTracking && (
            <ol className="mt-4 space-y-4">
              {(order.timeline || []).map((t, i) => (
                <li key={i} className="rounded-md bg-gray-50 p-4">
                  <div className="font-medium text-gray-900">{t.title}</div>
                  <div className="mt-1 text-sm text-gray-600">{t.body}</div>
                  <div className="mt-2 text-xs text-gray-400">{t.date}</div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* actions area for active */}
        {variant === "active" && canCancel && !showCancel && (
          <button onClick={() => setShowCancel(true)} className="mt-6 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100">Cancel on behalf of customer</button>
        )}
        {variant === "active" && canCancel && showCancel && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <h3 className="font-semibold text-red-950">Confirm customer cancellation</h3>
            <p className="mt-1 text-sm text-red-800">The same custody and two-leg fee rules used in the customer app will apply. This action is recorded as an admin cancellation.</p>
            <textarea value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="Required cancellation reason" className="mt-3 min-h-24 w-full rounded-lg border border-red-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-red-200" />
            {actionError && <p className="mt-2 text-sm text-red-700">{actionError}</p>}
            <div className="mt-3 flex justify-end gap-2">
              <button disabled={cancelling} onClick={() => { setShowCancel(false); setActionError(""); }} className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-white">Keep order</button>
              <button disabled={cancelling} onClick={() => void submitCancellation()} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{cancelling ? "Cancelling…" : "Confirm cancellation"}</button>
            </div>
          </div>
        )}

        {/* footer for completed/cancelled: just summary */}
        {(variant === "completed" || variant === "cancelled") && (
          <div className="mt-6">
            <div className="text-sm text-gray-600">Summary</div>
            <div className="mt-3 flex gap-3">
              <SmallCard label="Merchant Rate" value={`₦${order.merchantRate?.toLocaleString() ?? "0"}`} />
              <SmallCard label="Delivery Rate" value={`₦${order.deliveryRate?.toLocaleString() ?? "0"}`} />
              <SmallCard label="Transaction ID" value={order.transactionId} />
            </div>
            <div className="mt-4 text-sm text-gray-500">Completed on: {order.requestDate}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ----------------------- Modal subcomponents -------------------- */

function StatusBadge({ text = "Clothes Delivered" }: { text?: string }) {
  return (
    <div className="inline-flex w-full items-center justify-center rounded-md border-dashed border-2 border-emerald-200 bg-emerald-50 py-2 px-4 text-emerald-700 font-semibold">
      <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" />
      {text}
    </div>
  );
}
function StatusBadgeCompleted({ text = "Clothes Delivered" }: { text?: string }) {
  return (
    <div className="inline-flex w-full items-center justify-center rounded-md border-dashed border-2 border-emerald-300 bg-emerald-50 py-2 px-4 text-emerald-700 font-semibold">
      <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" />
      {text}
    </div>
  );
}
function StatusBadgeCancelled({ text = "Cancelled" }: { text?: string }) {
  return (
    <div className="inline-flex w-full items-center justify-center rounded-md border-dashed border-2 border-red-200 bg-red-50 py-2 px-4 text-red-700 font-semibold">
      &#x26A0; {text}
    </div>
  );
}
function StatusBadgeReturn({ text }: { text: string }) {
  return (
    <div className="inline-flex w-full items-center justify-center rounded-md border-2 border-dashed border-amber-300 bg-amber-50 py-2 px-4 font-semibold text-amber-800">
      <RotateCcw className="mr-2 h-4 w-4" />
      {text}
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-3">
      <div className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700 font-medium">{label}:</div>
      <div className="text-gray-900">{value}</div>
    </div>
  );
}

function SmallCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-100 p-3 min-w-[140px]">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-2 text-lg font-semibold text-gray-900">{value}</div>
    </div>
  );
}
