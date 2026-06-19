import { apiFetch, ApiList, formatDate, totalPages } from "./api";
import type { MerchantDocument } from "./merchants";

export type RiderStatus = "verified" | "pending" | "rejected" | "suspended";

export interface Rider {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  city: string;
  area?: string;
  address?: string;
  lastLoginDate: string;
  vehicle?: string;
  status: RiderStatus;
  documents?: MerchantDocument[];
  earnings?: any;
  deliveries?: any;
  withdrawals?: any;
  raw?: any;
}

const statusToBackend: Record<RiderStatus, string> = {
  verified: "VERIFIED",
  pending: "PENDING",
  rejected: "REJECTED",
  suspended: "SUSPENDED",
};

function fromBackendStatus(status?: string): RiderStatus {
  switch ((status || "").toUpperCase()) {
    case "PENDING":
      return "pending";
    case "REJECTED":
      return "rejected";
    case "SUSPENDED":
      return "suspended";
    default:
      return "verified";
  }
}

export function mapBackendRider(r: any): Rider {
  const fullName = r.fullName || [r.firstName, r.lastName].filter(Boolean).join(" ") || r.account?.email || "—";
  return {
    id: String(r.id),
    fullName,
    phoneNumber: r.phone || r.account?.phone || "—",
    email: r.email || r.account?.email || "—",
    city: r.city || r.state || "—",
    area: r.area || r.lga || undefined,
    address: r.address || undefined,
    lastLoginDate: formatDate(r.account?.lastLoginAt || r.lastLoginAt || r.updatedAt),
    vehicle: r.vehicleType || r.vehicle || "Bike",
    status: fromBackendStatus(r.status),
    documents: r.documents,
    earnings: r.earnings,
    deliveries: r.deliveries,
    withdrawals: r.withdrawals,
    raw: r,
  };
}

export async function countRiders(): Promise<Record<RiderStatus, number>> {
  const pairs = await Promise.all(
    (["verified", "pending", "rejected", "suspended"] as RiderStatus[]).map(async (s) => {
      const res = await apiFetch<ApiList<any>>("/admin/riders", {
        query: { page: 1, limit: 1, status: statusToBackend[s] },
      });
      return [s, res.total || 0] as const;
    }),
  );
  return Object.fromEntries(pairs) as Record<RiderStatus, number>;
}

export async function fetchRiders({
  tab,
  page,
  perPage,
  search,
  filters,
}: {
  tab: RiderStatus;
  page: number;
  perPage: number;
  search?: string;
  filters?: { statuses?: RiderStatus[]; rejected?: boolean; recentlyLogin?: boolean };
}): Promise<{ items: Rider[]; total: number; totalPages: number; page: number }> {
  const filterStatuses = [
    ...(filters?.statuses || []),
    ...(filters?.rejected ? (["rejected"] as RiderStatus[]) : []),
  ];

  if (filterStatuses.length || filters?.recentlyLogin) {
    const res = await apiFetch<ApiList<any>>("/admin/riders", { query: { page: 1, limit: 100, search } });
    let rows = (res.items || []).map(mapBackendRider).filter((r) => r.status === tab);
    if (filterStatuses.length) rows = rows.filter((r) => filterStatuses.includes(r.status));
    if (filters?.recentlyLogin) {
      rows = rows.filter((r) => {
        const d = new Date(r.raw?.account?.lastLoginAt || r.raw?.lastLoginAt || 0).getTime();
        return Number.isFinite(d) && Date.now() - d <= 1000 * 60 * 60 * 24 * 7;
      });
    }
    const total = rows.length;
    const pageCount = totalPages(total, perPage);
    const safePage = Math.min(Math.max(1, page), pageCount);
    const start = (safePage - 1) * perPage;
    return { items: rows.slice(start, start + perPage), total, totalPages: pageCount, page: safePage };
  }

  const res = await apiFetch<ApiList<any>>("/admin/riders", {
    query: { page, limit: perPage, search, status: statusToBackend[tab] },
  });
  const pageCount = totalPages(res.total, res.limit || perPage);
  return {
    items: (res.items || []).map(mapBackendRider),
    total: res.total || 0,
    totalPages: pageCount,
    page: Math.min(Math.max(1, res.page || page), pageCount),
  };
}

export async function fetchRiderDetail(id: string) {
  return mapBackendRider(await apiFetch<any>(`/admin/riders/${id}`));
}

export async function fetchRiderDocuments(id: string) {
  return apiFetch<MerchantDocument[]>(`/admin/riders/${id}/documents`);
}

export async function setRiderStatus(id: string, status: RiderStatus, reason?: string) {
  return apiFetch(`/admin/riders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: statusToBackend[status], reason }),
  });
}

export async function reviewRiderDocument(documentId: string, status: "VERIFIED" | "REJECTED", reason?: string) {
  return apiFetch(`/admin/documents/${documentId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, reason }),
  });
}
