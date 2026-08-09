"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Clock, Mail, Search, Send, Smartphone, X } from "lucide-react";
import { apiFetch, formatDate, formatTime } from "@/lib/api";

type Role = "USER" | "MERCHANT" | "RIDER";
type Channel = "IN_APP" | "PUSH" | "EMAIL";
type AudienceMode = "ALL" | "ROLES" | "SELECTED";

type Recipient = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: Role;
};

type Campaign = {
  id: string;
  title: string;
  body: string;
  type: string;
  category: string;
  channels: Channel[];
  audience: {
    allRoles?: boolean;
    roles?: Role[];
    recipientIds?: string[];
  };
  status: "DRAFT" | "SCHEDULED" | "PROCESSING" | "COMPLETED" | "CANCELLED" | "FAILED";
  scheduledAt?: string | null;
  createdAt: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
};

const roleOptions: { value: Role; label: string }[] = [
  { value: "USER", label: "Customers" },
  { value: "MERCHANT", label: "Merchants" },
  { value: "RIDER", label: "Riders" },
];

const channelOptions: { value: Channel; label: string; icon: React.ReactNode }[] = [
  { value: "IN_APP", label: "In-app inbox", icon: <Smartphone size={17} /> },
  { value: "PUSH", label: "Push notification", icon: <Send size={17} /> },
  { value: "EMAIL", label: "Email", icon: <Mail size={17} /> },
];

function statusClass(status: Campaign["status"]) {
  if (status === "COMPLETED") return "bg-emerald-100 text-emerald-700";
  if (status === "FAILED" || status === "CANCELLED") return "bg-red-100 text-red-700";
  if (status === "PROCESSING") return "bg-amber-100 text-amber-700";
  return "bg-blue-100 text-blue-700";
}

function audienceLabel(campaign: Campaign) {
  if (campaign.audience?.allRoles) return "Everyone";
  if (campaign.audience?.roles?.length) {
    return campaign.audience.roles.map((role) => roleOptions.find((item) => item.value === role)?.label ?? role).join(", ");
  }
  const count = campaign.audience?.recipientIds?.length ?? campaign.recipientCount;
  return `${count} selected account${count === 1 ? "" : "s"}`;
}

