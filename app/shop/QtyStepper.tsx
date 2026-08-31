"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

export default function QtyStepper({
  name = "qty",
  min = 1,
  max,
  defaultValue = 1,
}: {
  name?: string;
  min?: number;
  max?: number;
  defaultValue?: number;
}) {
  const [qty, setQty] = useState(defaultValue);
  const clamp = (n: number) => {
    if (!Number.isFinite(n)) return min;
    const lower = Math.max(min, n);
    return max ? Math.min(max, lower) : lower;
  };

  return (
    <div className="inline-flex items-center rounded-lg border border-zinc-300">
      <button
        type="button"
        onClick={() => setQty((q) => clamp(q - 1))}
        className="px-3 py-2 text-zinc-600 hover:text-brand disabled:opacity-40"
        disabled={qty <= min}
        aria-label="Decrease quantity"
      >
        <Minus size={14} />
      </button>
      <input
        type="number"
        name={name}
        value={qty}
        min={min}
        max={max}
        onChange={(e) => setQty(clamp(Number(e.target.value)))}
        className="w-10 border-0 bg-transparent text-center text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => setQty((q) => clamp(q + 1))}
        className="px-3 py-2 text-zinc-600 hover:text-brand disabled:opacity-40"
        disabled={max !== undefined && qty >= max}
        aria-label="Increase quantity"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
