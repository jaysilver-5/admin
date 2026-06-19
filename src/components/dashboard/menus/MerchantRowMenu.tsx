"use client";
import * as React from "react";

export type MerchantStatus = "verified" | "pending" | "rejected" | "suspended";

export default function MerchantRowMenu({
  open,
  anchor,
  status,
  onClose,
  onViewProfile,
  onUpgrade,
  onViewDocs,
  onSuspend,
  onActivate,
  onApprove,
  onReject,
}: {
  open: boolean;
  anchor: { top: number; left: number } | null;
  status: MerchantStatus;
  onClose: () => void;
  // actions
  onViewProfile: () => void;
  onUpgrade: () => void;
  onViewDocs: () => void;
  onSuspend: () => void;
  onActivate: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  if (!open || !anchor) return null;

  // Common button
  const Row = ({
    children,
    danger = false,
    onClick,
  }: {
    children: React.ReactNode;
    danger?: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={() => {
        onClick();
        onClose();
      }}
      className={`w-full text-left px-4 py-3 rounded-xl ${
        danger ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "bg-slate-50 text-slate-900 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );

  // 3 options depending on status
  const content = (() => {
    switch (status) {
      case "verified":
        return (
          <>
            <Row onClick={onViewProfile}>View profile</Row>
            <Row onClick={onUpgrade}>Upgrade merchant</Row>
            <Row danger onClick={onSuspend}>Suspend Merchant</Row>
          </>
        );
      case "suspended":
        return (
          <>
            <Row onClick={onViewProfile}>View profile</Row>
            <Row onClick={onUpgrade}>Upgrade merchant</Row>
            <Row danger onClick={onActivate}>Activate merchant</Row>
          </>
        );
      case "pending":
        return (
          <>
            <Row onClick={onViewDocs}>View Docs</Row>
            <Row onClick={onApprove}>Approve merchant</Row>
            {/* per your latest instruction: last is Activate */}
            <Row danger onClick={onActivate}>Activate merchant</Row>
          </>
        );
      case "rejected":
        return (
          <>
            <Row onClick={onViewProfile}>View profile</Row>
            <Row onClick={onUpgrade}>Upgrade merchant</Row>
            <Row danger onClick={onApprove}>Approve merchant</Row>
          </>
        );
    }
  })();

  return (
    <div
      className="fixed z-[140] w-[320px] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
      style={{ top: anchor.top, left: anchor.left }}
    >
      {content}
    </div>
  );
}
