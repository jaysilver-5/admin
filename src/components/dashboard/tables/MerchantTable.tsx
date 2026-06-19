"use client";
import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import type { Merchant } from "@/lib/merchants";

export default function MerchantTable({
  merchants,
  selected,
  onToggleSelect,
  onToggleSelectAll,
  onRowClick,
  onOpenMenu,
}: {
  merchants: Merchant[];
  selected: string[];
  onToggleSelect: (id: string, on: boolean) => void;
  onToggleSelectAll: (on: boolean) => void;
  onRowClick: (m: Merchant) => void;
  onOpenMenu: (m: Merchant, anchor: HTMLButtonElement) => void;
}) {
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const allChecked = merchants.length > 0 && selected.length === merchants.length;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 sm:px-6 py-3 text-left">
              <input
                type="checkbox"
                onClick={stop}
                checked={allChecked}
                onChange={(e) => onToggleSelectAll((e.target as HTMLInputElement).checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </th>
            {["Business Name","Phone Number","Email Address","Business Address","Last Login Date","Service","Actions"].map((h) => (
              <th key={h} className="px-4 sm:px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {merchants.map((m) => {
            const isSel = selected.includes(m.id);
            return (
              <tr key={m.id} className={`cursor-pointer hover:bg-gray-50 ${isSel ? "bg-blue-50/50" : ""}`} onClick={() => onRowClick(m)}>
                <td className="px-4 sm:px-6 py-4" onClick={stop}>
                  <input
                    type="checkbox"
                    checked={isSel}
                    onChange={(e) => onToggleSelect(m.id, (e.target as HTMLInputElement).checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{m.businessName}</td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.phoneNumber}</td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{m.email}</td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{m.address}</td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.lastLoginDate}</td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{m.serviceTier}</td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm" onClick={stop}>
                  <button
                    className="p-1 hover:bg-gray-100 rounded"
                    onClick={(e) => onOpenMenu(m, e.currentTarget)}
                    aria-label="Row actions"
                  >
                    <MoreHorizontal className="h-4 w-4 text-gray-600" />
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
