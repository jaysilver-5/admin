"use client";
import * as React from "react";
import { Filter, Search as SearchIcon } from "lucide-react";

import UserTabs from "@/components/dashboard/tables/UserTabs";
import Pagination from "@/components/dashboard/tables/Pagination";
import UserTable from "@/components/dashboard/tables/UserTable";
import UserFilterPopover from "@/components/dashboard/filters/UserFilterPopover";
import ConfirmActionModal from "@/components/dashboard/modals/ConfirmActionModal";
import OrderHistoryModal from "@/components/dashboard/modals/OrderHistoryModal";

import {
  countUsers,
  fetchUsers,
  setUserStatus,   // ← persist status toggle
  User,
  UserStatus,
} from "@/lib/users";

export default function UserManagementTab() {
  // page UI state
  const [tab, setTab] = React.useState<"all" | "new">("all");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const perPage = 8;

  // filters
  const filterBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<{
    recentlyLogin?: boolean;
    statuses: UserStatus[];
    rejected?: boolean;
  }>({ statuses: [] });

  // modals
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmKind, setConfirmKind] = React.useState<"suspend" | "activate">("suspend");
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  // data
  const [version, setVersion] = React.useState(0);
  const [items, setItems] = React.useState<User[]>([]);
  const [counts, setCounts] = React.useState({ all: 0, new: 0 });
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [safePage, setSafePage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => setPage(1), [search, tab, filters]);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchUsers({ tab, page, perPage, search, filters }),
      countUsers(),
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
        setError(err?.message || "Unable to load users");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [tab, page, perPage, search, filters, version]);

  // esc closes modals/popovers
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFilterOpen(false);
        setConfirmOpen(false);
        setHistoryOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // clicking the action button in the table
  const requestToggle = (u: User) => {
    setCurrentUser(u);
    setConfirmKind(u.status === "suspended" ? "activate" : "suspend");
    setConfirmOpen(true);
  };

  return (
    <div className="bg-transparent relative">
      {/* Search */}
      <div className="mb-4">
        <div className="relative w-[440px]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, Name or wallet balance"
            className="w-[440px] h-[46px] rounded-md border border-gray-200 bg-white pl-9 pr-12 text-sm placeholder:text-gray-400 focus:ring-1 focus:ring-blue-500"
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
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <UserTabs active={tab} counts={counts} onChange={setTab} />
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="text-sm text-gray-500">
            Showing {(safePage - 1) * perPage + 1} to {Math.min(safePage * perPage, total)} of {total} entries
          </div>
        </div>

        {error && <div className="px-6 py-3 text-sm text-red-600">{error}</div>}
        {loading && <div className="px-6 py-3 text-sm text-gray-500">Loading users…</div>}

        <UserTable
          users={items}
          onRowOpenHistory={(u) => {
            setCurrentUser(u);
            setHistoryOpen(true);
          }}
          onAction={requestToggle} // ← suspend/activate entry point
        />

        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Showing {(safePage - 1) * perPage + 1} to {Math.min(safePage * perPage, total)} of {total} entries
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

      {/* Confirm: suspend/activate user */}
      <ConfirmActionModal
        open={confirmOpen}
        kind={confirmKind}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          if (!currentUser) return;
          const next = confirmKind === "suspend" ? "suspended" : "verified";
          try {
            await setUserStatus(currentUser.id, next);
            setConfirmOpen(false);
            setVersion((v) => v + 1);
          } catch (err: any) {
            setError(err?.message || "Unable to update user");
            setConfirmOpen(false);
          }
        }}
      />

      {/* Order history modal */}
      <OrderHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        userName={currentUser?.fullName || ""}
        userId={currentUser?.id}
      />
    </div>
  );
}
