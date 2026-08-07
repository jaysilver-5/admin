"use client";

import * as React from "react";
import { Shield, UserCog } from "lucide-react";
import { formatDate } from "@/lib/api";
import { AdminRole, AdminTeamMember, fetchAdminRoles, fetchAdminTeam, updateAdminRoles, updateAdminStatus } from "@/lib/admin";

export default function AdminTeamTab() {
  const [members, setMembers] = React.useState<AdminTeamMember[]>([]);
  const [roles, setRoles] = React.useState<AdminRole[]>([]);
  const [selected, setSelected] = React.useState<AdminTeamMember | null>(null);
  const [roleKeys, setRoleKeys] = React.useState<string[]>([]);
  const [message, setMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(() => {
    setLoading(true);
    Promise.all([fetchAdminTeam(), fetchAdminRoles()])
      .then(([nextMembers, nextRoles]) => { setMembers(nextMembers); setRoles(nextRoles); })
      .catch((err) => setMessage(err?.message || "Unable to load the admin team"))
      .finally(() => setLoading(false));
  }, []);
  React.useEffect(load, [load]);

  const open = (member: AdminTeamMember) => {
    setSelected(member);
    setRoleKeys(member.roles.map(({ role }) => role.key));
    setMessage(null);
  };
  const save = async () => {
    if (!selected || !roleKeys.length) return;
    try {
      await updateAdminRoles(selected.id, roleKeys);
      setSelected(null);
      setMessage("Administrator roles updated.");
      load();
    } catch (err: any) { setMessage(err?.message || "Unable to update roles"); }
  };
  const toggleStatus = async (member: AdminTeamMember) => {
    const next = !member.isActive;
    const reason = next ? undefined : "Disabled from the administrator team panel";
    try { await updateAdminStatus(member.id, next, reason); load(); }
    catch (err: any) { setMessage(err?.message || "Unable to update administrator"); }
  };

  return <div className="space-y-6"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Access control</p><h1 className="mt-1 text-2xl font-semibold text-slate-950">Administrator team</h1><p className="mt-1 text-sm text-slate-500">Assign operational responsibilities without giving every administrator full access.</p></div>{message && <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">{message}</div>}<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{roles.map((role) => <div key={role.id} className="rounded-2xl border border-slate-200 bg-white p-4"><Shield className="h-5 w-5 text-blue-700"/><h2 className="mt-3 font-semibold text-slate-900">{role.name}</h2><p className="mt-1 min-h-10 text-xs text-slate-500">{role.description}</p><p className="mt-3 text-xs font-medium text-slate-600">{role._count.assignments} assigned · {role.permissions.length} capabilities</p></div>)}</div><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">Team members</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Administrator</th><th className="px-5 py-3">Roles</th><th className="px-5 py-3">Last login</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Controls</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">Loading administrators…</td></tr> : members.map((member) => <tr key={member.id}><td className="px-5 py-4"><p className="font-medium text-slate-900">{member.displayName || member.account.email || member.account.phone}</p><p className="text-xs text-slate-500">{member.account.email || member.account.phone}</p></td><td className="px-5 py-4"><div className="flex flex-wrap gap-1">{member.roles.map(({ role }) => <span key={role.key} className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">{role.name}</span>)}</div></td><td className="px-5 py-4 text-slate-600">{formatDate(member.account.lastLoginAt)}</td><td className="px-5 py-4"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${member.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{member.isActive ? "Active" : "Disabled"}</span></td><td className="px-5 py-4 text-right"><button onClick={() => open(member)} className="mr-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50">Edit roles</button><button onClick={() => void toggleStatus(member)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">{member.isActive ? "Disable" : "Enable"}</button></td></tr>)}</tbody></table></div></section>{selected && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-center gap-3"><div className="rounded-xl bg-blue-50 p-2"><UserCog className="h-5 w-5 text-blue-700"/></div><div><h2 className="font-semibold text-slate-950">Edit administrator roles</h2><p className="text-xs text-slate-500">{selected.account.email || selected.account.phone}</p></div></div><div className="mt-5 space-y-2">{roles.map((role) => <label key={role.key} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50"><input type="checkbox" checked={roleKeys.includes(role.key)} onChange={(e) => setRoleKeys((keys) => e.target.checked ? [...keys, role.key] : keys.filter((key) => key !== role.key))} className="mt-1"/><span><span className="block text-sm font-semibold text-slate-900">{role.name}</span><span className="text-xs text-slate-500">{role.description}</span></span></label>)}</div><div className="mt-6 flex justify-end gap-2"><button onClick={() => setSelected(null)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button disabled={!roleKeys.length} onClick={() => void save()} className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Save roles</button></div></div></div>}</div>;
}
