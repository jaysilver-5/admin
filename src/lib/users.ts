import { apiFetch, ApiList, formatDate, formatTime, totalPages } from "./api";

export type UserStatus = "verified" | "suspended" | "pending";

export type User = {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  walletBalance: number;
  lastLoginDate: string;
  isNew?: boolean;
  status: UserStatus;
  recentlyLogin?: boolean;
  createdAt?: string;
  raw?: any;
};

export type UserOrderRow = {
  id: string;
  type: string;
  amount: string;
  merchant: string;
  date: string;
  time: string;
  rider: string;
  status: "completed" | "ongoing" | "cancelled";
};

const isRecent = (createdAt?: string | null) => {
  if (!createdAt) return false;
  const d = new Date(createdAt).getTime();
  if (Number.isNaN(d)) return false;
  return Date.now() - d <= 1000 * 60 * 60 * 24 * 14;
};

const isRecentlyLoggedIn = (lastLoginAt?: string | null) => {
  if (!lastLoginAt) return false;
  const d = new Date(lastLoginAt).getTime();
  if (Number.isNaN(d)) return false;
  return Date.now() - d <= 1000 * 60 * 60 * 24 * 7;
};

function mapBackendUser(user: any): User {
  return {
    id: String(user.id),
    fullName: user.fullName || user.profile?.fullName || user.userProfile?.fullName || "—",
    phoneNumber: user.phone || "—",
    email: user.email || "—",
    walletBalance: Number(user.walletBalance || 0),
    lastLoginDate: formatDate(user.lastLoginAt),
    isNew: isRecent(user.createdAt),
    status: user.isActive === false ? "suspended" : "verified",
    recentlyLogin: isRecentlyLoggedIn(user.lastLoginAt),
    createdAt: user.createdAt,
    raw: user,
  };
}

export async function countUsers() {
  const all = await apiFetch<ApiList<any>>("/admin/users", { query: { page: 1, limit: 1 } });
  const recent = await apiFetch<ApiList<any>>("/admin/users", { query: { page: 1, limit: 100 } });
  return {
    all: all.total || 0,
    new: (recent.items || []).filter((u) => isRecent(u.createdAt)).length,
  };
}

export async function fetchUsers(params: {
  tab: "all" | "new";
  page: number;
  perPage: number;
  search?: string;
  filters?: {
    recentlyLogin?: boolean;
    statuses?: UserStatus[];
    rejected?: boolean;
  };
}) {
  const { tab, page, perPage, search, filters } = params;

  // Backend has no dedicated “new users” filter yet, so the new tab is derived safely client-side
  // from the first 100 latest users without changing the UI.
  if (tab === "new" || filters?.recentlyLogin || filters?.statuses?.length) {
    const res = await apiFetch<ApiList<any>>("/admin/users", {
      query: { page: 1, limit: 100, search },
    });
    let rows = (res.items || []).map(mapBackendUser);
    if (tab === "new") rows = rows.filter((u) => u.isNew);
    if (filters?.recentlyLogin) rows = rows.filter((u) => u.recentlyLogin);
    if (filters?.statuses?.length) rows = rows.filter((u) => filters.statuses!.includes(u.status));

    const total = rows.length;
    const pageCount = totalPages(total, perPage);
    const safePage = Math.min(Math.max(1, page), pageCount);
    const start = (safePage - 1) * perPage;
    return { items: rows.slice(start, start + perPage), total, totalPages: pageCount, page: safePage };
  }

  const res = await apiFetch<ApiList<any>>("/admin/users", {
    query: { page, limit: perPage, search },
  });
  const pageCount = totalPages(res.total, res.limit || perPage);
  return {
    items: (res.items || []).map(mapBackendUser),
    total: res.total || 0,
    totalPages: pageCount,
    page: Math.min(Math.max(1, res.page || page), pageCount),
  };
}

export async function setUserStatus(id: string, status: UserStatus) {
  return apiFetch(`/admin/users/${id}/toggle-active`, {
    method: "PATCH",
    body: JSON.stringify({ isActive: status !== "suspended" }),
  });
}

export async function fetchUserOrders(userId: string, group: "COMPLETED" | "ACTIVE" | "CANCELLED", search?: string) {
  const res = await apiFetch<ApiList<any>>(`/admin/users/${userId}/orders`, {
    query: { page: 1, limit: 50, group, search },
  });
  return (res.items || []).map((order): UserOrderRow => {
    const status = order.status === "COMPLETED" ? "completed" : order.status === "CANCELLED" ? "cancelled" : "ongoing";
    const rider = (order.riderAssignments || [])?.[0]?.rider;
    const riderName = rider?.fullName || [rider?.firstName, rider?.lastName].filter(Boolean).join(" ") || "—";
    return {
      id: order.id,
      type: order.deliveryType || order.washType || order.serviceType || "Laundry",
      amount: `₦${Number(order.totalAmount || order.amount || order.serviceAmount || 0).toLocaleString()}`,
      merchant: order.merchant?.businessName || "—",
      date: formatDate(order.createdAt),
      time: formatTime(order.createdAt),
      rider: riderName,
      status,
    };
  });
}
