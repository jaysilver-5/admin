// app/(dashboard)/merchant/MerchantManagementTab.tsx
"use client";

import * as React from "react";
import {
  Filter,
  Eye,
  MoreHorizontal,
  Search as SearchIcon,
} from "lucide-react";

import Pagination from "@/components/dashboard/tables/Pagination";
import CopyableCell from "@/components/dashboard/tables/CopyableCell";
import UserFilterPopover from "@/components/dashboard/filters/UserFilterPopover";

import MerchantBulkActions from "@/components/dashboard/toolbar/MerchantBulkActions";
import MerchantRowMenu from "@/components/dashboard/menus/MerchantRowMenu";
import MerchantProfileModal from "@/components/dashboard/modals/MerchantProfileModal";
import MerchantDocumentsModal from "@/components/dashboard/modals/MerchantDocumentsModal";
import ConfirmMerchantActionModal from "@/components/dashboard/modals/ConfirmMerchantActionModal";
import { TableLoadingState } from "@/components/dashboard/ui/LoadingState";

import {
  fetchMerchants,
  countMerchants,
  setMerchantStatus,
  reviewMerchantDocument,
  fetchMerchantDetail,
  Merchant,
  MerchantStatus,
} from "@/lib/merchants";

/* ----------------------------- Local UI: Tabs ----------------------------- */
const Tabs = ({
  active,
  onChange,
  counts,
}: {
  active: MerchantStatus;
  onChange: (t: MerchantStatus) => void;
  counts: Record<MerchantStatus, number>;
}) => {
  const Tab = ({ k, label }: { k: MerchantStatus; label: string }) => {
    const is = active === k;
    return (
      <button
        type="button"
        onClick={() => onChange(k)}
        role="tab"
        aria-selected={is}
        className={`relative px-2 pb-2 text-sm ${
          is ? "text-[#0B1E5B] font-medium" : "text-gray-500"
        }`}
      >
        {label}{" "}
        <span className={`${is ? "text-[#0B1E5B]" : "text-gray-400"}`}>
          ({counts[k] ?? 0})
        </span>
        {is && (
          <span className="absolute left-0 right-0 -bottom-[1px] mx-auto h-[2px] w-[92px] bg-[#0B1E5B] rounded-full" />
        )}
      </button>
    );
  };

  return (
    <div className="flex items-center gap-6 overflow-x-auto pb-1" role="tablist" aria-label="Merchant status">
      <Tab k="verified" label="Verified" />
      <Tab k="pending" label="Pending" />
      <Tab k="rejected" label="Rejected" />
      <Tab k="suspended" label="Suspended" />
    </div>
  );
};

