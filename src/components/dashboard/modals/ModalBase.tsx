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
  ariaLabel = "Dialog",
}: {
  open: boolean;
  onClose: () => void;
  width?: number;
  z?: number;
  children: React.ReactNode;
  hideClose?: boolean;
  ariaLabel?: string;
}) {
  const [mounted, setMounted] = React.useState(false);
  const [el] = React.useState(() => document.createElement("div"));
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const closeRef = React.useRef(onClose);
  React.useEffect(() => { closeRef.current = onClose; }, [onClose]);

  React.useEffect(() => {
    setMounted(true);
    el.setAttribute("data-portal", "modal");
    document.body.appendChild(el);
    return () => {
      document.body.removeChild(el);
    };
  }, [el]);

  React.useEffect(() => {
    if (!open || !mounted) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusable = () => Array.from(panel?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) || []);
    (focusable()[0] || panel)?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) {
        event.preventDefault();
        panel?.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open, mounted]);

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
      aria-label={ariaLabel}
      ref={panelRef}
      tabIndex={-1}
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
