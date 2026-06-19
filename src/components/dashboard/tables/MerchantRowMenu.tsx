"use client";
import * as React from "react";
import { UserRound, ShieldCheck, UserX, UserPlus, FileText } from "lucide-react";
import type { MerchantStatus } from "@/lib/merchants";

export type MerchantRowAction = "view" | "upgrade" | "suspend" | "activate" | "approve" | "reject";

export default function MerchantRowMenu({
  open, coords, status, onClose, onSelect,
}: {
  open: boolean;
  coords: { top: number; left: number } | null;
  status: MerchantStatus;
  onClose: () => void;
  onSelect: (a: MerchantRowAction) => void;
}) {
  if (!open || !coords) return null;

  const Wrap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div
      style={{ position: "fixed", top: coords.top, left: coords.left }}
      className="w-[240px] rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden z-50"
    >
      {children}
    </div>
  );

  const Item = ({
    icon, label, action, tone,
  }: { icon: React.ReactNode; label: string; action: MerchantRowAction; tone?: "blue" | "red" }) => (
    <button
      onClick={() => { onSelect(action); }}
      className={`w-full flex items-center gap-3 px-3 py-3 text-sm ${
        tone === "red" ? "text-red-600" : "text-gray-800"
      }`}
      style={{ background: tone === "red" ? "rgba(244,63,94,0.08)" : "rgba(37,99,235,0.08)" }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  if (status === "pending") {
    return (
      <Wrap>
        <Item icon={<FileText className="h-4 w-4" />} label="View Docs" action="view" />
        <Item icon={<ShieldCheck className="h-4 w-4" />} label="Approve merchant" action="approve" />
        <Item icon={<UserX className="h-4 w-4" />} label="Reject merchant" action="reject" tone="red" />
      </Wrap>
    );
  }
  if (status === "suspended") {
    return (
      <Wrap>
        <Item icon={<UserRound className="h-4 w-4" />} label="View profile" action="view" />
        <Item icon={<ShieldCheck className="h-4 w-4" />} label="Upgrade merchant" action="upgrade" />
        <Item icon={<UserPlus className="h-4 w-4" />} label="Activate merchant" action="activate" tone="red" />
      </Wrap>
    );
  }
  // verified
  return (
    <Wrap>
      <Item icon={<UserRound className="h-4 w-4" />} label="View profile" action="view" />
      <Item icon={<ShieldCheck className="h-4 w-4" />} label="Upgrade merchant" action="upgrade" />
      <Item icon={<UserX className="h-4 w-4" />} label="Suspend Merchant" action="suspend" tone="red" />
    </Wrap>
  );
}