export default function SendNotificationsTab() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("INFORMATION");
  const [channels, setChannels] = useState<Channel[]>(["IN_APP", "PUSH"]);
  const [audienceMode, setAudienceMode] = useState<AudienceMode>("ALL");
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [search, setSearch] = useState("");
  const [searchRole, setSearchRole] = useState<Role | "">("");
  const [searchResults, setSearchResults] = useState<Recipient[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [searching, setSearching] = useState(false);

  const loadCampaigns = useCallback(() => {
    apiFetch<Campaign[]>("/admin/notifications")
      .then(setCampaigns)
      .catch((error) => setMessage(error?.message || "Unable to load campaign history."));
  }, []);

  useEffect(loadCampaigns, [loadCampaigns]);

  const searchRecipients = useCallback(async () => {
    setSearching(true);
    try {
      const recipients = await apiFetch<Recipient[]>("/admin/notifications/recipients", {
        query: { search, role: searchRole, take: 50 },
      });
      setSearchResults(recipients);
    } catch (error: any) {
      setMessage(error?.message || "Unable to search accounts.");
    } finally {
      setSearching(false);
    }
  }, [search, searchRole]);

  useEffect(() => {
    if (audienceMode !== "SELECTED") return;
    const timer = window.setTimeout(() => void searchRecipients(), 250);
    return () => window.clearTimeout(timer);
  }, [audienceMode, searchRecipients]);

  const valid = useMemo(() => {
    if (!title.trim() || !body.trim() || channels.length === 0) return false;
    if (audienceMode === "ROLES" && roles.length === 0) return false;
    if (audienceMode === "SELECTED" && selectedRecipients.length === 0) return false;
    if (scheduleEnabled && !scheduledAt) return false;
    return true;
  }, [title, body, channels, audienceMode, roles, selectedRecipients, scheduleEnabled, scheduledAt]);

  const toggleChannel = (channel: Channel) => {
    setChannels((current) => current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel]);
  };

  const toggleRole = (role: Role) => {
    setRoles((current) => current.includes(role) ? current.filter((item) => item !== role) : [...current, role]);
  };

  const toggleRecipient = (recipient: Recipient) => {
    setSelectedRecipients((current) => current.some((item) => item.id === recipient.id)
      ? current.filter((item) => item.id !== recipient.id)
      : [...current, recipient]);
  };

  const reset = () => {
    setTitle("");
    setBody("");
    setCategory("INFORMATION");
    setChannels(["IN_APP", "PUSH"]);
    setAudienceMode("ALL");
    setRoles([]);
    setSelectedRecipients([]);
    setScheduleEnabled(false);
    setScheduledAt("");
  };

  const submit = async () => {
    if (!valid) return;
    if (audienceMode === "ALL" && !window.confirm("Send this campaign to every active customer, merchant and rider?")) return;

    setSending(true);
    setMessage(null);
    try {
      const response = await apiFetch<{ scheduled: boolean; sent?: number; campaign: Campaign }>("/admin/notifications/send", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          type: "ADMIN_ANNOUNCEMENT",
          category: category === "PROMOTION" ? "MARKETING" : "TRANSACTIONAL",
          channels,
          allRoles: audienceMode === "ALL",
          roles: audienceMode === "ROLES" ? roles : undefined,
          recipientIds: audienceMode === "SELECTED" ? selectedRecipients.map((recipient) => recipient.id) : undefined,
          scheduledAt: scheduleEnabled ? new Date(scheduledAt).toISOString() : undefined,
          data: { screen: "notifications", adminType: category },
        }),
      });
      setMessage(response.scheduled ? "Campaign scheduled successfully." : `Campaign sent to ${response.sent ?? response.campaign.sentCount ?? 0} recipient(s).`);
      reset();
      loadCampaigns();
    } catch (error: any) {
      setMessage(error?.message || "Unable to send campaign.");
    } finally {
      setSending(false);
    }
  };

  const cancelCampaign = async (id: string) => {
    if (!window.confirm("Cancel this scheduled campaign?")) return;
    try {
      await apiFetch(`/admin/notifications/${id}/cancel`, { method: "PATCH" });
      setMessage("Campaign cancelled.");
      loadCampaigns();
    } catch (error: any) {
      setMessage(error?.message || "Unable to cancel campaign.");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-semibold text-[#101828]">Notification campaigns</h2>
        <p className="mt-1 text-sm text-[#667085]">Send in-app, push and email messages immediately or schedule them on the server.</p>
      </div>

      {message && <div className="rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-sm text-[#344054]">{message}</div>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section className="space-y-5 rounded-2xl border border-[#EAECF0] bg-white p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#344054]">Message title</label>
            <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="Enter a clear notification title" className="w-full rounded-xl border border-[#D0D5DD] px-4 py-3 outline-none focus:border-[#071D59]" />
          </div>

          <div>
            <div className="mb-2 flex justify-between text-sm font-medium text-[#344054]"><label>Message</label><span className="font-normal text-[#98A2B3]">{body.length}/500</span></div>
            <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={500} placeholder="Write the message recipients should receive" className="min-h-36 w-full resize-y rounded-xl border border-[#D0D5DD] px-4 py-3 outline-none focus:border-[#071D59]" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div><label className="mb-2 block text-sm font-medium text-[#344054]">Message type</label><select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-xl border border-[#D0D5DD] px-4 py-3"><option>INFORMATION</option><option>ALERT</option><option>PROMOTION</option></select></div>
            <div><label className="mb-2 block text-sm font-medium text-[#344054]">Delivery time</label><button type="button" onClick={() => setScheduleEnabled((current) => !current)} className={`w-full rounded-xl border px-4 py-3 text-left ${scheduleEnabled ? "border-[#071D59] bg-[#F2F4FF]" : "border-[#D0D5DD]"}`}>{scheduleEnabled ? "Scheduled" : "Send immediately"}</button></div>
          </div>

          {scheduleEnabled && <div><label className="mb-2 block text-sm font-medium text-[#344054]">Scheduled date and time</label><input type="datetime-local" value={scheduledAt} min={new Date().toISOString().slice(0, 16)} onChange={(event) => setScheduledAt(event.target.value)} className="w-full rounded-xl border border-[#D0D5DD] px-4 py-3" /></div>}

          <div>
            <label className="mb-3 block text-sm font-medium text-[#344054]">Channels</label>
            <div className="grid gap-3 md:grid-cols-3">{channelOptions.map((option) => <button key={option.value} type="button" onClick={() => toggleChannel(option.value)} className={`flex items-center justify-between rounded-xl border p-3 text-sm ${channels.includes(option.value) ? "border-[#071D59] bg-[#F2F4FF] text-[#071D59]" : "border-[#EAECF0] text-[#475467]"}`}><span className="flex items-center gap-2">{option.icon}{option.label}</span>{channels.includes(option.value) && <Check size={16} />}</button>)}</div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-[#344054]">Audience</label>
            <div className="grid gap-3 md:grid-cols-3">{([['ALL','Everyone'],['ROLES','By account type'],['SELECTED','Selected accounts']] as [AudienceMode,string][]).map(([value,label]) => <button key={value} type="button" onClick={() => setAudienceMode(value)} className={`rounded-xl border p-3 text-sm ${audienceMode === value ? "border-[#071D59] bg-[#F2F4FF] text-[#071D59]" : "border-[#EAECF0] text-[#475467]"}`}>{label}</button>)}</div>
          </div>

          {audienceMode === "ROLES" && <div className="flex flex-wrap gap-3">{roleOptions.map((option) => <button key={option.value} type="button" onClick={() => toggleRole(option.value)} className={`rounded-full border px-4 py-2 text-sm ${roles.includes(option.value) ? "border-[#071D59] bg-[#071D59] text-white" : "border-[#D0D5DD] text-[#475467]"}`}>{option.label}</button>)}</div>}

          {audienceMode === "SELECTED" && <div className="space-y-3 rounded-xl border border-[#EAECF0] p-4">
            <div className="flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email or phone" className="w-full rounded-lg border border-[#D0D5DD] py-2.5 pl-10 pr-3 text-sm" /></div><select value={searchRole} onChange={(event) => setSearchRole(event.target.value as Role | "")} className="rounded-lg border border-[#D0D5DD] px-3 text-sm"><option value="">All types</option>{roleOptions.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select></div>
            {selectedRecipients.length > 0 && <div className="flex flex-wrap gap-2">{selectedRecipients.map((recipient) => <button key={recipient.id} type="button" onClick={() => toggleRecipient(recipient)} className="flex items-center gap-1 rounded-full bg-[#EAF0FF] px-3 py-1.5 text-xs text-[#071D59]">{recipient.name}<X size={13} /></button>)}</div>}
            <div className="max-h-56 divide-y divide-[#EAECF0] overflow-y-auto">{searching ? <p className="py-5 text-center text-sm text-[#667085]">Searching…</p> : searchResults.map((recipient) => { const selected = selectedRecipients.some((item) => item.id === recipient.id); return <button key={recipient.id} type="button" onClick={() => toggleRecipient(recipient)} className="flex w-full items-center justify-between px-2 py-3 text-left hover:bg-[#F9FAFB]"><span><span className="block text-sm font-medium text-[#101828]">{recipient.name}</span><span className="block text-xs text-[#667085]">{recipient.email || recipient.phone || "No contact"} · {recipient.role}</span></span><span className={`flex h-5 w-5 items-center justify-center rounded border ${selected ? "border-[#071D59] bg-[#071D59] text-white" : "border-[#D0D5DD]"}`}>{selected && <Check size={13} />}</span></button>; })}</div>
          </div>}

          <button type="button" disabled={!valid || sending} onClick={submit} className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-medium text-white ${valid && !sending ? "bg-[#071D59] hover:bg-[#0A286B]" : "cursor-not-allowed bg-[#A8B9E7]"}`}><Send size={18} />{sending ? "Submitting…" : scheduleEnabled ? "Schedule campaign" : "Send campaign"}</button>
        </section>

        <aside className="rounded-2xl border border-[#EAECF0] bg-white p-5">
          <h3 className="text-lg font-semibold text-[#101828]">Delivery preview</h3>
          <div className="mt-4 rounded-2xl border border-[#EAECF0] bg-[#F9FAFB] p-4"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#071D59] font-semibold text-white">C</div><div><p className="font-semibold text-[#101828]">{title || "Notification title"}</p><p className="mt-1 whitespace-pre-wrap text-sm text-[#475467]">{body || "Your message preview will appear here."}</p><p className="mt-2 text-xs text-[#98A2B3]">Clothify · now</p></div></div></div>
          <div className="mt-5 space-y-3 text-sm text-[#475467]"><div className="flex justify-between"><span>Audience</span><strong className="text-[#101828]">{audienceMode === "ALL" ? "Everyone" : audienceMode === "ROLES" ? `${roles.length} type(s)` : `${selectedRecipients.length} selected`}</strong></div><div className="flex justify-between"><span>Channels</span><strong className="text-[#101828]">{channels.length}</strong></div><div className="flex justify-between"><span>Delivery</span><strong className="text-[#101828]">{scheduleEnabled ? "Scheduled" : "Immediate"}</strong></div></div>
        </aside>
      </div>

      <section className="rounded-2xl border border-[#EAECF0] bg-white p-6">
        <div className="mb-4 flex items-center justify-between"><div><h3 className="text-lg font-semibold text-[#101828]">Campaign history</h3><p className="text-sm text-[#667085]">Server-side schedules and delivery results.</p></div><button onClick={loadCampaigns} className="rounded-lg border border-[#D0D5DD] px-3 py-2 text-sm">Refresh</button></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead><tr className="border-b border-[#EAECF0] text-left text-[#667085]"><th className="px-3 py-3">Campaign</th><th className="px-3 py-3">Audience</th><th className="px-3 py-3">Channels</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Results</th><th className="px-3 py-3">Date</th><th className="px-3 py-3"></th></tr></thead><tbody>{campaigns.map((campaign) => <tr key={campaign.id} className="border-b border-[#F2F4F7]"><td className="px-3 py-4"><p className="font-medium text-[#101828]">{campaign.title}</p><p className="max-w-xs truncate text-xs text-[#667085]">{campaign.body}</p></td><td className="px-3 py-4">{audienceLabel(campaign)}</td><td className="px-3 py-4">{campaign.channels.join(", ")}</td><td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(campaign.status)}`}>{campaign.status}</span></td><td className="px-3 py-4"><span className="text-emerald-700">{campaign.sentCount} sent</span>{campaign.failedCount > 0 && <span className="ml-2 text-red-600">{campaign.failedCount} failed</span>}</td><td className="px-3 py-4"><div className="flex items-center gap-1.5"><Clock size={14} />{formatDate(campaign.scheduledAt || campaign.createdAt)} {formatTime(campaign.scheduledAt || campaign.createdAt)}</div></td><td className="px-3 py-4 text-right">{campaign.status === "SCHEDULED" && <button onClick={() => cancelCampaign(campaign.id)} className="text-sm font-medium text-red-600">Cancel</button>}</td></tr>)}{campaigns.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-[#667085]">No campaigns yet.</td></tr>}</tbody></table></div>
      </section>
    </div>
  );
}
