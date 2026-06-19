"use client";
import * as React from "react";
import ModalBase from "./ModalBase";

const COPY: Record<
  "suspend" | "activate" | "approve" | "reject",
  { title: string; body: string; tone: "red" | "blue" }
> = {
  suspend: {
    title: "Are you sure you want to suspend this user ?",
    body:
      "Suspending this user means they will not be able to make any wash order",
    tone: "red",
  },
  activate: {
    title: "Are you sure you want to activate this user ?",
    body:
      "Activating this user means they will be able to make wash order",
    tone: "blue",
  },
  approve: {
    title: "Are you sure you want to approve this merchant  ?",
    body:
      "Approving this merchant means they will be able to get wash order",
    tone: "blue",
  },
  reject: {
    title: "Are you sure you want to reject this merchant ?",
    body:
      "Rejecting this merchant means they will not be able to get any wash order",
    tone: "red",
  },
};

export default function ConfirmMerchantActionModal({
  open,
  kind,
  count = 1,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  kind: "suspend" | "activate" | "approve" | "reject";
  count?: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const c = COPY[kind];
  return (
    <ModalBase open={open} onClose={onCancel} width={560} z={160}>
      <div className="px-6 pt-6 pb-5">
        <h3 className="text-[22px] font-semibold text-gray-900">
          {c.title}
        </h3>
        {count > 1 && (
          <p className="mt-1 text-sm text-gray-500">
            This will apply to{" "}
            <span className="font-medium text-gray-900">{count}</span>{" "}
            selected merchants.
          </p>
        )}
        <p className="mt-4 text-gray-600 leading-7">{c.body}</p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="h-11 px-5 rounded-xl border text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`h-11 px-6 rounded-xl font-semibold text-white ${
              c.tone === "red"
                ? "bg-rose-500 hover:bg-rose-600"
                : "bg-[#233A78] hover:bg-[#1c2f5d]"
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </ModalBase>
  );
}
