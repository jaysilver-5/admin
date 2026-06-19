"use client";
import * as React from "react";

export default function PhotoLightbox({ open, src, onClose }: { open: boolean; src: string; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] bg-black/70 grid place-items-center" onClick={onClose}>
      <img src={src} alt="" className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-2xl" />
    </div>
  );
}
