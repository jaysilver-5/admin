import { apiFetch } from "./api";

export type DispatchLeg = "PICKUP" | "DELIVERY";

export interface RiderDispatchAlert {
  orderId: string;
  orderNumber: string;
  leg: DispatchLeg;
  status: string;
  reason: string;
  createdAt: string;
  attempts: number;
  lastRadiusKm?: number;
  scheduledAt?: string;
  adminNote?: string;
  customerName: string;
  customerPhone: string;
  locationLabel: string;
  latitude?: number;
  longitude?: number;
}

export interface DispatchRiderCandidate {
  riderId: string;
  name: string;
  identifier: string;
  phone: string;
  vehicle: string;
  distanceKm?: number;
  activeAssignments: number;
  maxAssignments: number;
  isOnline: boolean;
  available: boolean;
}

export interface RiderDispatchSettings {
  initialRadiusKm: number;
  maxRadiusKm: number;
}

type UnknownRecord = Record<string, any>;

function record(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function rows(value: unknown): UnknownRecord[] {
  if (Array.isArray(value)) return value.map(record);
  const payload = record(value);
  for (const key of ["items", "alerts", "candidates", "data", "results"]) {
    if (Array.isArray(payload[key])) return payload[key].map(record);
  }
  return [];
}

function finiteNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function text(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

function normalizeAlert(input: UnknownRecord): RiderDispatchAlert {
  const order = record(input.order);
  const customer = record(input.customer || input.user || order.user);
  const leg = text(input.leg, input.role, input.assignmentRole).toUpperCase() === "DELIVERY"
    ? "DELIVERY"
    : "PICKUP";
  const location = record(
    input.location ||
    (leg === "DELIVERY" ? input.delivery || input.deliveryLocation : input.pickup || input.pickupLocation),
  );

  return {
    orderId: text(input.orderId, order.id, input.id),
    orderNumber: text(input.orderNumber, order.orderNumber, order.number) || "Unnumbered order",
    leg,
    status: text(input.status, input.dispatchStatus) || "UNASSIGNED",
    reason: text(input.reason, input.failureReason, input.message) || "No rider accepted the dispatch request.",
    createdAt: text(input.openedAt, input.lastOccurredAt, input.createdAt, input.alertedAt, input.updatedAt, order.updatedAt),
    attempts: finiteNumber(input.attempts) ?? 0,
    lastRadiusKm: finiteNumber(input.lastRadiusKm),
    scheduledAt: text(input.scheduledAt) || undefined,
    adminNote: text(input.adminNote, input.note) || undefined,
    customerName:
      text(input.customerName, input.userName, customer.fullName, customer.name) ||
      [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
      "Customer",
    customerPhone: text(input.customerPhone, input.userPhone, customer.phone, customer.phoneNumber),
    locationLabel:
      text(input.locationLabel, input.address, location.address, location.label, order.pickupAddress, order.deliveryAddress) ||
      "Location unavailable",
    latitude: finiteNumber(input.latitude, input.lat, location.latitude, location.lat),
    longitude: finiteNumber(input.longitude, input.lng, location.longitude, location.lng),
  };
}

function normalizeCandidate(input: UnknownRecord, configuredMax = 5): DispatchRiderCandidate {
  const rider = record(input.rider || input.profile);
  const account = record(input.account || rider.account);
  const activeAssignments = finiteNumber(
    input.activeAssignments,
    input.activeOrderCount,
    input.activeCount,
    input.capacity?.used,
    rider.activeAssignments,
  ) ?? 0;
  const maxAssignments = finiteNumber(input.maxAssignments, input.capacity?.max, input.capacityLimit) ?? configuredMax;
  const name =
    text(input.name, input.fullName, rider.fullName) ||
    [input.firstName || rider.firstName, input.lastName || rider.lastName].filter(Boolean).join(" ") ||
    "Unnamed rider";

  return {
    riderId: text(input.riderId, rider.id, input.id),
    name,
    identifier: text(input.identifier, input.riderCode, rider.identifier, rider.id, input.id),
    phone: text(input.phone, input.phoneNumber, rider.phone, account.phone),
    vehicle: text(input.vehicle, input.vehicleType, rider.vehicleType) || "Vehicle not set",
    distanceKm: finiteNumber(input.distanceKm, input.distance, rider.distanceKm),
    activeAssignments,
    maxAssignments,
    isOnline: Boolean(input.isOnline ?? rider.isOnline ?? true),
    available: Boolean(input.available ?? (activeAssignments < maxAssignments)),
  };
}

export async function fetchRiderDispatchAlerts(): Promise<RiderDispatchAlert[]> {
  const response = await apiFetch<unknown>("/admin/rider-dispatch/alerts");
  return rows(response).map(normalizeAlert).filter((alert) => alert.orderId);
}

export async function fetchDispatchCandidates(orderId: string, role: DispatchLeg): Promise<DispatchRiderCandidate[]> {
  const response = await apiFetch<unknown>(`/admin/rider-dispatch/alerts/${orderId}/candidates`, {
    query: { role },
  });
  const payload = record(response);
  const configuredMax = finiteNumber(payload.settings?.maxActiveAssignments) ?? 5;
  return rows(response).map((candidate) => normalizeCandidate(candidate, configuredMax)).filter((rider) => rider.riderId);
}

export async function assignDispatchRider(orderId: string, riderId: string, role: DispatchLeg) {
  return apiFetch(`/admin/rider-dispatch/alerts/${orderId}/assign`, {
    method: "POST",
    body: JSON.stringify({ riderId, role }),
  });
}

export async function scheduleRiderDispatch(orderId: string, role: DispatchLeg, scheduledAt: string, note?: string) {
  return apiFetch(`/admin/rider-dispatch/alerts/${orderId}/schedule`, {
    method: "POST",
    body: JSON.stringify({ role, scheduledAt, note: note?.trim() || undefined }),
  });
}

export async function fetchRiderDispatchSettings(): Promise<RiderDispatchSettings> {
  const response = await apiFetch<unknown>("/admin/config/system");
  const configs = rows(response);
  const valueFor = (key: string, fallback: number) => {
    const item = configs.find((config) => text(config.key).toUpperCase() === key);
    return finiteNumber(item?.value, item?.parsedNumber) ?? fallback;
  };

  return {
    initialRadiusKm: valueFor("BROADCAST_INITIAL_RADIUS_KM", 5),
    maxRadiusKm: valueFor("BROADCAST_MAX_RADIUS_KM", 20),
  };
}

export async function updateRiderDispatchSettings(settings: RiderDispatchSettings) {
  return Promise.all([
    apiFetch("/admin/config/system/BROADCAST_INITIAL_RADIUS_KM", {
      method: "PUT",
      body: JSON.stringify({
        value: String(settings.initialRadiusKm),
        description: "Initial radius used when broadcasting pickup and delivery jobs to nearby riders.",
      }),
    }),
    apiFetch("/admin/config/system/BROADCAST_MAX_RADIUS_KM", {
      method: "PUT",
      body: JSON.stringify({
        value: String(settings.maxRadiusKm),
        description: "Maximum rider broadcast radius before the backend stops expanding the search.",
      }),
    }),
  ]);
}
