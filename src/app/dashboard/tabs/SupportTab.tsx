"use client";
import * as React from "react";
import { Send, Check, CircleDot, Search, RefreshCw, LoaderCircle } from "lucide-react";
import { apiFetch, formatDate, formatTime } from "@/lib/api";

type Audience = "users" | "merchants" | "riders";
type Conv = { id: string; audience: Audience; name: string; preview: string; time: string; unread?: number; typing?: boolean; avatarUrl?: string; raw?: any };
type Msg = { id: string; from: "agent" | "you"; at: string; text: string };

function ticketToConv(ticket: any): Conv {
  const user = ticket.user || ticket.order?.user;
  const name = user?.userProfile?.fullName || user?.merchantProfile?.businessName || [user?.riderProfile?.firstName, user?.riderProfile?.lastName].filter(Boolean).join(" ") || user?.email || user?.phone || "Support user";
  const audience: Audience = ticket.participantRole === "MERCHANT" ? "merchants" : ticket.participantRole === "RIDER" ? "riders" : "users";
  const latest = ticket.messages?.[ticket.messages.length - 1];
  return {
    id: ticket.id,
    audience,
    name,
    preview: latest?.body || ticket.description || ticket.reason || "Support ticket",
    time: `${formatDate(ticket.updatedAt || ticket.createdAt)}, ${formatTime(ticket.updatedAt || ticket.createdAt)}`,
    unread: ticket.status === "OPEN" ? 1 : undefined,
    raw: ticket,
  };
}

function ticketToMessages(ticket: any): Msg[] {
  if (!ticket) return [];
  const persisted = (ticket.messages || []).map((message: any) => ({
    id: message.id,
    from: message.authorRole === "ADMIN" ? "you" : "agent",
    at: formatTime(message.createdAt),
    text: message.body || message.message || "",
  }));
  if (persisted.length) return persisted;
  return [{ id: `${ticket.id}-initial`, from: "agent", at: formatTime(ticket.createdAt), text: `${ticket.reason || "Support ticket"}${ticket.description ? `\n\n${ticket.description}` : ""}` }];
}

function GradientAvatar({ name }: { name: string }) {
  return <div className="h-10 w-10 rounded-full bg-gradient-to-b from-[#C9E27E] to-[#C66B09] grid place-items-center shadow-[inset_0_1px_3px_rgba(255,255,255,.5)]"><span className="text-white/95 font-semibold">{name.charAt(0).toUpperCase()}</span></div>;
}

const SmallAvatar = ({ name }: { name: string }) => <div className="grid h-8 w-8 place-items-center rounded-full bg-[#E9ECF5] text-xs font-bold text-[#0B1E5B]">{name.charAt(0).toUpperCase()}</div>;

function TopTabs({ active, counts, onChange }: { active: Audience; counts: Record<Audience, number>; onChange: (a: Audience) => void }) {
  const Tab = ({ id, label }: { id: Audience; label: string }) => {
    const isActive = active === id;
    return <button onClick={() => onChange(id)} className={`relative px-1.5 pb-2 text-[15px] font-medium transition ${isActive ? "text-[#0B1E5B]" : "text-gray-500 hover:text-gray-700"}`}>{label} ({counts[id]})<span className={`absolute left-0 right-0 -bottom-[1px] h-[3px] rounded-full bg-[#0B1E5B] transition ${isActive ? "opacity-100" : "opacity-0"}`} /></button>;
  };
  return <div className="mb-4 border-b border-gray-100"><div className="flex items-center gap-8"><Tab id="users" label="Users" /><Tab id="merchants" label="Merchants" /><Tab id="riders" label="Rider" /></div></div>;
}

function ConversationRow({ conv, active, onClick }: { conv: Conv; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`group relative w-full text-left transition p-3 sm:p-4 border-y ${active ? "bg-white border-transparent shadow-[0_1px_0_#EFF1F5]" : "bg-white/90 border-gray-100 hover:bg-white"}`}>{active && <span className="absolute right-0 top-0 h-full w-[3px] rounded-r-xl bg-[#0B1E5B]" />}{!!conv.unread && conv.unread > 0 && <span className="absolute right-3 top-1/2 -translate-y-1/2 h-7 min-w-7 px-2 rounded-md bg-[#0B1E5B] text-white text-[13px] font-semibold grid place-items-center">{conv.unread}</span>}<div className="flex items-start gap-3 pr-12"><GradientAvatar name={conv.name} /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><span className="truncate font-semibold text-[16px] text-gray-900">{conv.name}</span><span className="text-[12px] text-gray-400 whitespace-nowrap">{conv.time}</span></div><p className={`mt-1 truncate text-[14px] ${conv.typing ? "text-[#9C3A00]" : "text-gray-500"}`} title={conv.preview}>{conv.preview}</p></div></div></button>;
}

function ChatHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="sticky top-0 z-10 flex min-h-[68px] items-center gap-3 border-b border-gray-200 bg-white/95 px-5 backdrop-blur"><SmallAvatar name={title} /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="truncate font-semibold text-gray-900">{title}</span><CircleDot className="h-3 w-3 text-emerald-500" /></div><p className="truncate text-xs text-gray-500">{subtitle}</p></div></div>;
}

function MessageBubble({ m, name }: { m: Msg; name: string }) {
  const isYou = m.from === "you";
  return <div className={`flex ${isYou ? "justify-end" : "justify-start"} my-4`}><div className={`max-w-[720px] w-fit ${isYou ? "text-right" : "text-left"}`}><div className={`mb-1.5 flex items-center gap-2 ${isYou ? "justify-end" : ""}`}>{!isYou && <><SmallAvatar name={name} /><span className="text-[13px] font-medium text-gray-900">{name}</span></>}<span className="text-[12px] text-gray-400">{m.at}</span>{isYou && <span className="inline-flex items-center gap-1 text-[12px] text-gray-400"><span>You</span><Check className="h-4 w-4" /></span>}</div><div className={`rounded-2xl px-4 py-3 leading-[1.55] text-[15px] whitespace-pre-line shadow-sm ${isYou ? "rounded-br-sm bg-[#0B1E5B] text-white" : "rounded-bl-sm border border-[#F0E1C9] bg-[#FBF3E5] text-gray-800"}`}>{m.text}</div></div></div>;
}

function ChatInput({ disabled, onSend }: { disabled?: boolean; onSend: (message: string) => Promise<void> | void }) {
  const [v, setV] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const send = async () => {
    if (!v.trim() || disabled) return;
    setSending(true);
    try { await onSend(v.trim()); setV(""); } finally { setSending(false); }
  };
  return <div className="sticky bottom-0 rounded-b-xl border-t border-gray-200 bg-white px-4 py-4"><div className="flex items-end gap-2"><textarea rows={1} value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }} placeholder="Write a reply…" className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-[14px] placeholder:text-gray-400 focus:ring-2 focus:ring-[#0B1E5B]/20" /><button onClick={() => void send()} disabled={sending || disabled || !v.trim()} className="grid h-11 w-11 place-items-center rounded-xl bg-[#0B1E5B] hover:opacity-90 disabled:opacity-40" aria-label="Send reply">{sending ? <LoaderCircle className="h-5 w-5 animate-spin text-white" /> : <Send className="h-5 w-5 text-white" />}</button></div></div>;
}

