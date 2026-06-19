"use client";
import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function ModalBase({
  open,
  onClose,
  width = 600,
  z = 100, // <— stack level (confirm will pass a higher one)
  children,
  hideClose = false,
}: {
  open: boolean;
  onClose: () => void;
  width?: number;
  z?: number;
  children: React.ReactNode;
  hideClose?: boolean;
}) {
  const [mounted, setMounted] = React.useState(false);
  const [el] = React.useState(() => document.createElement("div"));

  React.useEffect(() => {
    setMounted(true);
    el.setAttribute("data-portal", "modal");
    document.body.appendChild(el);
    return () => {
      document.body.removeChild(el);
    };
  }, [el]);

  if (!open || !mounted) return null;

  const backdrop = (
    <div
      className={`fixed inset-0 bg-black/50 transition-opacity`}
      style={{ zIndex: z }}
      onClick={onClose}
    />
  );

  const panel = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: z + 1 }}
      aria-modal
      role="dialog"
    >
      <div
        className="relative w-full bg-white rounded-2xl shadow-2xl"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        {!hideClose && (
          <button
            className="absolute right-4 top-4 p-1 rounded hover:bg-gray-100"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        )}
        {children}
      </div>
    </div>
  );

  return createPortal(
    <>
      {backdrop}
      {panel}
    </>,
    el
  );
}
