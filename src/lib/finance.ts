import { ApiList, apiFetch } from "./api";

export type FinanceSummary = {
  range: { from: string; to: string };
  currency: "NGN";
  unit: "KOBO";
  grossVolume: number;
  merchantServiceValue: number;
  logisticsFees: number;
  merchantCommissions: number;
  deliverySpeedFees: number;
  cancellationFees: number;
  merchantPayouts: number;
  riderPayouts: number;
  refunds: number;
  netPlatformRevenue: number;
  paidOrders: number;
  changes: {
    grossVolume: number;
    netPlatformRevenue: number;
    paidOrders: number;
  };
  pendingWithdrawals: { count: number; amount: number };
};

export type RevenuePoint = {
  date: string;
  grossVolume: number;
  merchantPayouts: number;
  riderPayouts: number;
  refunds: number;
  netPlatformRevenue: number;
};

export type Reconciliation = {
  generatedAt: string;
  walletLiabilities: { users: number; merchants: number; riders: number };
  reservedWithdrawals: { count: number; amount: number };
  anomalies: { negativeWallets: number; staleWithdrawals: number };
};

export type Withdrawal = {
  id: string;
  amount: number;
  currency: string;
  status: "PENDING_OTP" | "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REJECTED";
  reference?: string | null;
  transferRef?: string | null;
  failureReason?: string | null;
  reviewReason?: string | null;
  createdAt: string;
  updatedAt: string;
  bankAccount: {
    bankName: string;
    accountName: string;
    accountNumber: string;
  };
  merchant?: {
    id: string;
    businessName: string;
    walletBalance: number;
    account: { email?: string | null; phone?: string | null };
  } | null;
  rider?: {
    id: string;
    firstName: string;
    lastName: string;
    walletBalance: number;
    account: { email?: string | null; phone?: string | null };
  } | null;
};

type Range = { from?: string; to?: string };

export function fetchFinanceSummary(range: Range) {
  return apiFetch<FinanceSummary>("/admin/finance/summary", { query: range });
}

export function fetchRevenueSeries(range: Range) {
  return apiFetch<RevenuePoint[]>("/admin/finance/revenue-series", { query: range });
}

export function fetchReconciliation() {
  return apiFetch<Reconciliation>("/admin/finance/reconciliation");
}

export function fetchWithdrawals(params: Range & {
  page: number;
  limit: number;
  status?: string;
  owner?: string;
}) {
  return apiFetch<ApiList<Withdrawal>>("/admin/finance/withdrawals", { query: params });
}

export function approveWithdrawal(id: string) {
  return apiFetch(`/admin/withdrawals/${id}/approve`, { method: "PATCH" });
}

export function rejectWithdrawal(id: string, reason: string) {
  return apiFetch(`/admin/withdrawals/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export function finalizeWithdrawal(id: string, otp: string) {
  return apiFetch(`/admin/withdrawals/${id}/finalize-transfer`, {
    method: "POST",
    body: JSON.stringify({ otp }),
  });
}
