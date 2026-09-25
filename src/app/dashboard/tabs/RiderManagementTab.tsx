"use client";

import * as React from "react";
import { Eye, Filter, MoreHorizontal, Search as SearchIcon } from "lucide-react";

import Pagination from "@/components/dashboard/tables/Pagination";
import CopyableCell from "@/components/dashboard/tables/CopyableCell";
import UserFilterPopover from "@/components/dashboard/filters/UserFilterPopover";

import MerchantBulkActions from "@/components/dashboard/toolbar/MerchantBulkActions"; // reuse
import RiderRowMenu from "@/components/dashboard/menus/RiderRowMenu";
import ConfirmMerchantActionModal from "@/components/dashboard/modals/ConfirmMerchantActionModal"; // reuse confirm
import MerchantProfileModal from "@/components/dashboard/modals/MerchantProfileModal"; // reuse profile shell
import RiderDocumentsModal from "@/components/dashboard/modals/RiderDocumentsModal";
import { TableLoadingState } from "@/components/dashboard/ui/LoadingState";

import {
  fetchRiders,
  countRiders,
  fetchRiderDetail,
  setRiderStatus,
  reviewRiderDocument,
  Rider,
  RiderStatus,
} from "@/lib/riders";

/* ------------------------------- Tabs ------------------------------- */
const Tabs = ({
  active,
  onChange,
  counts,
}: {
  active: RiderStatus;
  onChange: (t: RiderStatus) => void;
  counts: Record<RiderStatus, number>;
}) => {
  const Tab = ({ k, label }: { k: RiderStatus; label: string }) => {
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
    <div className="flex items-center gap-6 overflow-x-auto pb-1" role="tablist" aria-label="Rider status">
      <Tab k="verified" label="Verified" />
      <Tab k="pending" label="Pending" />
      <Tab k="rejected" label="Rejected" />
      <Tab k="suspended" label="Suspended" />
    </div>
  );
};

