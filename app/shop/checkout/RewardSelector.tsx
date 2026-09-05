"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/format";

export default function RewardSelector({
  rewards,
  subtotal,
  label,
  noneLabel,
  discountLabel,
  totalLabel,
}: {
  rewards: { id: string; description: string; value: number }[];
  subtotal: number;
  label: string;
  noneLabel: string;
  discountLabel: string;
  totalLabel: string;
}) {
  const [rewardId, setRewardId] = useState("");
  const reward = rewards.find((r) => r.id === rewardId);
  const discount = reward?.value ?? 0;
  const total = Math.max(0, subtotal - discount);

  return (
    <div>
      <label className="label">{label}</label>
      <select
        name="redeemRewardId"
        value={rewardId}
        onChange={(e) => setRewardId(e.target.value)}
        className="input"
      >
        <option value="">{noneLabel}</option>
        {rewards.map((r) => (
          <option key={r.id} value={r.id}>
            {r.description} — {formatMoney(r.value)}
          </option>
        ))}
      </select>

      {reward && (
        <div className="mt-2 flex justify-between text-sm text-emerald-700">
          <span>{discountLabel}</span>
          <span>-{formatMoney(discount)}</span>
        </div>
      )}
      <div className="mt-1 flex justify-between text-sm font-semibold">
        <span>{totalLabel}</span>
        <span>{formatMoney(total)}</span>
      </div>
    </div>
  );
}
