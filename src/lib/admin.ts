import { ApiList, apiFetch } from "./api";

export type AdminRole = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  permissions: { permission: { key: string; name: string } }[];
  _count: { assignments: number };
};

export type AdminTeamMember = {
  id: string;
  displayName?: string | null;
  isActive: boolean;
  account: {
    id: string;
    email?: string | null;
    phone?: string | null;
    isActive: boolean;
    lastLoginAt?: string | null;
    createdAt: string;
  };
  roles: { role: AdminRole }[];
};

export type AuditLog = {
  id: string;
  actorId?: string | null;
  action: string;
  permission?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: string;
};

export const fetchAdminRoles = () => apiFetch<AdminRole[]>("/admin/roles");
export const fetchAdminTeam = () => apiFetch<AdminTeamMember[]>("/admin/team");
export const updateAdminRoles = (id: string, roleKeys: string[]) => apiFetch(`/admin/team/${id}/roles`, { method: "PATCH", body: JSON.stringify({ roleKeys }) });
export const updateAdminStatus = (id: string, isActive: boolean, reason?: string) => apiFetch(`/admin/team/${id}/status`, { method: "PATCH", body: JSON.stringify({ isActive, reason }) });
export const fetchAuditLogs = (page: number, search?: string) => apiFetch<ApiList<AuditLog>>("/admin/audit-logs", { query: { page, limit: 25, search } });
