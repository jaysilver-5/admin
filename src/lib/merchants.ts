import { apiFetch, ApiList, formatDate, totalPages } from "./api";

export type MerchantStatus = "verified" | "pending" | "rejected" | "suspended";

export type MerchantDocument = {
  id: string;
  type: string;
  url: string;
  status: "PENDING" | "VERIFIED" | "REJECTED" | string;
  createdAt?: string;
};

export type Merchant = {
  id: string;
  businessName: string;
  phoneNumber: string;
  email: string;
  address: string;
  lastLoginDate: string;
  serviceTier: "Basic" | "Standard" | "Premium" | "Exclusive" | string;
  status: MerchantStatus;
  city?: string;
  documents?: MerchantDocument[];
  earnings?: any;
  orders?: any;
  withdrawals?: any;
  raw?: any;
};

const statusToBackend: Record<MerchantStatus, string> = {
  verified: "VERIFIED",
  pending: "PENDING",
  rejected: "REJECTED",
  suspended: "SUSPENDED",
};

function fromBackendStatus(status?: string): MerchantStatus {
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

function serviceTier(value?: string | null) {
  const normalized = String(value || "").toUpperCase();
  if (normalized.includes("EXCLUSIVE")) return "Exclusive";
  if (normalized.includes("PREMIUM")) return "Premium";
  if (normalized.includes("STANDARD")) return "Standard";
  return "Basic";
}

export function mapBackendMerchant(m: any): Merchant {
  return {
    id: String(m.id),
    businessName: m.businessName || m.fullName || m.account?.email || "—",
    phoneNumber: m.businessPhone || m.phone || m.account?.phone || "—",
    email: m.businessEmail || m.email || m.account?.email || "—",
    address: [m.address, m.city, m.state].filter(Boolean).join(", ") || "—",
    lastLoginDate: formatDate(m.account?.lastLoginAt || m.lastLoginAt || m.updatedAt),
    serviceTier: serviceTier(m.planCategory || m.serviceTier),
    status: fromBackendStatus(m.status),
    city: m.city || m.state,
    documents: m.documents,
    earnings: m.earnings,
    orders: m.orders,
    withdrawals: m.withdrawals,
    raw: m,
  };
}

export async function countMerchants(): Promise<Record<MerchantStatus, number>> {
  const pairs = await Promise.all(
    (["verified", "pending", "rejected", "suspended"] as MerchantStatus[]).map(async (s) => {
      const res = await apiFetch<ApiList<any>>("/admin/merchants", {
        query: { page: 1, limit: 1, status: statusToBackend[s] },
      });
      return [s, res.total || 0] as const;
    }),
  );
  return Object.fromEntries(pairs) as Record<MerchantStatus, number>;
}

export async function fetchMerchants({
  tab,
  page,
  perPage,
  search,
  filters,
}: {
  tab: "all" | MerchantStatus;
  page: number;
  perPage: number;
  search: string;
  filters?: { statuses?: MerchantStatus[]; rejected?: boolean; recentlyLogin?: boolean };
}) {
  const filterStatuses = [
    ...(filters?.statuses || []),
    ...(filters?.rejected ? (["rejected"] as MerchantStatus[]) : []),
  ];

  if (filterStatuses.length || filters?.recentlyLogin) {
    const res = await apiFetch<ApiList<any>>("/admin/merchants", { query: { page: 1, limit: 100, search } });
    let rows = (res.items || []).map(mapBackendMerchant);
    if (tab !== "all") rows = rows.filter((m) => m.status === tab);
    if (filterStatuses.length) rows = rows.filter((m) => filterStatuses.includes(m.status));
    if (filters?.recentlyLogin) {
      rows = rows.filter((m) => {
        const d = new Date(m.raw?.account?.lastLoginAt || m.raw?.lastLoginAt || 0).getTime();
        return Number.isFinite(d) && Date.now() - d <= 1000 * 60 * 60 * 24 * 7;
      });
    }
    const total = rows.length;
    const pageCount = totalPages(total, perPage);
    const safePage = Math.min(Math.max(1, page), pageCount);
    const start = (safePage - 1) * perPage;
    return { items: rows.slice(start, start + perPage), total, totalPages: pageCount, page: safePage };
  }

  const res = await apiFetch<ApiList<any>>("/admin/merchants", {
    query: {
      page,
      limit: perPage,
      search,
      status: tab !== "all" ? statusToBackend[tab] : undefined,
    },
  });
  const pageCount = totalPages(res.total, res.limit || perPage);
  return {
    items: (res.items || []).map(mapBackendMerchant),
    total: res.total || 0,
    totalPages: pageCount,
    page: Math.min(Math.max(1, res.page || page), pageCount),
  };
}

export async function fetchMerchantDetail(id: string) {
  return mapBackendMerchant(await apiFetch<any>(`/admin/merchants/${id}`));
}

export async function fetchMerchantDocuments(id: string) {
  return apiFetch<MerchantDocument[]>(`/admin/merchants/${id}/documents`);
}

export async function setMerchantStatus(id: string, status: MerchantStatus, reason?: string) {
  return apiFetch(`/admin/merchants/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: statusToBackend[status], reason }),
  });
}

export async function reviewMerchantDocument(documentId: string, status: "VERIFIED" | "REJECTED", reason?: string) {
  return apiFetch(`/admin/documents/${documentId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, reason }),
  });
}
