"use client";
import * as React from "react";
import { Filter, Search as SearchIcon } from "lucide-react";
import ModalBase from "./ModalBase";
import { fetchUserOrders, type UserOrderRow } from "@/lib/users";

type HistoryTab = "completed" | "ongoing" | "cancelled";

const GROUP_BY_TAB: Record<HistoryTab, "COMPLETED" | "ACTIVE" | "CANCELLED"> = {
  completed: "COMPLETED",
  ongoing: "ACTIVE",
  cancelled: "CANCELLED",
};

export default function OrderHistoryModal({
  open,
  onClose,
  userName,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  userName: string;
  userId?: string;
}) {
  const [tab, setTab] = React.useState<HistoryTab>("completed");
  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState<UserOrderRow[]>([]);
  const [counts, setCounts] = React.useState<Record<HistoryTab, number>>({ completed: 0, ongoing: 0, cancelled: 0 });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !userId) return;
    let alive = true;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchUserOrders(userId, GROUP_BY_TAB.completed),
      fetchUserOrders(userId, GROUP_BY_TAB.ongoing),
      fetchUserOrders(userId, GROUP_BY_TAB.cancelled),
    ])
      .then(([completed, ongoing, cancelled]) => {
        if (!alive) return;
        setCounts({ completed: completed.length, ongoing: ongoing.length, cancelled: cancelled.length });
        setRows({ completed, ongoing, cancelled }[tab]);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err?.message || "Unable to load order history");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [open, userId, tab]);

  const tabs = [
    { id: "completed", label: "Completed", count: counts.completed },
    { id: "ongoing", label: "Ongoing", count: counts.ongoing },
    { id: "cancelled", label: "Cancelled", count: counts.cancelled },
  ] as const;

  const filteredRows = rows.filter((r) =>
    [r.type, r.amount, r.merchant, r.date, r.time, r.rider].join(" ").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <ModalBase open={open} onClose={onClose} width={860}>
      <div className="px-6 pt-6">
        <h3 className="text-xl font-semibold text-gray-900 text-center">
          User order history{userName ? ` — ${userName}` : ""}
        </h3>
        <div className="mt-4 flex items-center justify-center gap-8 border-b border-gray-200">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative px-1 py-3 text-sm ${active ? "text-gray-900" : "text-gray-500"}`}
              >
                {t.label} ({t.count})
                <span className={`absolute left-0 -bottom-[1px] h-[2px] w-full rounded bg-blue-600 ${active ? "opacity-100" : "opacity-0"}`} />
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <div className="relative w-[360px]">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by type, date"
              className="w-[360px] h-[40px] rounded-md border border-gray-200 bg-white pl-9 pr-10 text-sm placeholder:text-gray-400 focus:ring-1 focus:ring-blue-500"
            />
            <button className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md border border-gray-200 bg-white grid place-items-center">
              <Filter className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 px-6 pb-6">
        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
        {loading && <div className="mb-3 text-sm text-gray-500">Loading order history…</div>}
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {["Type", "Amount", "Merchant", "Date and Time", "Rider"].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredRows.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 text-sm text-gray-900">{r.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{r.amount}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{r.merchant}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{r.date} &nbsp; {r.time}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{r.rider}</td>
                </tr>
              ))}
              {!loading && filteredRows.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-gray-500" colSpan={5}>
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ModalBase>
  );
}
