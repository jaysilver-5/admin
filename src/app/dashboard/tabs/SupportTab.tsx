"use client";
import * as React from "react";
import { Paperclip, Mic, Send, Check, CircleDot, Filter } from "lucide-react";
import { apiFetch, formatDate, formatTime } from "@/lib/api";

type Audience = "users" | "merchants" | "riders";
type Conv = { id: string; audience: Audience; name: string; preview: string; time: string; unread?: number; typing?: boolean; avatarUrl?: string; raw?: any };
type Msg = { id: string; from: "agent" | "you"; at: string; text: string };

function ticketToConv(ticket: any): Conv {
  const user = ticket.order?.user;
  const name = user?.userProfile?.fullName || user?.email || user?.phone || "Customer";
  return {
    id: ticket.id,
    audience: "users",
    name,
    preview: ticket.description || ticket.reason || "Support ticket",
    time: `${formatDate(ticket.createdAt)}, ${formatTime(ticket.createdAt)}`,
    unread: ticket.status === "OPEN" ? 1 : undefined,
    raw: ticket,
  };
}

function ticketToMessages(ticket: any): Msg[] {
  const messages: Msg[] = [];
  if (ticket) {
    messages.push({
      id: `${ticket.id}-initial`,
      from: "agent",
      at: formatTime(ticket.createdAt),
      text: `${ticket.reason || "Support ticket"}${ticket.description ? `\n\n${ticket.description}` : ""}`,
    });
    if (ticket.order?.timeline?.length) {
      ticket.order.timeline.slice(-5).forEach((event: any) => messages.push({
        id: event.id || `${ticket.id}-${event.createdAt}`,
        from: "agent",
        at: formatTime(event.createdAt),
        text: `${String(event.type || "Order update").replace(/_/g, " ")}${event.data?.note ? ` — ${event.data.note}` : ""}`,
      }));
    }
  }
  return messages;
}

function GradientAvatar({ name }: { name: string }) {
  return <div className="h-10 w-10 rounded-full bg-gradient-to-b from-[#C9E27E] to-[#C66B09] grid place-items-center shadow-[inset_0_1px_3px_rgba(255,255,255,.5)]"><span className="text-white/95 font-semibold">{name.charAt(0).toUpperCase()}</span></div>;
}

const DemoAvatar = ({ src }: { src?: string }) => <div className="h-8 w-8 rounded-full overflow-hidden"><img src={src ?? "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=64&q=60"} className="h-full w-full object-cover" alt="" /></div>;

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

function ChatHeader({ title }: { title: string }) {
  return <div className="h-14 sm:h-[60px] sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-200 rounded-t-xl flex items-center gap-3 px-4"><div className="flex items-center gap-2"><DemoAvatar /><span className="font-medium text-gray-900">{title}</span><CircleDot className="h-3 w-3 text-emerald-500" /></div></div>;
}

function MessageBubble({ m }: { m: Msg }) {
  const isYou = m.from === "you";
  return <div className={`flex ${isYou ? "justify-end" : "justify-start"} my-3`}><div className={`max-w-[720px] w-fit ${isYou ? "text-right" : "text-left"}`}><div className="mb-2 flex items-center gap-2">{!isYou && <><DemoAvatar /><span className="text-[13px] font-medium text-gray-900">User</span></>}<span className="text-[12px] text-gray-400">{m.at}</span>{isYou && <span className="inline-flex items-center gap-1 text-[12px] text-gray-400"><span>You</span><Check className="h-4 w-4" /></span>}</div><div className={`rounded-xl border p-4 leading-[1.55] text-[15px] text-gray-800 whitespace-pre-line ${isYou ? "bg-white border-gray-200" : "bg-[#F6E9D0] border-[#F3DEC0]"}`}>{m.text}</div></div></div>;
}