/* --------------------------- Main Component --------------------------- */
export default function RiderManagementTab() {
  // query state
  const [tab, setTab] = React.useState<RiderStatus>("verified");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const perPage = 8;

  // filter
  const filterBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<any>({ statuses: [] });

  // selection
  const [selected, setSelected] = React.useState<string[]>([]);
  const hasSelection = selected.length > 0;
  const toggleOne = (id: string) =>
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleAll = (ids: string[]) =>
    setSelected((p) => (p.length === ids.length ? [] : ids));

  // row menu
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [menuCoords, setMenuCoords] = React.useState<{ top: number; left: number } | null>(null);
  const [menuRider, setMenuRider] = React.useState<Rider | null>(null);
  const openRowMenu = (u: Rider, btn: HTMLButtonElement) => {
    const r = btn.getBoundingClientRect();
    setMenuCoords({ top: r.bottom + 8, left: r.left - 320 + r.width }); // right align
    setMenuRider(u);
    setMenuOpen(true);
  };

  // modals
  const [profileOpen, setProfileOpen] = React.useState(false); // verified/suspended
  const [docsOpen, setDocsOpen] = React.useState(false); // pending/rejected
  const [current, setCurrent] = React.useState<Rider | null>(null);

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmKind, setConfirmKind] =
    React.useState<"suspend" | "activate" | "approve" | "reject">("suspend");

  // data
  const [items, setItems] = React.useState<Rider[]>([]);
  const [counts, setCounts] = React.useState<Record<RiderStatus, number>>({ verified: 0, pending: 0, rejected: 0, suspended: 0 });
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
      fetchRiders({ tab, page, perPage, search, filters }),
      countRiders(),
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
        setError(err?.message || "Unable to load riders");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [tab, page, perPage, search, filters, version]);

  // helpers
  const openConfirm = (kind: typeof confirmKind, r?: Rider | null) => {
    if (r) setCurrent(r);
    setConfirmKind(kind);
    setConfirmOpen(true);
  };
  const closeAll = () => {
    setConfirmOpen(false);
    setProfileOpen(false);
    setDocsOpen(false);
    setMenuOpen(false);
    setSelected([]);
  };
  const onRowClick = async (r: Rider) => {
    setCurrent(r);
    try {
      const detailed = await fetchRiderDetail(r.id);
      setCurrent(detailed);
    } catch {
      // keep row data if detail fetch fails
    }
    if (r.status === "verified" || r.status === "suspended") setProfileOpen(true);
    else setDocsOpen(true);
  };

  const applyStatus = async () => {
    const ids = selected.length ? selected : current ? [current.id] : [];
    if (!ids.length) return;
    const next: RiderStatus =
      confirmKind === "approve" ? "verified" :
      confirmKind === "reject" ? "rejected" :
      confirmKind === "activate" ? "verified" : "suspended";

    try {
      await Promise.all(ids.map((id) => setRiderStatus(id, next)));
      if (current && ids.length === 1 && (confirmKind === "approve" || confirmKind === "reject")) {
        const docStatus = confirmKind === "approve" ? "VERIFIED" : "REJECTED";
        await Promise.all((current.documents || []).filter((d) => d.status === "PENDING").map((d) => reviewRiderDocument(d.id, docStatus)));
      }
      closeAll();
      setVersion((v) => v + 1);
    } catch (err: any) {
      setError(err?.message || "Unable to update rider");
      setConfirmOpen(false);
    }
  };

  return (
    <div className="bg-transparent">
      {/* Tabs */}
      <div className="mb-4">
        <Tabs active={tab} onChange={setTab} counts={counts} />
      </div>

      {/* Search + filter + bulk icons */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-[520px] flex-1 basis-[280px]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone or status"
            aria-label="Search riders"
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

        {/* Icon-only bulk actions (reuse MerchantBulkActions) */}
        <MerchantBulkActions
          tab={tab}
          disabled={!hasSelection}
          onSuspend={() => openConfirm("suspend")}
          onActivate={() => openConfirm("activate")}
          onApprove={() => openConfirm("approve")}
          onReject={() => openConfirm("reject")}
        />
      </div>

      {/* Card + table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="text-sm text-gray-500">
            Showing {(safePage - 1) * perPage + 1} to{" "}
            {Math.min(safePage * perPage, total)} of {total} entries
          </div>
        </div>

        {error && <div className="px-6 py-3 text-sm text-red-600">{error}</div>}
        {loading && <TableLoadingState rows={6} columns={7} label="Loading riders" />}

        {!loading && <div className="overflow-x-auto overscroll-x-contain" tabIndex={0} aria-label="Riders table, horizontally scrollable">
          <table className="w-full min-w-[980px] table-fixed divide-y divide-gray-200">
            <colgroup><col className="w-14"/><col className="w-[18%]"/><col className="w-[16%]"/><col className="w-[22%]"/><col className="w-[13%]"/><col className="w-[14%]"/><col className="w-[10%]"/><col className="w-28"/></colgroup>
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
                    aria-label="Select all riders on this page"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                {[
                  "Rider Name",
                  "Phone Number",
                  "Email Address",
                  "City",
                  "Last Login Date",
                  "Vehicle",
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
              {items.map((r) => (
                <tr
                  key={r.id}
                  className="group/row hover:bg-gray-50"
                >
                  <td className="sticky left-0 z-10 bg-white px-4 py-4 group-hover/row:bg-gray-50 sm:px-6" data-stop>
                    <input
                      type="checkbox"
                      checked={selected.includes(r.id)}
                      onChange={() => toggleOne(r.id)}
                      aria-label={`Select ${r.fullName || "rider"}`}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>

                  <td className="px-4 py-4 text-sm font-medium text-gray-900 sm:px-6">
                    <CopyableCell value={r.fullName} label="rider name" />
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 sm:px-6">
                    <CopyableCell value={r.phoneNumber} label="phone number" />
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 sm:px-6">
                    <CopyableCell value={r.email} label="email address" />
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 sm:px-6">
                    <CopyableCell value={r.city} label="city" />
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 sm:px-6">
                    <CopyableCell value={r.lastLoginDate} label="last login date" />
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 sm:px-6">
                    <CopyableCell value={r.vehicle ?? "Bike"} label="vehicle" />
                  </td>

                  <td className="sticky right-0 z-10 bg-white px-4 py-4 text-sm group-hover/row:bg-gray-50 sm:px-6" data-stop>
                    <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => onRowClick(r)} className="grid h-9 w-9 place-items-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label={`View details for ${r.fullName}`} title="View details"><Eye className="h-4 w-4"/></button>
                    <button
                      type="button"
                      className="grid h-9 w-9 place-items-center rounded-md border border-gray-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={(e) => openRowMenu(r, e.currentTarget)}
                      aria-label="Row actions"
                    >
                      <MoreHorizontal className="h-4 w-4 text-gray-600" />
                    </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500">No riders match the current search and filters.</td></tr>}
            </tbody>
          </table>
        </div>}

        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Showing {(safePage - 1) * perPage + 1} to{" "}
            {Math.min(safePage * perPage, total)} of {total} entries
          </span>
          <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>

      {/* Filter popover */}
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

      {/* Row menu */}
      <RiderRowMenu
        open={menuOpen}
        anchor={menuCoords}
        status={(menuRider?.status ?? "verified") as RiderStatus}
        onClose={() => setMenuOpen(false)}
        onViewProfile={() => {
          if (!menuRider) return;
          setCurrent(menuRider);
          setProfileOpen(true);
        }}
        onUpgrade={() => {
          // optional: rider upgrade flow
        }}
        onViewDocs={() => {
          if (!menuRider) return;
          setCurrent(menuRider);
          setDocsOpen(true);
        }}
        onSuspend={() => openConfirm("suspend", menuRider!)}
        onActivate={() => openConfirm("activate", menuRider!)}
        onApprove={() => openConfirm("approve", menuRider!)}
        onReject={() => openConfirm("reject", menuRider!)}
      />

      {/* Profile (verified/suspended) — reuse merchant modal */}
      <MerchantProfileModal
        open={profileOpen && !!current}
        onClose={() => setProfileOpen(false)}
        merchant={
          current
            ? ({
                ...current,
                businessName: current.fullName,
                serviceTier: current.vehicle ?? "Rider",
                city: current.city,
                address: current.address || current.area || current.city,
              } as any)
            : undefined
        }
        onPrimaryAction={() => {
          if (!current) return;
          openConfirm(current.status === "suspended" ? "activate" : "suspend", current);
        }}
      />

      {/* Documents (pending/rejected) — rider-specific 540px modal */}
      <RiderDocumentsModal
        open={docsOpen && !!current}
        onClose={() => setDocsOpen(false)}
        rider={current ?? undefined}
        onApprove={() => openConfirm("approve", current!)}
        onReject={() => openConfirm("reject", current!)}
      />

      {/* Stacked confirm over any open modal */}
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
