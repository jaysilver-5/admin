export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

export type ApiList<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type AuthUser = {
  id: string;
  email?: string | null;
  phone?: string | null;
  role: "USER" | "MERCHANT" | "RIDER" | "ADMIN" | string;
  [key: string]: unknown;
};

export type AuthSession = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: string;
  sessionId?: string;
  user: AuthUser;
};

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

const ACCESS_TOKEN_KEY = "clothify_admin_access_token";
const REFRESH_TOKEN_KEY = "clothify_admin_refresh_token";
const SESSION_ID_KEY = "clothify_admin_session_id";
const USER_KEY = "clothify_admin_user";

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  if (session.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  if (session.sessionId) localStorage.setItem(SESSION_ID_KEY, session.sessionId);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(SESSION_ID_KEY);
  localStorage.removeItem(USER_KEY);
}

export function requireAdminSession() {
  const token = getAccessToken();
  const user = getAuthUser();
  return Boolean(token && user?.role === "ADMIN");
}

function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function getSessionId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_ID_KEY);
}

async function refreshSession() {
  const refreshToken = getRefreshToken();
  const sessionId = getSessionId();
  const user = getAuthUser();
  if (!refreshToken || !sessionId || !user) return null;

  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken, sessionId }),
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload?.accessToken) return null;

  const nextSession: AuthSession = { ...payload, user };
  saveSession(nextSession);
  return nextSession.accessToken;
}

function toQuery(params?: Record<string, string | number | boolean | null | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function requestOnce<T>(
  path: string,
  options: RequestInit & { query?: Record<string, string | number | boolean | null | undefined> } = {},
  tokenOverride?: string | null,
): Promise<{ res: Response; payload: T | unknown; tokenUsed: string | null }> {
  const token = tokenOverride ?? getAccessToken();
  const query = toQuery(options.query);
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}${query}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(url, { ...options, headers });
  const contentType = res.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await res.json().catch(() => null) : await res.text();
  return { res, payload, tokenUsed: token };
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { query?: Record<string, string | number | boolean | null | undefined> } = {},
): Promise<T> {
  let { res, payload, tokenUsed } = await requestOnce<T>(path, options);

  if (res.status === 401 && tokenUsed && !path.startsWith("/auth/")) {
    const refreshed = await refreshSession().catch(() => null);
    if (refreshed) {
      ({ res, payload, tokenUsed } = await requestOnce<T>(path, options, refreshed));
    }
  }

  if (!res.ok) {
    const message =
      (payload && typeof payload === "object" && "message" in payload
        ? Array.isArray((payload as any).message)
          ? (payload as any).message.join(", ")
          : String((payload as any).message)
        : null) || `Request failed with status ${res.status}`;

    if ((res.status === 401 || res.status === 403) && tokenUsed && !path.startsWith("/auth/login")) {
      clearSession();
    }

    throw new ApiError(message, res.status, payload);
  }

  return payload as T;
}

export async function adminLogin(identifier: string, password: string) {
  const trimmed = identifier.trim();
  const body = trimmed.includes("@")
    ? { email: trimmed.toLowerCase(), password }
    : { phone: trimmed, password };

  const session = await apiFetch<AuthSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (session.user?.role !== "ADMIN") {
    throw new ApiError("This account is not an admin account.", 403, session.user);
  }

  saveSession(session);
  return session;
}

export function formatNaira(value: number | string | null | undefined) {
  const num = Number(value || 0);
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(num) ? num : 0);
}

export function formatDate(value?: string | Date | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB");
}

export function formatTime(value?: string | Date | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function totalPages(total: number, limit: number) {
  return Math.max(1, Math.ceil((Number(total) || 0) / Math.max(1, Number(limit) || 1)));
}