export default function SupportTab() {
  const [aud, setAud] = React.useState<Audience>("users");
  const [query, setQuery] = React.useState("");
  const [conversations, setConversations] = React.useState<Conv[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [detail, setDetail] = React.useState<any>(null);
  const [updatingStatus, setUpdatingStatus] = React.useState(false);

  const loadTickets = React.useCallback(() => {
    return apiFetch<any[]>("/admin/support/tickets")
      .then((rows) => {
        const next = rows.map(ticketToConv);
        setConversations(next);
        setActiveId((current) => current && next.some((c) => c.id === current) ? current : next[0]?.id ?? null);
        setError(null);
      })
      .catch((err) => setError(err?.message || "Unable to load support tickets"))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    void loadTickets();
    const timer = window.setInterval(() => void loadTickets(), 10000);
    return () => window.clearInterval(timer);
  }, [loadTickets]);

  const filtered = React.useMemo(() => {
    const list = conversations.filter((c) => c.audience === aud);
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((c) => c.name.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q) || c.time.toLowerCase().includes(q));
  }, [aud, query, conversations]);

  const counts: Record<Audience, number> = {
    users: conversations.filter((c) => c.audience === "users").length,
    merchants: conversations.filter((c) => c.audience === "merchants").length,
    riders: conversations.filter((c) => c.audience === "riders").length,
  };

  React.useEffect(() => {
    const firstForAudience = conversations.find((c) => c.audience === aud);
    if (!conversations.some((c) => c.id === activeId && c.audience === aud)) setActiveId(firstForAudience?.id ?? null);
  }, [aud, activeId, conversations]);

  const loadDetail = React.useCallback((id: string) => {
    return apiFetch<any>(`/admin/support/tickets/${id}`)
      .then((ticket) => { setDetail(ticket); setMessages(ticketToMessages(ticket)); setError(null); })
      .catch((err) => setError(err?.message || "Unable to load ticket details"));
  }, []);

  React.useEffect(() => {
    if (!activeId) return;
    const timer = window.setInterval(() => void loadDetail(activeId), 8000);
    return () => window.clearInterval(timer);
  }, [activeId, loadDetail]);

  React.useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    let alive = true;
    apiFetch<any>(`/admin/support/tickets/${activeId}`)
      .then((ticket) => { if (alive) { setDetail(ticket); setMessages(ticketToMessages(ticket)); } })
      .catch((err) => { if (alive) setError(err?.message || "Unable to load ticket details"); });
    return () => { alive = false; };
  }, [activeId]);

  const active = filtered.find((c) => c.id === activeId) ?? filtered[0];

  const sendReply = async (message: string) => {
    if (!activeId) return;
    await apiFetch(`/admin/support/tickets/${activeId}/reply`, { method: "POST", headers: { "Idempotency-Key": `admin-support-${Date.now()}-${Math.random().toString(36).slice(2)}` }, body: JSON.stringify({ message }) });
    await Promise.all([loadDetail(activeId), loadTickets()]);
  };

  const updateStatus = async (status: string) => {
    if (!activeId) return;
    setUpdatingStatus(true);
    try {
      await apiFetch(`/admin/support/tickets/${activeId}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      await Promise.all([loadDetail(activeId), loadTickets()]);
    } catch (err: any) { setError(err?.message || "Unable to update ticket status"); }
    finally { setUpdatingStatus(false); }
  };

  return <div className="space-y-4 rounded-2xl bg-[#F7F8FA] p-4 sm:p-6">
    <TopTabs active={aud} counts={counts} onChange={setAud} />
    {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
    <div className="flex items-center gap-3"><div className="relative w-full max-w-[420px]"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search support conversations" placeholder="Search conversations" className="h-[42px] w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm placeholder:text-gray-400 focus:ring-1 focus:ring-blue-500" /></div><button type="button" onClick={() => void loadTickets()} className="grid h-10 w-10 place-items-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50" aria-label="Refresh conversations"><RefreshCw className="h-4 w-4 text-gray-600" /></button></div>
    <div className="grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-6">
      <div className="min-h-[620px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">{loading ? <div className="grid h-48 place-items-center"><LoaderCircle className="h-6 w-6 animate-spin text-[#0B1E5B]" /></div> : filtered.map((c) => <ConversationRow key={c.id} conv={c} active={c.id === active?.id} onClick={() => setActiveId(c.id)} />)}{!loading && filtered.length === 0 && <div className="px-3 py-16 text-center text-sm text-gray-500">No {aud} conversations yet.</div>}</div>
      <div className="flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"><ChatHeader title={active?.name || "Select a conversation"} subtitle={active ? `${String(detail?.participantRole || aud.slice(0, -1)).toLowerCase()} · ${detail?.order?.orderNumber ? `Order ${detail.order.orderNumber}` : detail?.reason || "General support"}` : "Choose a conversation from the list"} />{active && <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-5 py-3"><span className="mr-1 text-xs font-medium uppercase tracking-wide text-gray-400">Status</span>{["OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"].map((status) => <button key={status} onClick={() => void updateStatus(status)} disabled={updatingStatus || detail?.status === status} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${detail?.status === status ? "bg-[#0B1E5B] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{status.replace("_", " ")}</button>)}</div>}<div className="flex-1 overflow-y-auto p-4 sm:p-6">{messages.map((m) => <MessageBubble key={m.id} m={m} name={active?.name || "User"} />)}{active && messages.length === 0 && <div className="grid h-full place-items-center text-sm text-gray-400">No messages in this conversation.</div>}</div><ChatInput disabled={!activeId || ["RESOLVED", "CLOSED"].includes(detail?.status)} onSend={sendReply} /></div>
    </div>
  </div>;
}
