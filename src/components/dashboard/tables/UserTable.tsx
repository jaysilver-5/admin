"use client";
import * as React from "react";
import { History, UserMinus } from "lucide-react";
import type { User } from "@/lib/users";
import CopyableCell from "./CopyableCell";

export default function UserTable({
  users,
  onRowOpenHistory,
  onAction, // suspend/activate trigger (opens confirm modal)
}: {
  users: User[];
  onRowOpenHistory: (u: User) => void;
  onAction: (u: User) => void;
}) {
  const [selected, setSelected] = React.useState<string[]>([]);
  const toggle = (id: string) =>
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleAll = () =>
    setSelected(selected.length === users.length ? [] : users.map((u) => u.id));
  const fmt = (n: number) => `₦${n.toLocaleString()}`;

  // Prevent row click from firing
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="overflow-x-auto overscroll-x-contain" tabIndex={0} aria-label="Users table, horizontally scrollable">
      <table className="w-full min-w-[860px] table-fixed divide-y divide-gray-200">
        <colgroup>
          <col className="w-14" />
          <col className="w-[18%]" />
          <col className="w-[17%]" />
          <col className="w-[25%]" />
          <col className="w-[15%]" />
          <col className="w-[15%]" />
          <col className="w-28" />
        </colgroup>
        <thead className="bg-gray-50">
          <tr>
            <th className="sticky left-0 z-20 bg-gray-50 px-4 py-3 text-left sm:px-6">
              <input
                onClick={stop}
                type="checkbox"
                checked={users.length > 0 && selected.length === users.length}
                onChange={toggleAll}
                aria-label="Select all users on this page"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </th>
            {[
              "Full Name",
              "Phone Number",
              "Email Address",
              "Wallet Balance",
              "Last Login Date",
              "Actions",
            ].map((h) => (
              <th
                key={h}
                className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 sm:px-6 ${h === "Actions" ? "sticky right-0 z-20 bg-gray-50" : ""}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((u) => {
            const suspended = u.status === "suspended";
            return (
              <tr
                key={u.id}
                className="group/row hover:bg-gray-50"
              >
                {/* select */}
                <td className="sticky left-0 z-10 bg-white px-4 py-4 group-hover/row:bg-gray-50 sm:px-6" onClick={stop}>
                  <input
                    type="checkbox"
                    checked={selected.includes(u.id)}
                    onChange={() => toggle(u.id)}
                    aria-label={`Select ${u.fullName || "user"}`}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>

                {/* name */}
                <td className="px-4 py-4 text-sm font-medium text-gray-900 sm:px-6">
                  <CopyableCell value={u.fullName} label="full name" />
                </td>

                {/* phone */}
                <td className="px-4 py-4 text-sm text-gray-500 sm:px-6">
                  <CopyableCell value={u.phoneNumber} label="phone number" />
                </td>

                {/* email */}
                <td className="px-4 py-4 text-sm text-gray-900 sm:px-6">
                  <CopyableCell value={u.email} label="email address" />
                </td>

                {/* wallet */}
                <td className="px-4 py-4 text-sm font-medium text-gray-900 sm:px-6">
                  <CopyableCell value={fmt(u.walletBalance)} label="wallet balance" />
                </td>

                {/* last login */}
                <td className="px-4 py-4 text-sm text-gray-500 sm:px-6">
                  <CopyableCell value={u.lastLoginDate} label="last login date" />
                </td>

                {/* actions: icon-only toggle */}
                <td className="sticky right-0 z-10 bg-white px-4 py-4 text-sm group-hover/row:bg-gray-50 sm:px-6" onClick={stop}>
                  <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onRowOpenHistory(u)}
                    aria-label={`View order history for ${u.fullName}`}
                    className="grid h-9 w-9 place-items-center rounded-md border border-gray-200 text-gray-500 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="View order history"
                  >
                    <History className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onAction(u)}
                    aria-label={suspended ? "Activate user" : "Suspend user"}
                    className={`h-9 w-9 grid place-items-center rounded-md border transition
                      ${
                        suspended
                          // Suspended → red icon, tinted bg + red border (your reference look)
                          ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                          // Active → transparent / natural button
                          : "bg-transparent border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                    title={suspended ? "Activate user" : "Suspend user"}
                  >
                    <UserMinus className="h-4 w-4" />
                  </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {users.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                No users match the current search and filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
