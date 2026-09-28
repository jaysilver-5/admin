"use client";

import * as React from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type AdminNotification = {
  id: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  readAt?: string | null;
  createdAt: string;
};

const SECTION_ROUTES: Record<string, string> = {
  users: "/dashboard/users",
  merchants: "/dashboard/merchants",
  riders: "/dashboard/riders",
  orders: "/dashboard/orders",
  support: "/dashboard/support",
  finance: "/dashboard/finance",
  withdrawals: "/dashboard/withdrawals",
};

function relativeTime(value: string) {
  const elapsed = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(elapsed) || elapsed < 60_000) return "Now";
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

export default function AdminNotificationBell() {
  const router = useRouter();
  const panelRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<AdminNotification[]>([]);
  const [unread, setUnread] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const [notifications, count] = await Promise.all([
        apiFetch<AdminNotification[]>("/notifications"),
        apiFetch<{ count: number }>("/notifications/unread-count"),
      ]);
      setItems(notifications.slice(0, 20));
      setUnread(count.count);
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load notifications",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(timer);
  }, [load]);

  React.useEffect(() => {
    if (!open) return;
    void load(true);
    const close = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open, load]);

  const openNotification = async (notification: AdminNotification) => {
    if (!notification.readAt) {
      setItems((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, readAt: new Date().toISOString() }
            : item,
        ),
      );
      setUnread((count) => Math.max(0, count - 1));
      void apiFetch(`/notifications/${encodeURIComponent(notification.id)}/read`, {
        method: "PATCH",
      }).catch(() => void load());
    }
    setOpen(false);
    const screen = String(notification.data?.screen || "").toLowerCase();
    const target = SECTION_ROUTES[screen];
    if (target) router.push(target);
  };

  const markAllRead = async () => {
    const previous = items;
    setItems((current) =>
      current.map((item) => ({
        ...item,
        readAt: item.readAt || new Date().toISOString(),
      })),
    );
    setUnread(0);
    try {
      await apiFetch("/notifications/read-all", { method: "PATCH" });
    } catch {
      setItems(previous);
      void load();
    }
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-full p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Bell className="h-6 w-6" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="font-semibold text-slate-950">Admin notifications</p>
              <p className="text-xs text-slate-500">
                {unread ? `${unread} unread update${unread === 1 ? "" : "s"}` : "You are all caught up"}
              </p>
            </div>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-[#071D59] hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <CheckCheck className="h-4 w-4" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[28rem] overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="grid place-items-center py-12 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : error && items.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-red-600">{error}</div>
            ) : items.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="font-medium text-slate-800">No notifications yet</p>
                <p className="mt-1 text-sm text-slate-500">Account, order and support activity will appear here.</p>
              </div>
            ) : (
              items.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => void openNotification(notification)}
                  className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition last:border-0 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
                    notification.readAt ? "bg-white" : "bg-blue-50/60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.readAt ? "bg-transparent" : "bg-blue-600"}`} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span className="font-semibold text-slate-900">{notification.title}</span>
                        <span className="shrink-0 text-[11px] text-slate-400">{relativeTime(notification.createdAt)}</span>
                      </span>
                      <span className="mt-1 block text-sm leading-5 text-slate-600">{notification.body}</span>
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