function ChatInput({ disabled, onSend }: { disabled?: boolean; onSend: (message: string) => Promise<void> | void }) {
  const [v, setV] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const send = async () => {
    if (!v.trim() || disabled) return;
    setSending(true);
    try { await onSend(v.trim()); setV(""); } finally { setSending(false); }
  };
  return <div className="sticky bottom-0 bg-white border-t border-gray-200 px-3 sm:px-4 py-3 rounded-b-xl"><div className="flex items-end gap-2"><input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void send(); }} placeholder="Type a message…" className="flex-1 h-[44px] rounded-xl border border-gray-300 bg-white px-3 text-[14px] placeholder:text-gray-400 focus:ring-1 focus:ring-blue-500" /><button className="h-10 w-10 grid place-items-center rounded-full border border-gray-200 hover:bg-gray-50" aria-label="Attach"><Paperclip className="h-5 w-5 text-gray-600" /></button><button className="h-10 w-10 grid place-items-center rounded-full border border-gray-200 hover:bg-gray-50" aria-label="Voice"><Mic className="h-5 w-5 text-gray-600" /></button><button onClick={() => void send()} disabled={sending || disabled} className="h-10 w-10 grid place-items-center rounded-full bg-[#0B1E5B] hover:opacity-90 disabled:opacity-60" aria-label="Send"><Send className="h-5 w-5 text-white" /></button></div></div>;
}

export default function SupportTab() {
  const [aud, setAud] = React.useState<Audience>("users");
  const [query, setQuery] = React.useState("");
  const [conversations, setConversations] = React.useState<Conv[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const loadTickets = React.useCallback(() => {
    apiFetch<any[]>("/admin/support/tickets")
      .then((rows) => {
        const next = rows.map(ticketToConv);
        setConversations(next);
        setActiveId((current) => current && next.some((c) => c.id === current) ? current : next[0]?.id ?? null);
      })
      .catch((err) => setError(err?.message || "Unable to load support tickets"));
  }, []);

  React.useEffect(loadTickets, [loadTickets]);

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
    if (!activeId) { setMessages([]); return; }
    let alive = true;
    apiFetch<any>(`/admin/support/tickets/${activeId}`)
      .then((ticket) => { if (alive) setMessages(ticketToMessages(ticket)); })
      .catch((err) => { if (alive) setError(err?.message || "Unable to load ticket details"); });
    return () => { alive = false; };
  }, [activeId]);

  const active = filtered.find((c) => c.id === activeId) ?? filtered[0];

  const sendReply = async (message: string) => {
    if (!activeId) return;
    await apiFetch(`/admin/support/tickets/${activeId}/reply`, { method: "POST", body: JSON.stringify({ message }) });
    setMessages((prev) => [...prev, { id: `local-${Date.now()}`, from: "you", at: formatTime(new Date()), text: message }]);
  };

  return <div className="space-y-4 bg-white p-4">
    <TopTabs active={aud} counts={counts} onChange={setAud} />
    {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
    <div className="flex items-center gap-3"><div className="relative w-[360px] sm:w-[420px]"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, time" className="w-full h-[42px] rounded-md border border-gray-200 bg-white pl-3 pr-10 text-sm placeholder:text-gray-400 focus:ring-1 focus:ring-blue-500" /><button className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 grid place-items-center rounded-md hover:bg-gray-50" aria-label="Filter"><Filter className="h-4 w-4 text-gray-500" /></button></div></div>
    <div className="grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-6">
      <div className="rounded-xl shadow-2xl bg-white p-2 sm:p-3 space-y-2">{filtered.map((c) => <ConversationRow key={c.id} conv={c} active={c.id === active?.id} onClick={() => setActiveId(c.id)} />)}{filtered.length === 0 && <div className="text-sm text-gray-500 px-3 py-8 text-center">No conversations yet.</div>}</div>
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden"><ChatHeader title={`${active ? active.name : "Support"} Support`} /><div className="p-4 sm:p-6">{messages.map((m) => <MessageBubble key={m.id} m={m} />)}</div><ChatInput disabled={!activeId} onSend={sendReply} /></div>
    </div>
  </div>;
}
