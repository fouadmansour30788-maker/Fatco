"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { createSale } from "./actions";
import { PAYMENT_METHODS } from "@/lib/constants";

type RewardOpt = { id: string; description: string; value: number };
type CustomerOpt = {
  id: string;
  name: string;
  vehicles: { id: string; label: string }[];
  rewards: RewardOpt[];
};
type ItemOpt = { id: string; name: string; salePrice: number };
type ServiceOpt = { id: string; name: string };

type Line = {
  uid: string;
  kind: "item" | "service" | "custom";
  refId?: string;
  description: string;
  qty: number;
  unitPrice: number;
};

let _uid = 0;
const nextUid = () => `l${_uid++}`;

export default function PosForm({
  customers,
  items,
  services,
}: {
  customers: CustomerOpt[];
  items: ItemOpt[];
  services: ServiceOpt[];
}) {
  const [customerId, setCustomerId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [discount, setDiscount] = useState(0);
  const [redeemIds, setRedeemIds] = useState<string[]>([]);

  const customer = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId]
  );
  const vehicles = customer?.vehicles ?? [];
  const rewards = customer?.rewards ?? [];

  const rewardDiscount = rewards
    .filter((r) => redeemIds.includes(r.id))
    .reduce((s, r) => s + r.value, 0);

  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const total = Math.max(0, subtotal - (discount || 0) - rewardDiscount);

  function toggleRedeem(id: string) {
    setRedeemIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );
  }

  function addFromPicker(value: string) {
    if (!value) return;
    if (value === "custom") {
      setLines((ls) => [
        ...ls,
        { uid: nextUid(), kind: "custom", description: "", qty: 1, unitPrice: 0 },
      ]);
      return;
    }
    const [kind, id] = value.split(":");
    if (kind === "item") {
      const it = items.find((i) => i.id === id);
      if (it)
        setLines((ls) => [
          ...ls,
          {
            uid: nextUid(),
            kind: "item",
            refId: it.id,
            description: it.name,
            qty: 1,
            unitPrice: it.salePrice,
          },
        ]);
    } else if (kind === "service") {
      const sv = services.find((s) => s.id === id);
      if (sv)
        setLines((ls) => [
          ...ls,
          {
            uid: nextUid(),
            kind: "service",
            refId: sv.id,
            description: sv.name,
            qty: 1,
            unitPrice: 0,
          },
        ]);
    }
  }

  function update(uid: string, patch: Partial<Line>) {
    setLines((ls) => ls.map((l) => (l.uid === uid ? { ...l, ...patch } : l)));
  }
  function remove(uid: string) {
    setLines((ls) => ls.filter((l) => l.uid !== uid));
  }

  const serialized = JSON.stringify(
    lines.map(({ kind, refId, description, qty, unitPrice }) => ({
      kind,
      refId,
      description,
      qty,
      unitPrice,
    }))
  );

  return (
    <form action={createSale} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <input type="hidden" name="lines" value={serialized} />
      <input type="hidden" name="redeemRewardIds" value={JSON.stringify(redeemIds)} />

      {/* Line items */}
      <div className="card p-5 lg:col-span-2">
        <div className="mb-4 flex items-center gap-3">
          <select
            className="input max-w-xs"
            value=""
            onChange={(e) => {
              addFromPicker(e.target.value);
              e.target.value = "";
            }}
          >
            <option value="">+ Add item or service…</option>
            <optgroup label="Items">
              {items.map((i) => (
                <option key={i.id} value={`item:${i.id}`}>
                  {i.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Services">
              {services.map((s) => (
                <option key={s.id} value={`service:${s.id}`}>
                  {s.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Other">
              <option value="custom">Custom line…</option>
            </optgroup>
          </select>
        </div>

        {lines.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400">
            No lines yet — add items or services above.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-zinc-400">
                <th className="pb-2 font-medium">Description</th>
                <th className="pb-2 text-right font-medium">Qty</th>
                <th className="pb-2 text-right font-medium">Price</th>
                <th className="pb-2 text-right font-medium">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.uid} className="border-t border-zinc-100">
                  <td className="py-2 pr-2">
                    <input
                      className="w-full rounded border border-zinc-200 px-2 py-1"
                      value={l.description}
                      placeholder="Description"
                      onChange={(e) =>
                        update(l.uid, { description: e.target.value })
                      }
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      step="any"
                      className="w-16 rounded border border-zinc-200 px-2 py-1 text-right"
                      value={l.qty}
                      onChange={(e) =>
                        update(l.uid, { qty: Number(e.target.value) })
                      }
                    />
                  </td>
                  <td className="py-2 pl-2">
                    <input
                      type="number"
                      step="any"
                      className="w-20 rounded border border-zinc-200 px-2 py-1 text-right"
                      value={l.unitPrice}
                      onChange={(e) =>
                        update(l.uid, { unitPrice: Number(e.target.value) })
                      }
                    />
                  </td>
                  <td className="py-2 text-right font-medium">
                    ${(l.unitPrice * l.qty).toFixed(2)}
                  </td>
                  <td className="py-2 pl-2 text-right">
                    <button
                      type="button"
                      onClick={() => remove(l.uid)}
                      className="text-zinc-400 hover:text-brand"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Sidebar: customer + totals */}
      <div className="space-y-6">
        <div className="card space-y-3 p-5">
          <h3 className="text-sm font-semibold text-zinc-700">Customer</h3>
          <div>
            <label className="label">Customer</label>
            <select
              name="customerId"
              className="input"
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                setVehicleId("");
                setRedeemIds([]);
              }}
            >
              <option value="">Walk-in (no account)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          {vehicles.length > 0 && (
            <div>
              <label className="label">Vehicle</label>
              <select
                name="vehicleId"
                className="input"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
              >
                <option value="">—</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {rewards.length > 0 && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <div className="mb-2 text-xs font-semibold text-emerald-700">
                🎁 Available rewards
              </div>
              <div className="space-y-1.5">
                {rewards.map((r) => (
                  <label
                    key={r.id}
                    className="flex items-center gap-2 text-sm text-emerald-900"
                  >
                    <input
                      type="checkbox"
                      checked={redeemIds.includes(r.id)}
                      onChange={() => toggleRedeem(r.id)}
                    />
                    <span className="flex-1">{r.description}</span>
                    <span className="font-medium">−${r.value.toFixed(2)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="label">Mileage at service (km)</label>
            <input name="mileage" type="number" className="input" />
          </div>
          <div>
            <label className="label">Payment method</label>
            <select name="paymentMethod" className="input" defaultValue="CASH">
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Notes</label>
            <input name="notes" className="input" />
          </div>
        </div>

        <div className="card space-y-2 p-5 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Subtotal</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Discount</span>
            <input
              name="discount"
              type="number"
              step="any"
              className="w-24 rounded border border-zinc-200 px-2 py-1 text-right"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
            />
          </div>
          {rewardDiscount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Reward redeemed</span>
              <span>−${rewardDiscount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-semibold">
            <span>Total</span>
            <span className="text-brand">${total.toFixed(2)}</span>
          </div>
          <button
            type="submit"
            disabled={lines.length === 0}
            className="btn-brand mt-3 w-full"
          >
            Complete sale
          </button>
        </div>
      </div>
    </form>
  );
}
