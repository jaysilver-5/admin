"use client";
import * as React from "react";
import { UserMinus, UserPlus } from "lucide-react";
import type { UserStatus } from "@/lib/users";

export type RowAction = "suspend" | "activate";

export default function RowActionsMenu({
  open,
  coords,
  status,
  onClose,
  onSelect,
}: {
  open: boolean;
  coords: { top: number; left: number } | null;
  status: UserStatus;
  onClose: () => void;
  onSelect: (action: RowAction) => void;
}) {
  if (!open || !coords) return null;

  const isSuspended = status === "suspended";
  const label = isSuspended ? "Activate user" : "Suspend user";
  const action: RowAction = isSuspended ? "activate" : "suspend";
  const Icon = isSuspended ? UserPlus : UserMinus;
  const bg = isSuspended ? "rgba(35,58,120,0.10)" : "rgba(244,63,94,0.10)";
  const color = isSuspended ? "text-gray-800" : "text-red-600";

  return (
    <div
      style={{ position: "fixed", top: coords.top, left: coords.left }}
      className="w-[220px] rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden z-50"
    >
      <button
        onClick={() => { onSelect(action); onClose(); }}
        className={`w-full flex items-center gap-3 px-3 py-3 ${color}`}
        style={{ background: bg }}
      >
        <Icon className="h-4 w-4" />
        <span className="text-sm">{label}</span>
      </button>
    </div>
  );
}
