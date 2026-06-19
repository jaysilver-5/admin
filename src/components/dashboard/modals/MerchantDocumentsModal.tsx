"use client";
import * as React from "react";
import { MapPin, Phone } from "lucide-react";
import ModalBase from "./ModalBase";
import Lightbox from "./PhotoLightbox";
import type { Merchant } from "@/lib/merchants";

export default function MerchantDocumentsModal({
  open,
  onClose,
  merchant,
  onApprove,
  onReject,
}: {
  open: boolean;
  onClose: () => void;
  merchant?: Merchant;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [lightbox, setLightbox] = React.useState<string | null>(null);
  if (!open || !merchant) return null;

  const docs = merchant.documents || [];
  const primaryDoc = docs.find((d) => String(d.type || "").toLowerCase().includes("cac")) || docs[0];
  const otherDocs = docs.filter((d) => d.id !== primaryDoc?.id);

  const DocTile = ({ url, label, small = false }: { url?: string; label: string; small?: boolean }) => (
    <button
      className={`relative rounded-lg bg-gray-200 overflow-hidden ${small ? "h-[76px]" : "h-[140px] w-[220px]"}`}
      onClick={() => url && setLightbox(url)}
      type="button"
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={label} className="h-full w-full object-cover" />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-gray-600 text-sm">No file</span>
      )}
    </button>
  );

  return (
    <>
      <ModalBase open={open} onClose={onClose} width={540} z={100}>
        <div className="px-6 pt-6 pb-5">
          <h3 className="text-[24px] font-semibold text-gray-900 text-center">Documents</h3>

          <div className="mt-4 flex items-center justify-center gap-8 text-[14px]">
            <div className="flex items-center gap-2 text-blue-900">
              <MapPin className="h-4 w-4" />
              <span className="font-medium">{merchant.businessName}, {merchant.city ?? "—"}</span>
            </div>
            <a className="flex items-center gap-2 text-blue-700 hover:underline" href={`tel:${merchant.phoneNumber}`}>
              <Phone className="h-4 w-4" />
              {merchant.phoneNumber}
            </a>
          </div>

          <div className="mt-5 grid grid-cols-2 rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 text-center text-gray-500 bg-gray-50">Service Requesting</div>
            <div className="px-4 py-3 text-center font-medium text-gray-900">{merchant.serviceTier ?? "Merchant"}</div>
          </div>

          <div className="mt-5 rounded-2xl border border-gray-200 p-5">
            <div className="text-center font-semibold text-gray-900">{primaryDoc?.type || "CAC Doc"}</div>
            <div className="mt-4 flex justify-center">
              <DocTile url={primaryDoc?.url} label={primaryDoc?.type || "Document"} />
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-gray-200 p-5">
            <div className="text-center font-semibold text-gray-900">Store Images / Other Docs</div>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {(otherDocs.length ? otherDocs : Array.from({ length: 5 }).map((_, i) => ({ id: `empty-${i}`, url: undefined, type: "No file" }))).slice(0, 5).map((doc: any) => (
                <DocTile key={doc.id} url={doc.url} label={doc.type || "Document"} small />
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button onClick={() => { onApprove(); onClose(); }} className="h-11 rounded-xl bg-[#233A78] text-white font-semibold">
              Approve
            </button>
            <button onClick={() => { onReject(); onClose(); }} className="h-11 rounded-xl bg-white text-gray-700 border">
              Reject
            </button>
          </div>
        </div>
      </ModalBase>

      <Lightbox open={!!lightbox} src={lightbox || ""} onClose={() => setLightbox(null)} />
    </>
  );
}
