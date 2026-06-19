"use client";
import * as React from "react";
import { Rider } from "@/lib/riders";
import Lightbox from "./PhotoLightbox";

export default function RiderDocumentsModal({
  open,
  onClose,
  rider,
  onApprove,
  onReject,
}: {
  open: boolean;
  onClose: () => void;
  rider?: Rider;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [lightbox, setLightbox] = React.useState<string | null>(null);
  if (!open || !rider) return null;

  const docs = rider.documents || [];
  const primaryDoc = docs.find((d) => String(d.type || "").toLowerCase().includes("lic")) || docs[0];

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative w-[540px] rounded-2xl bg-white shadow-xl overflow-hidden">
          <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 h-8 w-8 rounded-full grid place-items-center text-gray-500 hover:bg-gray-100">×</button>

          <div className="px-6 pt-6 pb-2">
            <h3 className="text-[24px] font-semibold text-gray-900 text-center">Documents</h3>
            <div className="mt-4 grid grid-cols-2 gap-4 text-[14px] text-[#0B1E5B]">
              <div className="text-left">
                <div className="font-medium">{rider.city ?? "—"}, {rider.area ?? "—"}</div>
                <div className="mt-1">{rider.address ?? "—"}</div>
              </div>
              <div className="text-right font-medium">{rider.phoneNumber}</div>
            </div>
          </div>

          <div className="px-6 pt-4">
            <div className="rounded-2xl border border-gray-200 bg-white">
              <div className="px-5 pt-4 pb-3 text-center font-semibold text-gray-900">{primaryDoc?.type || "Drivers Licence"}</div>
              <div className="px-5 pb-5 flex justify-center">
                {primaryDoc?.url ? (
                  <button type="button" onClick={() => setLightbox(primaryDoc.url)} className="h-[140px] w-[220px] rounded-lg overflow-hidden bg-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={primaryDoc.url} alt={primaryDoc.type || "Rider document"} className="h-full w-full object-cover" />
                  </button>
                ) : (
                  <div className="h-[140px] w-[220px] rounded-lg bg-gray-200 grid place-items-center text-gray-600 text-sm">No file</div>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 pt-5 pb-6 space-y-3">
            <button onClick={() => { onApprove(); onClose(); }} className="h-11 w-full rounded-xl bg-[#233A78] text-white font-semibold">Approve</button>
            <button onClick={() => { onReject(); onClose(); }} className="h-11 w-full rounded-xl bg-white border text-gray-700">Reject</button>
          </div>
        </div>
      </div>
      <Lightbox open={!!lightbox} src={lightbox || ""} onClose={() => setLightbox(null)} />
    </>
  );
}
