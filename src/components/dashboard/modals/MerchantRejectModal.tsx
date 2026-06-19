"use client";
import * as React from "react";
import ModalBase from "./ModalBase";
import type { Merchant } from "@/lib/merchants";

export default function MerchantRejectModal({
  open, onClose, merchant, onSend,
}: {
  open: boolean;
  onClose: () => void;
  merchant?: Merchant;
  onSend: () => void;
}) {
  const [reason, setReason] = React.useState("");
  const [note, setNote] = React.useState("");
  if (!open || !merchant) return null;

  return (
    <ModalBase open={open} onClose={onClose} width={540}>
      <div className="px-6 pt-5 pb-4">
        <h3 className="text-[24px] font-semibold text-gray-900 text-center">Rejection Reason</h3>

        <div className="mt-4 grid grid-cols-2 rounded-xl border">
          <div className="px-4 py-3 text-center text-gray-500">Service Requesting</div>
          <div className="px-4 py-3 text-center font-medium">{merchant.serviceTier ?? "Exclusive Merchant"}</div>
        </div>

        {/* Thumbs */}
        <div className="mt-5 rounded-2xl border p-5">
          <div className="text-center font-semibold">CAC Doc</div>
          <div className="mt-4 h-[120px] rounded-lg bg-gray-200" />
        </div>

        <div className="mt-5 rounded-2xl border p-5">
          <div className="text-center font-semibold">Store Images</div>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[64px] rounded-lg bg-gray-200" />
            ))}
          </div>
        </div>

        <div className="mt-5">
          <label className="text-sm text-gray-700">Select rejection reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full h-11 rounded-md border px-3 text-sm"
          >
            <option value="">Select rejection reason</option>
            <option value="fake-docs">Fake documents</option>
            <option value="unclear-images">Unclear images</option>
            <option value="mismatch">Data mismatch</option>
          </select>
        </div>

        <div className="mt-4">
          <label className="text-sm text-gray-700">Additional Information / Other reasons</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Input reason"
          />
        </div>

        <div className="mt-6">
          <button onClick={() => { onSend(); onClose(); }} className="w-full h-11 rounded-xl bg-[#233A78] text-white font-semibold">
            Send
          </button>
        </div>
      </div>
    </ModalBase>
  );
}
