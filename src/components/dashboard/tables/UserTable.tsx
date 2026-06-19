"use client";
import * as React from "react";
import { UserMinus } from "lucide-react";
import type { User } from "@/lib/users";

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
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 sm:px-6 py-3 text-left">
              <input
                onClick={stop}
                type="checkbox"
                checked={users.length > 0 && selected.length === users.length}
                onChange={toggleAll}
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
                className="px-4 sm:px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider"
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
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onRowOpenHistory(u)}
              >
                {/* select */}
                <td className="px-4 sm:px-6 py-4" onClick={stop}>
                  <input
                    type="checkbox"
                    checked={selected.includes(u.id)}
                    onChange={() => toggle(u.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>

                {/* name */}
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {u.fullName}
                </td>

                {/* phone */}
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {u.phoneNumber}
                </td>

                {/* email */}
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {u.email}
                </td>

                {/* wallet */}
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {fmt(u.walletBalance)}
                </td>

                {/* last login */}
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {u.lastLoginDate}
                </td>

                {/* actions: icon-only toggle */}
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm" onClick={stop}>
                  <button
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
