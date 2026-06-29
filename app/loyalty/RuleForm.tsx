"use client";

import { useState } from "react";
import { createRule } from "./actions";

type ServiceOpt = { id: string; name: string };

export default function RuleForm({ services }: { services: ServiceOpt[] }) {
  const [type, setType] = useState<"PUNCH_CARD" | "POINTS_PER_AMOUNT">(
    "PUNCH_CARD"
  );

  return (
    <form action={createRule} className="space-y-3">
      <div>
        <label className="label">Rule type</label>
        <select
          name="type"
          className="input"
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
        >
          <option value="PUNCH_CARD">Punch card (e.g. 5 → 1 free)</option>
          <option value="POINTS_PER_AMOUNT">Points per amount spent</option>
        </select>
      </div>

      <div>
        <label className="label">Name</label>
        <input
          name="name"
          required
          className="input"
          placeholder="e.g. Oil Change Punch Card"
        />
      </div>

      <div>
        <label className="label">Reward description</label>
        <input
          name="rewardDescription"
          className="input"
          placeholder="e.g. 1 free oil change"
        />
      </div>

      {type === "PUNCH_CARD" ? (
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-3">
            <label className="label">Qualifying service</label>
            <select name="serviceTypeId" className="input">
              <option value="">Any service</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Threshold</label>
            <input
              name="threshold"
              type="number"
              className="input"
              placeholder="5"
            />
          </div>
          <div className="col-span-2">
            <label className="label">Reward value ($ off)</label>
            <input
              name="rewardValue"
              type="number"
              step="any"
              className="input"
              placeholder="e.g. 40"
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="label">Points per $1 spent</label>
          <input
            name="pointsPerAmount"
            type="number"
            step="any"
            className="input"
            placeholder="1"
          />
        </div>
      )}

      <button type="submit" className="btn-brand w-full">
        Add rule
      </button>
    </form>
  );
}
