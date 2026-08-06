"use client";

import { useState } from "react";
import { ScanLine } from "lucide-react";
import { ScannerModal } from "./ScannerModal";

export function ScanButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Scan a barcode"
        title="Scan a Hoosa barcode"
        className={
          className ??
          "inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:text-brand"
        }
      >
        <ScanLine size={18} />
      </button>
      {open && <ScannerModal onClose={() => setOpen(false)} />}
    </>
  );
}
