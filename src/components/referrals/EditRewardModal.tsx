"use client";
import * as React from "react";
import { X } from "lucide-react";

export default function EditRewardModal({
  open,
  current,
  onClose,
  onSave,
}: {
  open: boolean;
  current: number;
  onClose: () => void;
  onSave: (next: number) => void;
}) {
  const [value, setValue] = React.useState<string>("");

  React.useEffect(() => {
    if (open) setValue("");
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[120] bg-black/30 backdrop-blur-[1px]">
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-[540px] rounded-2xl bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[28px] font-semibold text-gray-900">Referral Amount</h3>
            <button onClick={onClose} className="rounded-md p-2 hover:bg-gray-100">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Current Reward</span>
              <div className="h-12 rounded-lg bg-indigo-50 px-4 text-[17px] font-semibold text-gray-900 grid place-items-center text-left">
                ₦{current.toLocaleString()}
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Input new Amount</span>
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Input new reward amount"
                className="h-12 w-full rounded-lg border border-gray-300 px-3 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>

            <button
              onClick={() => {
                const v = Number(String(value).replace(/[^\d.]/g, ""));
                if (!Number.isFinite(v) || v <= 0) return;
                onSave(Math.round(v));
              }}
              className="mt-2 h-12 w-full rounded-lg bg-[#0B2358] text-white font-semibold hover:opacity-95"
            >
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
