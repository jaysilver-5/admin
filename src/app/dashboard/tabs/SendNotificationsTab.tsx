"use client";

import React, { useEffect, useState } from "react";
import { X, Edit2, Clock, Search, Filter } from "lucide-react";
import { apiFetch, formatDate, formatTime } from "@/lib/api";

type Schedule = {
  id: number;
  title: string;
  body: string;
  type: string;
  audience: string;
  date: string;
  time: string;
  scheduledTime: Date;
};

type HistoryItem = {
  id: string;
  title: string;
  body?: string;
  type: string;
  createdAt: string;
  audience?: string;
};

const messageTypes = ["Alert", "Promotion", "Information"];
const audiences = ["All users", "Riders", "Merchants", "Suspended riders", "Suspended merchants"];

function roleForAudience(audience: string) {
  if (audience === "Riders") return "RIDER";
  if (audience === "Merchants") return "MERCHANT";
  if (audience === "All users") return "USER";
  return null;
}

const SendNotificationsTab = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const [formData, setFormData] = useState({
    id: null as number | null,
    title: "",
    body: "",
    type: "",
    audience: "",
    date: "",
    time: "",
    scheduleEnabled: false,
  });

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadHistory = () => {
    apiFetch<HistoryItem[]>("/admin/notifications")
      .then(setHistory)
      .catch((err) => setMessage(err?.message || "Unable to load notifications"));
  };

  useEffect(loadHistory, []);

  const calculateTimeRemaining = (scheduledTime: Date) => {
    const now = new Date();
    const diff = scheduledTime.getTime() - now.getTime();
    if (diff <= 0) return "Ready";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `Sending in ${hours}hrs, ${minutes}Min`;
  };

  const handleEdit = (schedule: Schedule) => {
    setFormData({ ...schedule, id: schedule.id, scheduleEnabled: true });
  };

  const handleDelete = (id: number) => setSchedules((prev) => prev.filter((s) => s.id !== id));

  const handleScheduleClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setShowDetailsModal(true);
  };

  const resetForm = () => setFormData({ id: null, title: "", body: "", type: "", audience: "", date: "", time: "", scheduleEnabled: false });

  const handleSubmit = async () => {
    setMessage(null);
    const scheduledTime = new Date(`${formData.date}T${formData.time || "00:00"}`);

    if (formData.scheduleEnabled) {
      const next: Schedule = {
        id: formData.id ?? Date.now(),
        title: formData.title,
        body: formData.body,
        type: formData.type,
        audience: formData.audience,
        date: formData.date,
        time: formData.time,
        scheduledTime,
      };
      setSchedules((prev) => (formData.id ? prev.map((s) => (s.id === formData.id ? next : s)) : [...prev, next]));
      setMessage("Schedule saved locally. Backend scheduling endpoint is not available yet.");
      resetForm();
      return;
    }

    const role = roleForAudience(formData.audience);
    if (!role) {
      setMessage("This backend currently supports role-based sends only for All users, Riders, and Merchants.");
      return;
    }

    setSending(true);
    try {
      const res = await apiFetch<{ sent: number }>("/admin/notifications/send", {
        method: "POST",
        body: JSON.stringify({
          role,
          title: formData.title,
          body: formData.body,
          type: "ORDER_STATUS_UPDATE",
          data: { adminType: formData.type, audience: formData.audience },
        }),
      });
      setMessage(`Notification sent to ${res.sent ?? 0} recipient(s).`);
      resetForm();
      loadHistory();
    } catch (err: any) {
      setMessage(err?.message || "Unable to send notification");
    } finally {
      setSending(false);
    }
  };

  const isFormValid = () => formData.title.trim() !== "" && formData.body.trim() !== "" && formData.type !== "" && formData.audience !== "" && formData.date !== "" && formData.time !== "";
  const filteredHistory = history.filter((n) => [n.title, n.type, n.createdAt, n.audience].join(" ").toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex gap-6 p-6 bg-white rounded-2xl min-h-screen">
      <div className="flex-1 bg-white rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl text-black font-semibold">Send notifications</h2>
          <button onClick={() => setShowHistoryModal(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"><Clock size={18} />View History</button>
        </div>

        {message && <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">{message}</div>}

        <div className="space-y-4">
          <div><label className="block text-sm font-medium mb-2">Message Title</label><input type="text" placeholder="Input title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div>
            <label className="block text-sm font-medium mb-2">Message Body</label>
            <div className="border border-gray-300 rounded-lg"><div className="flex items-center gap-2 p-2 border-b border-gray-200"><select className="text-sm border-none focus:outline-none"><option>14</option></select><button className="p-1 hover:bg-gray-100 rounded">T</button><button className="p-1 hover:bg-gray-100 rounded">●</button><button className="p-1 hover:bg-gray-100 rounded font-bold">B</button><button className="p-1 hover:bg-gray-100 rounded italic">I</button><button className="p-1 hover:bg-gray-100 rounded underline">U</button><button className="p-1 hover:bg-gray-100 rounded line-through">S</button><button className="p-1 hover:bg-gray-100 rounded">≡</button><button className="p-1 hover:bg-gray-100 rounded">≡</button><button className="p-1 hover:bg-gray-100 rounded">≡</button><button className="p-1 hover:bg-gray-100 rounded">☰</button><button className="p-1 hover:bg-gray-100 rounded">🖼</button><button className="p-1 hover:bg-gray-100 rounded">🔗</button></div><textarea placeholder="Type message here" value={formData.body} onChange={(e) => setFormData({ ...formData, body: e.target.value })} className="w-full p-4 min-h-32 focus:outline-none rounded-b-lg resize-none" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-2">Message Type</label><select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Select message type</option>{messageTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-2">Audience</label><select value={formData.audience} onChange={(e) => setFormData({ ...formData, audience: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Select audience</option>{audiences.map((audience) => <option key={audience} value={audience}>{audience}</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-2">Select Date</label><input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-medium mb-2">Select Time</label><input type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div className="flex items-center justify-between"><label className="text-sm font-medium">Schedule Notification</label><button onClick={() => setFormData({ ...formData, scheduleEnabled: !formData.scheduleEnabled })} className={`relative w-12 h-6 rounded-full transition-colors ${formData.scheduleEnabled ? "bg-blue-600" : "bg-gray-300"}`}><span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.scheduleEnabled ? "translate-x-6" : ""}`} /></button></div>
          <button onClick={handleSubmit} disabled={!isFormValid() || sending} className={`w-full text-white py-3 rounded-lg transition-colors ${isFormValid() && !sending ? "bg-[#071D59] hover:bg-[#0a2470] cursor-pointer" : "bg-[#91ADF6] cursor-not-allowed"}`}>{sending ? "Sending…" : formData.scheduleEnabled ? "Save Schedule" : "Send"}</button>
        </div>
      </div>

      <div className="w-80 bg-white rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Schedules</h3>
        <div className="space-y-3">
          {schedules.map((schedule) => <div key={schedule.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"><div className="flex justify-between items-start mb-3"><h4 className="font-medium">{schedule.title}</h4><button onClick={(e) => { e.stopPropagation(); handleEdit(schedule); }} className="text-black hover:text-blue-600"><Edit2 size={16} /></button></div><div onClick={() => handleScheduleClick(schedule)} className="space-y-2"><div className="flex items-center gap-2 text-sm text-black"><Clock size={14} /><span>{schedule.date} {schedule.time}</span></div><div className="flex items-center justify-between"><span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">{calculateTimeRemaining(schedule.scheduledTime)}</span><button onClick={(e) => { e.stopPropagation(); handleDelete(schedule.id); }} className="text-red-500 hover:text-red-700 text-sm">Delete</button></div></div></div>)}
          {schedules.length === 0 && <div className="text-sm text-gray-500">No local schedules.</div>}
        </div>
      </div>

      {showHistoryModal && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-lg w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden"><div className="p-6 border-b border-gray-200 flex justify-between items-center"><h2 className="text-2xl font-semibold">Notification history</h2><button onClick={() => setShowHistoryModal(false)} className="text-black-500 hover:text-black-700"><X size={24} /></button></div><div className="p-6"><div className="relative mb-6"><Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black-400" size={20} /><input type="text" placeholder="Search by type, date or Audience" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /><Filter className="absolute right-4 top-1/2 transform -translate-y-1/2 text-black-400" size={20} /></div><div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-gray-200"><th className="text-left py-4 px-4 font-medium text-black-700">Title</th><th className="text-left py-4 px-4 font-medium text-black-700">Notification Type</th><th className="text-left py-4 px-4 font-medium text-black-700">Date and Time</th><th className="text-left py-4 px-4 font-medium text-black-700">Audience</th></tr></thead><tbody>{filteredHistory.map((notification) => <tr key={notification.id} className="border-b border-gray-100 hover:bg-gray-50"><td className="py-4 px-4">{notification.title}</td><td className="py-4 px-4">{notification.type}</td><td className="py-4 px-4">{formatDate(notification.createdAt)} {formatTime(notification.createdAt)}</td><td className="py-4 px-4">{(notification as any).data?.audience || "—"}</td></tr>)}{filteredHistory.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-sm text-gray-500">No notifications found.</td></tr>}</tbody></table></div></div></div></div>}

      {showDetailsModal && selectedSchedule && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-lg w-full max-w-2xl mx-4 p-8"><div className="flex justify-between items-start mb-6"><h2 className="text-2xl font-semibold">Schedule Details</h2><button onClick={() => setShowDetailsModal(false)} className="text-black-500 hover:text-black-700"><X size={24} /></button></div><div className="space-y-4"><div><label className="block text-sm font-medium text-black mb-1">Title</label><p className="text-lg">{selectedSchedule.title}</p></div><div><label className="block text-sm font-medium text-black mb-1">Message Body</label><p className="text-black-800">{selectedSchedule.body}</p></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-black mb-1">Message Type</label><p>{selectedSchedule.type}</p></div><div><label className="block text-sm font-medium text-black mb-1">Audience</label><p>{selectedSchedule.audience}</p></div></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-black mb-1">Date</label><p>{selectedSchedule.date}</p></div><div><label className="block text-sm font-medium text-black mb-1">Time</label><p>{selectedSchedule.time}</p></div></div><div><label className="block text-sm font-medium text-black mb-1">Status</label><span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">{calculateTimeRemaining(selectedSchedule.scheduledTime)}</span></div><div className="flex gap-3 pt-4"><button onClick={() => { handleEdit(selectedSchedule); setShowDetailsModal(false); }} className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">Edit</button><button onClick={() => { handleDelete(selectedSchedule.id); setShowDetailsModal(false); }} className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600">Delete</button></div></div></div></div>}
    </div>
  );
};

export default SendNotificationsTab;
