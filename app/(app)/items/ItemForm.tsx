import Link from "next/link";
import { ITEM_CATEGORIES } from "@/lib/constants";

type ItemValues = {
  id?: string;
  name?: string;
  nameAr?: string | null;
  sku?: string | null;
  category?: string | null;
  unit?: string;
  costPrice?: number;
  salePrice?: number;
  stockQty?: number;
  reorderLevel?: number;
  trackStock?: boolean;
  active?: boolean;
  description?: string | null;
  descriptionAr?: string | null;
  imageUrl?: string | null;
  storefrontVisible?: boolean;
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
        <div className="col-span-2">
          <label className="label">Name (Arabic)</label>
          <input
            name="nameAr"
            dir="rtl"
            defaultValue={values.nameAr ?? ""}
            className="input"
            placeholder="الاسم بالعربية — يظهر عند التصفح بالعربية"
          />
        </div>
        <div>
          <label className="label">SKU</label>
          <input name="sku" defaultValue={values.sku ?? ""} className="input" />
        </div>
        <div>
          <label className="label">Category</label>
          <input
            name="category"
            list="item-categories"
            defaultValue={values.category ?? ""}
            className="input"
            placeholder="Pick from list or type your own…"
            autoComplete="off"
          />
          <datalist id="item-categories">
            {ITEM_CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
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

      <div className="card grid grid-cols-2 gap-4 p-6">
        <div className="col-span-2">
          <h3 className="mb-1 text-sm font-semibold">Online store</h3>
          <p className="text-xs text-zinc-500">
            Only items marked visible show up on the customer storefront
            (/shop).
          </p>
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
            placeholder="Shown on the product page"
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
            placeholder="يظهر عند التصفح بالعربية"
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
