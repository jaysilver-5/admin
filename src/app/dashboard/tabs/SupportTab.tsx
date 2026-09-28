"use client";

import * as React from "react";
import {
  ArrowLeft,
  Bike,
  Check,
  ChevronDown,
  Inbox,
  LoaderCircle,
  RefreshCw,
  Search,
  Send,
  Store,
  UserRound,
} from "lucide-react";
import { apiFetch, formatDate, formatTime } from "@/lib/api";

type Audience = "users" | "merchants" | "riders";
type TicketStatus = "OPEN" | "IN_REVIEW" | "RESOLVED" | "CLOSED";

type Conversation = {
  id: string;
  audience: Audience;
  name: string;
  preview: string;
  time: string;
  unread?: number;
};

type Message = {
  id: string;
  from: "customer" | "admin";
  at: string;
  text: string;
};

const audienceOptions: Array<{
  id: Audience;
  label: string;
  singular: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "users", label: "Customers", singular: "customer", icon: UserRound },
  { id: "merchants", label: "Merchants", singular: "merchant", icon: Store },
  { id: "riders", label: "Riders", singular: "rider", icon: Bike },
];

const statusLabels: Record<TicketStatus, string> = {
  OPEN: "Open",
  IN_REVIEW: "In review",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

function ticketToConversation(ticket: any): Conversation {
  const account = ticket.user || ticket.order?.user;
  const name =
    account?.userProfile?.fullName ||
    account?.merchantProfile?.businessName ||
    [account?.riderProfile?.firstName, account?.riderProfile?.lastName]
      .filter(Boolean)
      .join(" ") ||
    account?.email ||
    account?.phone ||
    "Support user";
  const audience: Audience =
    ticket.participantRole === "MERCHANT"
      ? "merchants"
      : ticket.participantRole === "RIDER"
        ? "riders"
        : "users";
  const latest = ticket.messages?.[ticket.messages.length - 1];

  return {
    id: ticket.id,
    audience,
    name,
    preview:
      latest?.body || ticket.description || ticket.reason || "Support ticket",
    time: `${formatDate(ticket.updatedAt || ticket.createdAt)}, ${formatTime(
      ticket.updatedAt || ticket.createdAt,
    )}`,
    unread: ticket.status === "OPEN" ? 1 : undefined,
  };
}

function ticketToMessages(ticket: any): Message[] {
  if (!ticket) return [];
  const persisted = (ticket.messages || []).map((message: any) => ({
    id: message.id,
    from: message.authorRole === "ADMIN" ? "admin" : "customer",
    at: formatTime(message.createdAt),
    text: message.body || message.message || "",
  }));
  if (persisted.length) return persisted;

  return [
    {
      id: `${ticket.id}-initial`,
      from: "customer",
      at: formatTime(ticket.createdAt),
      text: `${ticket.reason || "Support ticket"}${
        ticket.description ? `\n\n${ticket.description}` : ""
      }`,
    },
  ];
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-full bg-[#E9ECF5] font-bold text-[#0B1E5B] ${
        size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm"
      }`}
      aria-hidden="true"
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function AudienceSwitcher({
  active,
  counts,
  onChange,
}: {
  active: Audience;
  counts: Record<Audience, number>;
  onChange: (audience: Audience) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1" aria-label="Support inbox">
      {audienceOptions.map((option) => {
        const Icon = option.icon;
        const selected = active === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={selected}
            className={`flex min-w-0 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              selected
                ? "bg-white text-[#0B1E5B] shadow-sm ring-1 ring-black/5"
                : "text-slate-500 hover:bg-white/60 hover:text-slate-800"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{option.label}</span>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[11px] ${
                selected ? "bg-[#E9ECF5] text-[#0B1E5B]" : "bg-white/70 text-slate-500"
              }`}
            >
              {counts[option.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ConversationRow({
  conversation,
  active,
  onClick,
}: {
  conversation: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full border-b border-slate-100 px-4 py-3.5 text-left transition ${
        active ? "bg-[#F0F3FB]" : "bg-white hover:bg-slate-50"
      }`}
    >
      {active ? <span className="absolute inset-y-0 left-0 w-1 bg-[#0B1E5B]" /> : null}
      <div className="flex items-start gap-3">
        <Avatar name={conversation.name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-sm font-semibold text-slate-900">
              {conversation.name}
            </span>
            <span className="shrink-0 text-[11px] text-slate-400">
              {conversation.time}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-sm text-slate-500">
              {conversation.preview}
            </p>
            {conversation.unread ? (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#0B1E5B] px-1 text-[10px] font-bold text-white">
                {conversation.unread}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
}

function MessageBubble({ message, name }: { message: Message; name: string }) {
  const isAdmin = message.from === "admin";
  return (
    <div className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[min(78%,44rem)] ${isAdmin ? "text-right" : "text-left"}`}>
        <div className={`mb-1.5 flex items-center gap-2 ${isAdmin ? "justify-end" : ""}`}>
          {!isAdmin ? <Avatar name={name} size="sm" /> : null}
          {!isAdmin ? <span className="text-xs font-semibold text-slate-700">{name}</span> : null}
          <span className="text-[11px] text-slate-400">{message.at}</span>
          {isAdmin ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
              You <Check className="h-3.5 w-3.5" />
            </span>
          ) : null}
        </div>
        <div
          className={`whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
            isAdmin
              ? "rounded-br-sm bg-[#0B1E5B] text-white"
              : "rounded-bl-sm border border-slate-200 bg-white text-slate-700"
          }`}
        >
          {message.text}
        </div>
      </div>
    </div>
  );
}

function Composer({
  disabled,
  onSend,
}: {
  disabled?: boolean;
  onSend: (message: string) => Promise<void> | void;
}) {
  const [value, setValue] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const send = async () => {
    const message = value.trim();
    if (!message || disabled || sending) return;
    setSending(true);
    try {
      await onSend(message);
      setValue("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="shrink-0 border-t border-slate-200 bg-white p-3 sm:p-4">
      <div className="flex items-end gap-2 rounded-2xl border border-slate-300 bg-white p-2 shadow-sm focus-within:border-[#0B1E5B] focus-within:ring-4 focus-within:ring-[#0B1E5B]/10">
        <textarea
          rows={1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send();
            }
          }}
          disabled={disabled || sending}
          placeholder={disabled ? "Reopen this conversation to reply" : "Write a message…"}
          className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={disabled || sending || !value.trim()}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0B1E5B] text-white transition hover:bg-[#102B78] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Send reply"
        >
          {sending ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
      <p className="mt-1.5 hidden text-right text-[11px] text-slate-400 sm:block">
        Enter to send · Shift + Enter for a new line
      </p>
    </div>
  );
}

export default function SupportTab() {
  const [audience, setAudience] = React.useState<Audience>("users");
  const [query, setQuery] = React.useState("");
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [detail, setDetail] = React.useState<any>(null);
  const [updatingStatus, setUpdatingStatus] = React.useState(false);
  const [mobileChatOpen, setMobileChatOpen] = React.useState(false);
  const messageViewportRef = React.useRef<HTMLDivElement>(null);

  const loadTickets = React.useCallback(() => {
    return apiFetch<any[]>("/admin/support/tickets")
      .then((rows) => {
        const next = rows.map(ticketToConversation);
        setConversations(next);
        setActiveId((current) =>
          current && next.some((conversation) => conversation.id === current)
            ? current
            : next[0]?.id ?? null,
        );
        setError(null);
      })
      .catch((reason) => setError(reason?.message || "Unable to load support tickets"))
      .finally(() => setLoading(false));
  }, []);

  const loadDetail = React.useCallback((id: string) => {
    return apiFetch<any>(`/admin/support/tickets/${id}`)
      .then((ticket) => {
        setDetail(ticket);
        setMessages(ticketToMessages(ticket));
        setError(null);
      })
      .catch((reason) => setError(reason?.message || "Unable to load ticket details"));
  }, []);

  React.useEffect(() => {
    void loadTickets();
    const timer = window.setInterval(() => void loadTickets(), 10_000);
    return () => window.clearInterval(timer);
  }, [loadTickets]);

  React.useEffect(() => {
    if (!activeId) {
      setMessages([]);
      setDetail(null);
      return;
    }
    void loadDetail(activeId);
    const timer = window.setInterval(() => void loadDetail(activeId), 8_000);
    return () => window.clearInterval(timer);
  }, [activeId, loadDetail]);

  React.useEffect(() => {
    const viewport = messageViewportRef.current;
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [activeId, messages.length]);

  const filtered = React.useMemo(() => {
    const inAudience = conversations.filter((item) => item.audience === audience);
    const normalized = query.trim().toLowerCase();
    if (!normalized) return inAudience;
    return inAudience.filter(
      (item) =>
        item.name.toLowerCase().includes(normalized) ||
        item.preview.toLowerCase().includes(normalized) ||
        item.time.toLowerCase().includes(normalized),
    );
  }, [audience, conversations, query]);

  const counts = React.useMemo<Record<Audience, number>>(
    () => ({
      users: conversations.filter((item) => item.audience === "users").length,
      merchants: conversations.filter((item) => item.audience === "merchants").length,
      riders: conversations.filter((item) => item.audience === "riders").length,
    }),
    [conversations],
  );

  React.useEffect(() => {
    const first = conversations.find((item) => item.audience === audience);
    if (!conversations.some((item) => item.id === activeId && item.audience === audience)) {
      setActiveId(first?.id ?? null);
    }
  }, [activeId, audience, conversations]);

  const active =
    conversations.find(
      (item) => item.id === activeId && item.audience === audience,
    ) ?? null;
  const selectedAudience = audienceOptions.find((item) => item.id === audience)!;

  const changeAudience = (next: Audience) => {
    setAudience(next);
    setQuery("");
    setDetail(null);
    setMessages([]);
    setMobileChatOpen(false);
  };

  const selectConversation = (id: string) => {
    setActiveId(id);
    setMobileChatOpen(true);
  };

  const sendReply = async (message: string) => {
    if (!activeId) return;
    await apiFetch(`/admin/support/tickets/${activeId}/reply`, {
      method: "POST",
      headers: {
        "Idempotency-Key": `admin-support-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
      body: JSON.stringify({ message }),
    });
    await Promise.all([loadDetail(activeId), loadTickets()]);
  };

  const updateStatus = async (status: TicketStatus) => {
    if (!activeId) return;
    setUpdatingStatus(true);
    try {
      await apiFetch(`/admin/support/tickets/${activeId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await Promise.all([loadDetail(activeId), loadTickets()]);
    } catch (reason: any) {
      setError(reason?.message || "Unable to update ticket status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <section className="flex h-[calc(100dvh-8rem)] min-h-[560px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0B1E5B] text-white">
              <Inbox className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-950">Support inbox</h1>
              <p className="text-xs text-slate-500">Manage every Clothify conversation in one place</p>
            </div>
          </div>
          <div className="w-full xl:w-[32rem]">
            <AudienceSwitcher active={audience} counts={counts} onChange={changeAudience} />
          </div>
        </div>
      </div>

      {error ? (
        <div className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid min-h-0 flex-1 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className={`min-h-0 flex-col border-r border-slate-200 bg-white ${mobileChatOpen ? "hidden lg:flex" : "flex"}`}>
          <div className="shrink-0 border-b border-slate-200 p-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <div>
                <p className="text-sm font-semibold text-slate-900">{selectedAudience.label}</p>
                <p className="text-xs text-slate-500">
                  {counts[audience]} conversation{counts[audience] === 1 ? "" : "s"}
                </p>
              </div>
              <button type="button" onClick={() => void loadTickets()} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800" aria-label="Refresh conversations">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search support conversations" placeholder={`Search ${selectedAudience.label.toLowerCase()}…`} className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-[#0B1E5B] focus:bg-white focus:ring-4 focus:ring-[#0B1E5B]/10" />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="grid h-40 place-items-center text-[#0B1E5B]"><LoaderCircle className="h-6 w-6 animate-spin" /></div>
            ) : filtered.length ? (
              filtered.map((conversation) => (
                <ConversationRow key={conversation.id} conversation={conversation} active={conversation.id === activeId} onClick={() => selectConversation(conversation.id)} />
              ))
            ) : (
              <div className="px-8 py-16 text-center">
                <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-400"><Inbox className="h-5 w-5" /></div>
                <p className="mt-3 text-sm font-medium text-slate-700">No conversations found</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {query ? "Try a different search." : `New ${selectedAudience.singular} messages will appear here.`}
                </p>
              </div>
            )}
          </div>
        </aside>

        <div className={`min-h-0 flex-col bg-[#F8FAFC] ${mobileChatOpen ? "flex" : "hidden lg:flex"}`}>
          {active ? (
            <>
              <header className="flex min-h-[68px] shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3 sm:px-5">
                <button type="button" onClick={() => setMobileChatOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Back to conversations">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <Avatar name={active.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-950">{active.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {selectedAudience.singular} · {detail?.order?.orderNumber ? `Order ${detail.order.orderNumber}` : detail?.reason || "General support"}
                  </p>
                </div>
                <div className="relative shrink-0">
                  <select value={(detail?.status || "OPEN") as TicketStatus} onChange={(event) => void updateStatus(event.target.value as TicketStatus)} disabled={updatingStatus} aria-label="Conversation status" className="h-9 appearance-none rounded-lg border border-slate-200 bg-white py-1 pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none hover:bg-slate-50 focus:border-[#0B1E5B] disabled:opacity-60">
                    {(Object.keys(statusLabels) as TicketStatus[]).map((status) => (
                      <option key={status} value={status}>{statusLabels[status]}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </header>

              <div ref={messageViewportRef} className="min-h-0 flex-1 overflow-y-auto scroll-smooth p-4 sm:p-6">
                <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
                  {messages.length ? messages.map((message) => (
                    <MessageBubble key={message.id} message={message} name={active.name} />
                  )) : (
                    <div className="grid min-h-48 place-items-center text-sm text-slate-400">No messages in this conversation.</div>
                  )}
                </div>
              </div>

              <Composer disabled={!activeId || ["RESOLVED", "CLOSED"].includes(detail?.status)} onSend={sendReply} />
            </>
          ) : (
            <div className="grid h-full place-items-center p-8 text-center">
              <div>
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Inbox className="h-6 w-6" /></div>
                <p className="mt-4 font-semibold text-slate-800">Choose a conversation</p>
                <p className="mt-1 text-sm text-slate-500">Select a message from the inbox to view and reply.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