/* ------------------------------- Main Screen ------------------------------ */
export default function MerchantManagementTab() {
  /* ---------- query state ---------- */
  const [tab, setTab] = React.useState<MerchantStatus>("verified");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const perPage = 8;

  /* ---------- filter popover ---------- */
  const filterBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<any>({ statuses: [] }); // keep UI filter shape

  /* ---------- selection ---------- */
  const [selected, setSelected] = React.useState<string[]>([]);
  const hasSelection = selected.length > 0;
  const toggleOne = (id: string) =>
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleAll = (ids: string[]) =>
    setSelected((p) => (p.length === ids.length ? [] : ids));

  /* ---------- row menu ---------- */
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [menuCoords, setMenuCoords] = React.useState<{ top: number; left: number } | null>(null);
  const [menuMerchant, setMenuMerchant] = React.useState<Merchant | null>(null);
  const openRowMenu = (u: Merchant, btn: HTMLButtonElement) => {
    const r = btn.getBoundingClientRect();
    setMenuCoords({ top: r.bottom + 8, left: r.left - 320 + r.width }); // right aligned
    setMenuMerchant(u);
    setMenuOpen(true);
  };

  /* ---------- modals ---------- */
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [docsOpen, setDocsOpen] = React.useState(false);
  const [current, setCurrent] = React.useState<Merchant | null>(null);

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmKind, setConfirmKind] =
    React.useState<"suspend" | "activate" | "approve" | "reject">("suspend");

  /* ---------- data ---------- */
  const [items, setItems] = React.useState<Merchant[]>([]);
  const [counts, setCounts] = React.useState<Record<MerchantStatus, number>>({
    verified: 0, pending: 0, rejected: 0, suspended: 0,
  });
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [safePage, setSafePage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [version, setVersion] = React.useState(0);

  React.useEffect(() => setPage(1), [search, tab, filters]);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchMerchants({ tab, page, perPage, search, filters }),
      countMerchants(),
    ])
      .then(([list, nextCounts]) => {
        if (!alive) return;
        setItems(list.items);
        setTotal(list.total);
        setTotalPages(list.totalPages);
        setSafePage(list.page);
        setCounts(nextCounts);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err?.message || "Unable to load merchants");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [tab, page, perPage, search, filters, version]);

  /* ---------- keyboard esc to close flyouts ---------- */
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setFilterOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ---------- helpers ---------- */
  const openConfirm = (kind: typeof confirmKind, m?: Merchant | null) => {
    if (m) setCurrent(m);
    setConfirmKind(kind);
    setConfirmOpen(true);
  };

  const afterConfirmCloseAll = () => {
    setConfirmOpen(false);
    setProfileOpen(false);
    setDocsOpen(false);
    setMenuOpen(false);
    setSelected([]);
  };

  const onRowClick = async (m: Merchant) => {
    setCurrent(m);
    try {
      const detailed = await fetchMerchantDetail(m.id);
      setCurrent(detailed);
    } catch {
      // keep row data if detail fetch fails
    }
    if (m.status === "verified" || m.status === "suspended") setProfileOpen(true);
    else setDocsOpen(true);
  };

  const applyStatus = async () => {
    const ids = selected.length ? selected : current ? [current.id] : [];
    if (!ids.length) return;
    const next: MerchantStatus =
      confirmKind === "approve" ? "verified" :
      confirmKind === "reject" ? "rejected" :
      confirmKind === "activate" ? "verified" : "suspended";

    try {
      await Promise.all(ids.map((id) => setMerchantStatus(id, next)));
      if (current && ids.length === 1 && (confirmKind === "approve" || confirmKind === "reject")) {
        const docStatus = confirmKind === "approve" ? "VERIFIED" : "REJECTED";
        await Promise.all((current.documents || []).filter((d) => d.status === "PENDING").map((d) => reviewMerchantDocument(d.id, docStatus)));
      }
      afterConfirmCloseAll();
      setVersion((v) => v + 1);
    } catch (err: any) {
      setError(err?.message || "Unable to update merchant");
      setConfirmOpen(false);
    }
  };

  /* =============================== RENDER =============================== */
  return (
    <div className="bg-transparent">
      {/* Tabs header */}
      <div className="mb-4">
        <Tabs active={tab} onChange={(t) => setTab(t)} counts={counts} />
      </div>

      {/* Search row with filter + icon-only bulk actions */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-[520px] flex-1 basis-[280px]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, Name or number of branch"
            aria-label="Search merchants"
            className="h-[46px] w-full rounded-md border border-gray-200 bg-white pl-9 pr-12 text-sm placeholder:text-gray-400 focus:ring-1 focus:ring-blue-500"
          />
          <button
            ref={filterBtnRef}
            onClick={() => setFilterOpen((v) => !v)}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 rounded-md bg-white border border-gray-200 hover:bg-gray-50 grid place-items-center"
            aria-label="Filter"
          >
            <Filter className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Icon-only bulk actions conditioned by tab */}
        <MerchantBulkActions
          tab={tab}
          disabled={!hasSelection}
          onSuspend={() => openConfirm("suspend")}
          onActivate={() => openConfirm("activate")}
          onApprove={() => openConfirm("approve")}
          onReject={() => openConfirm("reject")}
        />
      </div>

      {/* Card with table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          {/* <div className="text-sm text-gray-500">
            Showing {(safePage - 1) * perPage + 1} to{" "}
            {Math.min(safePage * perPage, total)} of {total} entries
          </div> */}
        </div>

        {error && <div className="px-6 py-3 text-sm text-red-600">{error}</div>}
        {loading && <TableLoadingState rows={6} columns={7} label="Loading merchants" />}

        {/* Table */}
        {!loading && <div className="overflow-x-auto overscroll-x-contain" tabIndex={0} aria-label="Merchants table, horizontally scrollable">
          <table className="w-full min-w-[1040px] table-fixed divide-y divide-gray-200">
            <colgroup><col className="w-14"/><col className="w-[16%]"/><col className="w-[15%]"/><col className="w-[20%]"/><col className="w-[24%]"/><col className="w-[12%]"/><col className="w-[9%]"/><col className="w-28"/></colgroup>
            <thead className="bg-gray-50">
              <tr>
                <th className="sticky left-0 z-20 bg-gray-50 px-4 py-3 sm:px-6">
                  <input
                    type="checkbox"
                    checked={
                      items.length > 0 &&
                      selected.length === items.map((i) => i.id).length
                    }
                    onChange={() => toggleAll(items.map((i) => i.id))}
                    aria-label="Select all merchants on this page"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                {[
                  "Business Name",
                  "Phone Number",
                  "Email Address",
                  "Business Address",
                  "Last Login Date",
                  "Service",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 sm:px-6 ${h === "" ? "sticky right-0 z-20 bg-gray-50" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((m) => (
                <tr
                  key={m.id}
                  className="group/row hover:bg-gray-50"
                >
                  <td className="sticky left-0 z-10 bg-white px-4 py-4 group-hover/row:bg-gray-50 sm:px-6" data-stop>
                    <input
                      type="checkbox"
                      checked={selected.includes(m.id)}
                      onChange={() => toggleOne(m.id)}
                      aria-label={`Select ${m.businessName || "merchant"}`}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>

                  <td className="px-4 py-4 text-sm font-medium text-gray-900 sm:px-6">
                    <CopyableCell value={m.businessName} label="business name" />
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 sm:px-6">
                    <CopyableCell value={m.phoneNumber} label="phone number" />
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 sm:px-6">
                    <CopyableCell value={m.email} label="email address" />
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 sm:px-6">
                    <CopyableCell value={m.address} label="business address" lines={2} />
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 sm:px-6">
                    <CopyableCell value={m.lastLoginDate} label="last login date" />
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 sm:px-6">
                    <CopyableCell value={m.serviceTier} label="service tier" />
                  </td>

                  <td className="sticky right-0 z-10 bg-white px-4 py-4 text-sm group-hover/row:bg-gray-50 sm:px-6" data-stop>
                    <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => onRowClick(m)} className="grid h-9 w-9 place-items-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label={`View details for ${m.businessName}`} title="View details"><Eye className="h-4 w-4"/></button>
                    <button
                      type="button"
                      className="grid h-9 w-9 place-items-center rounded-md border border-gray-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={(e) => openRowMenu(m, e.currentTarget)}
                      aria-label="Row actions"
                    >
                      <MoreHorizontal className="h-4 w-4 text-gray-600" />
                    </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500">No merchants match the current search and filters.</td></tr>}
            </tbody>
          </table>
        </div>}

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Showing {(safePage - 1) * perPage + 1} to{" "}
            {Math.min(safePage * perPage, total)} of {total} entries
          </span>
          <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>

      {/* Filter popover (reuse your existing) */}
      <div data-no-close>
        <UserFilterPopover
          open={filterOpen}
          anchorRef={filterBtnRef}
          initial={filters}
          onClose={() => setFilterOpen(false)}
          onApply={(next) => {
            setFilters(next);
            setFilterOpen(false);
          }}
        />
      </div>

      {/* Row action menu (3 options; last varies by status) */}
      <MerchantRowMenu
        open={menuOpen}
        anchor={menuCoords}
        status={(menuMerchant?.status ?? "verified") as MerchantStatus}
        onClose={() => setMenuOpen(false)}
        onViewProfile={() => {
          if (!menuMerchant) return;
          setCurrent(menuMerchant);
          setProfileOpen(true);
        }}
        onUpgrade={() => {
          // TODO: navigate/show upgrade UI
        }}
        onViewDocs={() => {
          if (!menuMerchant) return;
          setCurrent(menuMerchant);
          setDocsOpen(true);
        }}
        onSuspend={() => openConfirm("suspend", menuMerchant!)}
        onActivate={() => openConfirm("activate", menuMerchant!)}
        onApprove={() => openConfirm("approve", menuMerchant!)}
        onReject={() => openConfirm("reject", menuMerchant!)}
      />

      {/* Profile modal (Verified/Suspended) */}
      <MerchantProfileModal
        open={profileOpen && !!current}
        onClose={() => setProfileOpen(false)}
        merchant={current ?? undefined}
        onPrimaryAction={() => {
          // Suspend/Activate based on status
          if (!current) return;
          openConfirm(current.status === "suspended" ? "activate" : "suspend", current);
        }}
      />

      {/* Docs modal (Pending/Rejected) */}
      <MerchantDocumentsModal
        open={docsOpen && !!current}
        onClose={() => setDocsOpen(false)}
        merchant={current ?? undefined}
        onApprove={() => openConfirm("approve", current!)}
        onReject={() => openConfirm("reject", current!)}
      />

      {/* Stacked confirm modal (closes both on confirm) */}
      <ConfirmMerchantActionModal
        open={confirmOpen}
        kind={confirmKind}
        count={selected.length || 1}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={applyStatus}
      />
    </div>
  );
}
