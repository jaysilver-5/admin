"use client";
import * as React from "react";
import { UserRoundMinus, UserRoundPlus, CheckCircle2, XCircle } from "lucide-react";

type TabKey = "verified" | "pending" | "rejected" | "suspended";

export default function MerchantBulkActions({
  tab,
  disabled,
  onSuspend,
  onActivate,
  onApprove,
  onReject,
}: {
  tab: TabKey;
  disabled: boolean;           // true when no rows selected
  onSuspend: () => void;
  onActivate: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
    const Btn = ({
        title,
        children,
        onClick,
        className = "",
      }: {
        title: string;
        children: React.ReactNode;
        onClick: () => void;
        className?: string;
      }) => (
        <button
          title={title}
          aria-label={title}
          onClick={onClick}
          disabled={disabled}
          className={`h-10 w-10 rounded-xl grid place-items-center border transition
            disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
        >
          {children}
        </button>
      );
      

  return (
    <div className="flex items-center gap-2">
      {/* verified → Suspend */}
      {tab === "verified" && (
        <Btn title="Suspend selected" onClick={onSuspend} className="bg-rose-50 border-rose-200">
          <UserRoundMinus className="h-5 w-5 text-rose-600" />
        </Btn>
      )}

      {/* pending → Approve + Reject */}
      {tab === "pending" && (
        <>
          <Btn title="Approve selected" onClick={onApprove} className="bg-emerald-50 border-emerald-200">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </Btn>
          <Btn title="Reject selected" onClick={onReject} className="bg-rose-50 border-rose-200">
            <XCircle className="h-5 w-5 text-rose-600" />
          </Btn>
        </>
      )}

      {/* rejected → Approve */}
      {tab === "rejected" && (
        <Btn title="Approve selected" onClick={onApprove} className="bg-emerald-50 border-emerald-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        </Btn>
      )}

      {/* suspended → Activate */}
      {tab === "suspended" && (
        <Btn title="Activate selected" onClick={onActivate} className="bg-blue-50 border-blue-200">
          <UserRoundPlus className="h-5 w-5 text-blue-600" />
        </Btn>
      )}
    </div>
  );
}
