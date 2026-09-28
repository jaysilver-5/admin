import { apiFetch, ApiList, formatDate, formatTime, totalPages } from "./api";

export type UiOrderStatus = "active" | "completed" | "cancelled";

export type UiOrder = {
  id: string;
  orderNumber: string;
  userName: string;
  userPublicId?: string;
  customerPhone?: string;
  washType: string;
  merchantName: string;
  merchantPublicId?: string;
  merchantPhone?: string;
  merchantAddress?: string;
  city: string;
  state: string;
  requestDate: string;
  requestTime: string;
  merchantRate: number;
  deliveryRate: number;
  transactionId: string;
  rider?: string;
  riderPhone?: string;
  riderAssignments: {
    id: string;
    role: string;
    status: string;
    name: string;
    publicId?: string;
    phone?: string;
    vehicle?: string;
    assignedAt?: string;
    acceptedAt?: string;
    completedAt?: string;
  }[];
  status: UiOrderStatus;
  timeline?: { title: string; body?: string; date: string }[];
  raw?: any;
};

const GROUP_BY_STATUS: Record<UiOrderStatus, "ACTIVE" | "COMPLETED" | "CANCELLED"> = {
  active: "ACTIVE",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
};

function mapStatus(status: string): UiOrderStatus {
  if (status === "COMPLETED") return "completed";
  if (status === "CANCELLED") return "cancelled";
  return "active";
}

export function mapBackendOrder(order: any): UiOrder {
  const assignments = (order.riderAssignments || []).map((assignment: any) => {
    const assignmentRider = assignment.rider || {};
    return {
      id: String(assignment.id || `${assignment.role}-${assignment.riderId}`),
      role: String(assignment.role || "RIDER"),
      status: String(assignment.status || "UNKNOWN"),
      name: assignmentRider.fullName || assignmentRider.displayName || [assignmentRider.firstName, assignmentRider.lastName].filter(Boolean).join(" ") || "Rider",
      publicId: assignmentRider.publicId || assignmentRider.account?.publicId || undefined,
      phone: assignmentRider.phone || assignmentRider.account?.phone || undefined,
      vehicle: assignmentRider.vehicleLabel || assignmentRider.vehicleType || undefined,
      assignedAt: assignment.assignedAt,
      acceptedAt: assignment.acceptedAt,
      completedAt: assignment.completedAt,
    };
  });
  const riderAssignment = assignments.find((assignment: any) => assignment.status === "ACCEPTED") || assignments[0];
  const riderName = riderAssignment?.name;
  const createdAt = order.createdAt || order.updatedAt;
  return {
    id: String(order.id),
    orderNumber: String(order.orderNumber || order.id),
    userName: order.customer?.name || order.contactName || order.user?.userProfile?.fullName || order.user?.email || "—",
    userPublicId: order.user?.publicId || undefined,
    customerPhone: order.customer?.phone || order.contactPhone || order.user?.phone || undefined,
    washType: order.deliveryType || order.serviceType || order.washType || "Laundry",
    merchantName: order.merchant?.businessName || "—",
    merchantPublicId: order.merchant?.account?.publicId || undefined,
    merchantPhone: order.merchant?.businessPhone || order.merchant?.account?.phone || undefined,
    merchantAddress: order.merchant?.address || undefined,
    city: order.pickupCity || order.merchant?.city || "—",
    state: order.pickupState || order.merchant?.state || "—",
    requestDate: formatDate(createdAt),
    requestTime: formatTime(createdAt),
    merchantRate: Number(order.serviceAmount || order.merchantRate || 0),
    deliveryRate: Number(order.logisticsFee || order.deliveryFee || order.deliveryRate || 0),
    transactionId: order.paymentReference || order.orderNumber || order.id,
    rider: riderName,
    riderPhone: riderAssignment?.phone,
    riderAssignments: assignments,
    status: mapStatus(order.status),
    timeline: (order.timeline || []).map((event: any) => ({
      title: String(event.type || "Update").replace(/_/g, " "),
      body: event.data?.note || event.data?.message || event.data?.body || (event.data?.from && event.data?.to ? `${String(event.data.from).replaceAll("_", " ")} → ${String(event.data.to).replaceAll("_", " ")}` : undefined),
      date: `${formatDate(event.createdAt)} ${formatTime(event.createdAt)}`,
    })),
    raw: order,
  };
}

export async function fetchOrders(tab: UiOrderStatus, page: number, perPage: number, search?: string) {
  const res = await apiFetch<ApiList<any>>("/admin/orders", {
    query: { page, limit: perPage, search, group: GROUP_BY_STATUS[tab] },
  });
  const pageCount = totalPages(res.total, res.limit || perPage);
  return {
    items: (res.items || []).map(mapBackendOrder),
    total: res.total || 0,
    totalPages: pageCount,
    page: Math.min(Math.max(1, res.page || page), pageCount),
  };
}

export async function fetchOrderDetail(id: string) {
  return mapBackendOrder(await apiFetch<any>(`/admin/orders/${id}`));
}

export async function updateOrderStatus(id: string, status: string, note?: string) {
  return apiFetch(`/admin/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, note }),
  });
}

export async function cancelOrder(id: string, reason?: string) {
  return apiFetch(`/admin/orders/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}
