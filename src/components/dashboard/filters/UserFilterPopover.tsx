"use client";
import * as React from "react";
import { Check } from "lucide-react";
import type { UserStatus } from "@/lib/users";

type Props = {
  open: boolean;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  initial: {
    recentlyLogin?: boolean;
    statuses: UserStatus[];
    rejected?: boolean;
  };
  onClose: () => void;
  onApply: (next: Props["initial"]) => void;
};

export default function UserFilterPopover({ open, anchorRef, initial, onClose, onApply }: Props) {
  const [state, setState] = React.useState(initial);

  React.useEffect(() => {
    if (open) setState(initial);
  }, [open, initial]);

  if (!open) return null;

  // simple anchor positioning
  const anchor = anchorRef.current?.getBoundingClientRect();
  const style: React.CSSProperties = anchor
    ? { position: "fixed", top: anchor.bottom + 8, left: anchor.right - 240 } // width 240
    : {};

  const toggle = (key: "recentlyLogin" | "rejected") =>
    setState((s) => ({ ...s, [key]: !s[key] }));

  const toggleStatus = (st: UserStatus) =>
    setState((s) => {
      const exists = s.statuses.includes(st);
      return { ...s, statuses: exists ? s.statuses.filter((x) => x !== st) : [...s.statuses, st] };
    });

  const allChecked =
    state.recentlyLogin === true &&
    ["verified", "pending", "suspended"].every((s) => state.statuses.includes(s as UserStatus)) &&
    state.rejected === true;

  const setAll = (v: boolean) =>
    setState({
      recentlyLogin: v,
      statuses: v ? ["verified", "pending", "suspended"] : [],
      rejected: v,
    });

  const Row = ({
    checked,
    label,
    onClick,
  }: {
    checked: boolean;
    label: string;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50"
    >
      <span
        className={`h-5 w-5 rounded border grid place-items-center ${
          checked ? "bg-[#233A78] border-[#233A78]" : "border-gray-300 bg-white"
        }`}
      >
        {checked && <Check className="h-3.5 w-3.5 text-white" />}
      </span>
      <span className="text-sm text-gray-800">{label}</span>
    </button>
  );

  return (
    <div
      style={style}
      className="w-[240px] h-[300px] rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden z-50"
    >
      <div className="p-2 overflow-y-auto h-[252px] space-y-1">
        <Row checked={allChecked} label="Select all filter category" onClick={() => setAll(!allChecked)} />
        <div className="h-px bg-gray-200 my-1" />
        <Row checked={!!state.recentlyLogin} label="Recently Login" onClick={() => toggle("recentlyLogin")} />
        <Row checked={state.statuses.includes("verified")} label="Verified" onClick={() => toggleStatus("verified")} />
        <Row checked={state.statuses.includes("pending")} label="Pending" onClick={() => toggleStatus("pending")} />
        <Row checked={state.statuses.includes("suspended")} label="Suspended Merchant" onClick={() => toggleStatus("suspended")} />
        <Row checked={!!state.rejected} label="Rejected" onClick={() => toggle("rejected")} />
      </div>
      <div className="h-[48px] border-t border-gray-200 px-3 flex items-center justify-end gap-2">
        <button onClick={onClose} className="h-9 px-4 rounded-md border border-gray-300 text-sm text-gray-700 bg-white hover:bg-gray-50">
          Cancel
        </button>
        <button
          onClick={() => onApply(state)}
          className="h-9 px-4 rounded-md bg-[#233A78] text-white text-sm hover:brightness-110"
        >
          Done
        </button>
      </div>
    </div>
  );
}
