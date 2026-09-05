"use client";

import { Printer } from "lucide-react";

export default function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn-brand no-print">
      <Printer size={16} />
      {label}
    </button>
  );
}
