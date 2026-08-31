"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";

type ItemOpt = { id: string; name: string; costPrice: number; salePrice: number };
type ComponentLine = { uid: string; itemId: string; name: string; qty: number };

let _uid = 0;
const nextUid = () => `c${_uid++}`;

type BundleValues = {
  id?: string;
  name?: string;
  nameAr?: string | null;
  sku?: string | null;
  salePrice?: number;
  description?: string | null;
  descriptionAr?: string | null;
  imageUrl?: string | null;
  storefrontVisible?: boolean;
  active?: boolean;
  components?: { itemId: string; name: string; qty: number }[];
};

export default function BundleForm({
  action,
  items,
  values = {},
  isEdit = false,
}: {
  action: (formData: FormData) => void;
  items: ItemOpt[];
  values?: BundleValues;
  isEdit?: boolean;
}) {
  const [components, setComponents] = useState<ComponentLine[]>(
    (values.components ?? []).map((c) => ({ uid: nextUid(), ...c }))
  );

  const costBasis = components.reduce((s, c) => {
    const item = items.find((i) => i.id === c.itemId);
    return s + (item?.costPrice ?? 0) * c.qty;
  }, 0);

  function addFromPicker(itemId: string) {
    if (!itemId) return;
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    setComponents((cs) => [
      ...cs,
      { uid: nextUid(), itemId: item.id, name: item.name, qty: 1 },
    ]);
  }
  function updateQty(uid: string, qty: number) {
    setComponents((cs) => cs.map((c) => (c.uid === uid ? { ...c, qty } : c)));
  }
  function remove(uid: string) {
    setComponents((cs) => cs.filter((c) => c.uid !== uid));
  }

  const serialized = JSON.stringify(
    components.map(({ itemId, qty }) => ({ itemId, qty }))
  );

  return (
    <form action={action} className="max-w-2xl space-y-6">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <input type="hidden" name="components" value={serialized} />

      <div className="card grid grid-cols-2 gap-4 p-6">
        <div className="col-span-2">
          <label className="label">Name *</label>
          <input
            name="name"
            required
            defaultValue={values.name ?? ""}
            className="input"
            placeholder="e.g. Oil Change Kit"
          />
        </div>
        <div className="col-span-2">
          <label className="label">Name (Arabic)</label>
          <input
            name="nameAr"
            dir="rtl"
            defaultValue={values.nameAr ?? ""}
            className="input"
          />
        </div>
        <div>
          <label className="label">SKU</label>
          <input name="sku" defaultValue={values.sku ?? ""} className="input" />
        </div>
        <div>
          <label className="label">Kit price</label>
          <input
            name="salePrice"
            type="number"
            step="any"
            defaultValue={values.salePrice ?? 0}
            className="input"
          />
        </div>
        {isEdit && (
          <label className="col-span-2 flex items-center gap-2 text-sm text-zinc-600">
            <input type="checkbox" name="active" defaultChecked={values.active ?? true} />
            Active
          </label>
        )}
      </div>

      <div className="card p-6">
        <h3 className="mb-1 text-sm font-semibold">Components</h3>
        <p className="mb-4 text-xs text-zinc-500">
          What&apos;s included in this kit. When an order is fulfilled, stock is
          decremented from these real items — the kit itself carries no stock.
        </p>
        <select
          className="input mb-4 max-w-xs"
          value=""
          onChange={(e) => {
            addFromPicker(e.target.value);
            e.target.value = "";
          }}
        >
          <option value="">+ Add component…</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>

        {components.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-400">No components yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-zinc-400">
                <th className="pb-2 font-medium">Item</th>
                <th className="pb-2 text-right font-medium">Qty</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {components.map((c) => (
                <tr key={c.uid} className="border-t border-zinc-100">
                  <td className="py-2">{c.name}</td>
                  <td className="py-2">
                    <input
                      type="number"
                      step="any"
                      min={0.01}
                      className="w-20 rounded border border-zinc-200 px-2 py-1 text-right"
                      value={c.qty}
                      onChange={(e) => updateQty(c.uid, Number(e.target.value))}
                    />
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => remove(c.uid)}
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
        {components.length > 0 && (
          <p className="mt-3 text-xs text-zinc-500">
            Combined cost basis: ${costBasis.toFixed(2)}
          </p>
        )}
      </div>

      <div className="card grid grid-cols-2 gap-4 p-6">
        <div className="col-span-2">
          <h3 className="mb-1 text-sm font-semibold">Online store</h3>
        </div>
        <label className="col-span-2 flex items-center gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            name="storefrontVisible"
            defaultChecked={values.storefrontVisible ?? false}
          />
          Visible on storefront
        </label>
        <div>
          <label className="label">Description</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={values.description ?? ""}
            className="input"
          />
        </div>
        <div>
          <label className="label">Description (Arabic)</label>
          <textarea
            name="descriptionAr"
            rows={3}
            dir="rtl"
            defaultValue={values.descriptionAr ?? ""}
            className="input"
          />
        </div>
        <div className="col-span-2">
          <label className="label">Image URL</label>
          <input
            name="imageUrl"
            type="url"
            defaultValue={values.imageUrl ?? ""}
            className="input"
            placeholder="https://…"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={components.length === 0}
          className="btn-brand"
        >
          {isEdit ? "Save changes" : "Create bundle"}
        </button>
        <Link href="/items" className="btn-ghost">
          Cancel
        </Link>
      </div>
    </form>
  );
}
