"use client";
import * as React from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import ModalBase from "./ModalBase";
import type { Merchant } from "@/lib/merchants";
import { formatDate, formatNaira } from "@/lib/api";

const Pill = ({ children }: { children: React.ReactNode }) => (
  <div className="inline-flex items-center gap-2 h-9 px-3 rounded-full border border-gray-200 bg-white text-sm">
    {children}
  </div>
);

export default function MerchantProfileModal({
  open,
  onClose,
  merchant,
  onPrimaryAction,
}: {
  open: boolean;
  onClose: () => void;
  merchant?: Merchant;
  onPrimaryAction: () => void; // opens stacked confirm
}) {
  const [openIdx, setOpenIdx] = React.useState<0 | 1 | 2>(0);
  const [month, setMonth] = React.useState("January");
  const [year, setYear] = React.useState("2025");
  if (!open || !merchant) return null;

  const isSuspended = merchant.status === "suspended";
  const displayName = (merchant as any).businessName || (merchant as any).fullName || "—";
  const tier = (merchant as any).serviceTier || (merchant as any).vehicle || "—";
  const activity = (merchant as any).orders || (merchant as any).deliveries || {};
  const joinedOn = formatDate((merchant as any).raw?.createdAt || (merchant as any).createdAt);
  const Tab = ({ active, label }: { active: boolean; label: string }) => (
    <button
      className={`relative pb-2 text-sm ${
        active ? "text-[#0B1E5B] font-medium" : "text-gray-500"
      }`}
    >
      {label}
      {active && (
        <span className="absolute -bottom-[1px] left-0 right-0 mx-auto h-[2px] w-20 bg-[#0B1E5B] rounded-full" />
      )}
    </button>
  );

  const Section = ({
    i,
    title,
    children,
  }: {
    i: 0 | 1 | 2;
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="rounded-xl border border-gray-200 bg-white">
      <button
        onClick={() => setOpenIdx(i)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <span className="text-[15px] font-medium text-gray-900">{title}</span>
        <span
          className={`text-gray-500 transition-transform ${
            openIdx === i ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>
      {openIdx === i && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );

  return (
    <ModalBase open={open} onClose={onClose} width={660} z={100}>
      <div className="px-6 pt-6 pb-5">
        <h3 className="text-[22px] leading-6 font-semibold text-gray-900 text-center">
          User Profile
        </h3>

        {/* Tabs */}
        <div className="mt-5 flex items-center justify-center gap-10">
          <Tab active label="Business" />
          <Tab active={false} label="Personal" />
        </div>

        {/* Two-column summary */}
        <div className="mt-6 grid grid-cols-2 gap-4 text-[14px]">
          <div>
            <div className="font-medium text-gray-900">
              {displayName}
            </div>
            <div className="text-gray-500">{merchant.address || merchant.city || "—"}</div>
          </div>
          <div className="text-right">
            <div className="text-gray-900">{tier}</div>
            <div className="text-gray-500">{tier}</div>
          </div>

          <div className="flex items-center gap-2 text-gray-700">
            <MapPin className="h-4 w-4" />
            {merchant.city || merchant.address || "—"}
          </div>
          <div className="flex items-center justify-end gap-2 text-gray-700">
            <Phone className="h-4 w-4" />
            {merchant.phoneNumber}
            <span className="mx-1 text-gray-400">•</span>
            <span className="text-gray-600">Joined on {joinedOn}</span>
          </div>

          <div className="col-span-2 flex items-center gap-2 text-[#0B1E5B]">
            <Mail className="h-4 w-4" />
            <a
              href={`mailto:${merchant.email}`}
              className="hover:underline break-all"
            >
              {merchant.email}
            </a>
          </div>
        </div>

        {/* Sections */}
        <div className="mt-6 space-y-3">
          <Section i={0} title="Earnings Details">
            <div className="flex items-center gap-2 mb-3">
              <Pill>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="outline-none bg-transparent"
                >
                  {[
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                  ].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </Pill>
              <Pill>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="outline-none bg-transparent"
                >
                  {["2024", "2025", "2026"].map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
              </Pill>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                ["Today's Earnings", formatNaira((merchant as any).earnings?.today)],
                ["This week Earnings", formatNaira((merchant as any).earnings?.thisWeek)],
                ["Today's order", String(activity?.today ?? 0)],
                ["This week orders", String(activity?.thisWeek ?? 0)],
                ["Total earnings for this month", formatNaira((merchant as any).earnings?.thisMonth)],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-3"
                >
                  <div className="text-[12px] text-gray-500">{k}</div>
                  <div className="mt-1 text-[18px] font-semibold text-gray-900">
                    {v}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section i={1} title="Withdrawal Details">
            <div className="flex items-center gap-2 mb-3">
              <Pill>January ▾</Pill>
              <Pill>2025 ▾</Pill>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-200 px-3 py-3">
                <div className="text-[12px] text-gray-500">
                  This week withdrawal
                </div>
                <div className="mt-1 text-[18px] font-semibold text-gray-900">
{formatNaira((merchant as any).withdrawals?.thisWeek)}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 px-3 py-3">
                <div className="text-[12px] text-gray-500">
                  Withdrawal for this month
                </div>
                <div className="mt-1 text-[18px] font-semibold text-gray-900">
{formatNaira((merchant as any).withdrawals?.thisMonth)}
                </div>
              </div>
            </div>
          </Section>

          <Section i={2} title="Uploaded Docs">
            <div className="rounded-2xl border border-gray-200 p-4">
              <div className="text-center font-semibold text-gray-900">
                {(merchant.documents || [])[0]?.type || "CAC Doc"}
              </div>
              <div className="mt-3 flex justify-center">
                {(merchant.documents || [])[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={(merchant.documents || [])[0].url} alt={(merchant.documents || [])[0].type || "Document"} className="h-[118px] w-[210px] rounded-lg object-cover bg-gray-200" />
                ) : (
                  <div className="h-[118px] w-[210px] rounded-lg bg-gray-200 grid place-items-center text-gray-600 text-sm">
                    No file
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 rounded-2xl border border-gray-200 p-4">
              <div className="text-center font-semibold text-gray-900">
                Store Images
              </div>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {((merchant.documents || []).slice(1, 6).length ? (merchant.documents || []).slice(1, 6) : Array.from({ length: 5 }).map((_, i) => ({ id: `empty-${i}`, url: "" } as any))).map((doc: any, i: number) => (
                  doc.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={doc.id || i} src={doc.url} alt={doc.type || "Document"} className="h-[68px] rounded-lg bg-gray-200 object-cover" />
                  ) : (
                    <div key={doc.id || i} className="h-[68px] rounded-lg bg-gray-200 grid place-items-center text-gray-600 text-xs">No file</div>
                  )
                ))}
              </div>
            </div>
          </Section>
        </div>

        {/* Primary */}
        <div className="mt-6">
          <button
            onClick={onPrimaryAction}
            className={`w-full h-12 rounded-xl font-semibold text-white ${
              isSuspended ? "bg-[#233A78]" : "bg-[#0B1E5B]"
            }`}
          >
            {isSuspended ? "Activate" : "Suspend"}
          </button>
        </div>
      </div>
    </ModalBase>
  );
}
