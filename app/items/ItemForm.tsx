import Link from "next/link";
import { ITEM_CATEGORIES } from "@/lib/constants";

type ItemValues = {
  id?: string;
  name?: string;
  sku?: string | null;
  category?: string | null;
  unit?: string;
  costPrice?: number;
  salePrice?: number;
  stockQty?: number;
  reorderLevel?: number;
  trackStock?: boolean;
  active?: boolean;
};

export default function ItemForm({
  action,
  values = {},
  isEdit = false,
}: {
  action: (formData: FormData) => void;
  values?: ItemValues;
  isEdit?: boolean;
}) {
  return (
    <form action={action} className="max-w-2xl space-y-6">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <div className="card grid grid-cols-2 gap-4 p-6">
        <div className="col-span-2">
          <label className="label">Name *</label>
          <input
            name="name"
            required
            defaultValue={values.name ?? ""}
            className="input"
            placeholder="e.g. Engine Oil 5W-30 (4L)"
          />
        </div>
        <div>
          <label className="label">SKU</label>
          <input name="sku" defaultValue={values.sku ?? ""} className="input" />
        </div>
        <div>
          <label className="label">Category</label>
          <select
            name="category"
            defaultValue={values.category ?? "OTHER"}
            className="input"
          >
            {ITEM_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Unit</label>
          <input
            name="unit"
            defaultValue={values.unit ?? "pcs"}
            className="input"
          />
        </div>
        <div>
          <label className="label">Reorder Level - Minimum Stock</label>
          <input
            name="reorderLevel"
            type="number"
            step="any"
            defaultValue={values.reorderLevel ?? 0}
            className="input"
          />
        </div>
        <div>
          <label className="label">Cost price</label>
          <input
            name="costPrice"
            type="number"
            step="any"
            defaultValue={values.costPrice ?? 0}
            className="input"
          />
        </div>
        <div>
          <label className="label">Sale price</label>
          <input
            name="salePrice"
            type="number"
            step="any"
            defaultValue={values.salePrice ?? 0}
            className="input"
          />
        </div>
        {!isEdit && (
          <div>
            <label className="label">Opening stock</label>
            <input
              name="stockQty"
              type="number"
              step="any"
              defaultValue={values.stockQty ?? 0}
              className="input"
            />
          </div>
        )}
        <label className="col-span-2 flex items-center gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            name="trackStock"
            defaultChecked={values.trackStock ?? true}
          />
          Track stock (uncheck for labor / services)
        </label>
        {isEdit && (
          <label className="col-span-2 flex items-center gap-2 text-sm text-zinc-600">
            <input
              type="checkbox"
              name="active"
              defaultChecked={values.active ?? true}
            />
            Active
          </label>
        )}
      </div>

      <div className="flex gap-3">
        <button type="submit" className="btn-brand">
          {isEdit ? "Save changes" : "Create item"}
        </button>
        <Link href="/items" className="btn-ghost">
          Cancel
        </Link>
      </div>
    </form>
  );
}
