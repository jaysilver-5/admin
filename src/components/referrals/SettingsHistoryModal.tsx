"use client";
import * as React from "react";
import { X } from "lucide-react";

const rows = Array.from({ length: 4 }, () => ({
  initial: 1100,
  admin: "Admin Doe",
  when: "14/10/24   (14:32)",
  updated: 1500,
}));

export default function SettingsHistoryModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[120] bg-black/30 backdrop-blur-[1px]">
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-[880px] rounded-2xl bg-white p-6 shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-[26px] font-semibold text-gray-900">Settings history</h3>
            <button onClick={onClose} className="rounded-md p-2 hover:bg-gray-100">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Headings */}
          <div className="grid grid-cols-12 px-2">
            <div className="col-span-3 text-sm font-medium text-gray-600">Initial Amount</div>
            <div className="col-span-3 text-sm font-medium text-gray-600">Admin Name</div>
            <div className="col-span-4 text-sm font-medium text-gray-600">Date and Time of Change</div>
            <div className="col-span-2 text-sm font-medium text-gray-600">Updated Amount</div>
          </div>

          {/* Rows — NO borders, black text */}
          <ul className="mt-3">
            {rows.map((r, i) => (
              <li
                key={i}
                className="grid grid-cols-12 items-center rounded-xl px-2 py-4 text-[15px] text-black hover:bg-gray-50"
              >
                <div className="col-span-3">₦{r.initial.toLocaleString()}</div>
                <div className="col-span-3">{r.admin}</div>
                <div className="col-span-4">{r.when}</div>
                <div className="col-span-2">₦{r.updated.toLocaleString()}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
