"use client";
import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import type { Merchant } from "@/lib/merchants";
import { formatNigerianPhone } from "@/lib/api";
import CopyableCell from "./CopyableCell";

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
    <div className="overflow-x-auto overscroll-x-contain" tabIndex={0} aria-label="Merchants table, horizontally scrollable">
      <table className="w-full min-w-[980px] table-fixed divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2.5 text-left">
              <input
                type="checkbox"
                onClick={stop}
                checked={allChecked}
                onChange={(e) => onToggleSelectAll((e.target as HTMLInputElement).checked)}
                aria-label="Select all merchants on this page"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </th>
            {["Business Name","Phone Number","Email Address","Business Address","Last Login Date","Service","Actions"].map((h) => (
              <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {merchants.map((m) => {
            const isSel = selected.includes(m.id);
            return (
              <tr key={m.id} className={`hover:bg-gray-50 ${isSel ? "bg-blue-50/50" : ""}`}>
                <td className="px-3 py-3" onClick={stop}>
                  <input
                    type="checkbox"
                    checked={isSel}
                    onChange={(e) => onToggleSelect(m.id, (e.target as HTMLInputElement).checked)}
                    aria-label={`Select ${m.businessName || "merchant"}`}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-3 py-3 text-sm font-medium text-gray-900"><CopyableCell value={m.businessName} label="business name"/></td>
                <td className="px-3 py-3 text-sm text-gray-500"><CopyableCell value={formatNigerianPhone(m.phoneNumber)} label="phone number" truncate={false}/></td>
                <td className="px-3 py-3 text-sm text-gray-900"><CopyableCell value={m.email} label="email address"/></td>
                <td className="px-3 py-3 text-sm text-gray-900"><CopyableCell value={m.address} label="business address" lines={2}/></td>
                <td className="px-3 py-3 text-sm text-gray-500"><CopyableCell value={m.lastLoginDate} label="last login date" truncate={false}/></td>
                <td className="px-3 py-3 text-sm text-gray-900"><CopyableCell value={m.serviceTier} label="service tier" truncate={false}/></td>
                <td className="whitespace-nowrap px-3 py-3 text-sm" onClick={stop}>
                  <button type="button" onClick={() => onRowClick(m)} className="mr-1 rounded px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500">View</button>
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
