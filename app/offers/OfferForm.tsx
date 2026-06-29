import Link from "next/link";

type OfferValues = {
  id?: string;
  name?: string;
  description?: string | null;
  discountType?: string;
  discountValue?: number;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  active?: boolean;
};

function toInputDate(v: Date | string | null | undefined): string {
  if (!v) return "";
  const d = typeof v === "string" ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function OfferForm({
  action,
  values = {},
  isEdit = false,
}: {
  action: (formData: FormData) => void;
  values?: OfferValues;
  isEdit?: boolean;
}) {
  return (
    <form action={action} className="max-w-2xl space-y-6">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <div className="card space-y-4 p-6">
        <div>
          <label className="label">Offer name *</label>
          <input
            name="name"
            required
            defaultValue={values.name ?? ""}
            className="input"
            placeholder="e.g. Summer Tyre Deal"
          />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            name="description"
            rows={2}
            defaultValue={values.description ?? ""}
            className="input"
            placeholder="e.g. 10% off all tyres"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Discount type</label>
            <select
              name="discountType"
              defaultValue={values.discountType ?? "PERCENT"}
              className="input"
            >
              <option value="PERCENT">Percent (%)</option>
              <option value="AMOUNT">Fixed amount ($)</option>
            </select>
          </div>
          <div>
            <label className="label">Discount value</label>
            <input
              name="discountValue"
              type="number"
              step="any"
              min="0"
              required
              defaultValue={values.discountValue ?? ""}
              className="input"
              placeholder="e.g. 10"
            />
          </div>
          <div>
            <label className="label">Start date</label>
            <input
              name="startDate"
              type="date"
              defaultValue={toInputDate(values.startDate)}
              className="input"
            />
          </div>
          <div>
            <label className="label">End date</label>
            <input
              name="endDate"
              type="date"
              defaultValue={toInputDate(values.endDate)}
              className="input"
            />
          </div>
        </div>
        {isEdit && (
          <label className="flex items-center gap-2 text-sm text-zinc-600">
            <input type="checkbox" name="active" defaultChecked={values.active ?? true} />
            Active
          </label>
        )}
      </div>

      <div className="flex gap-3">
        <button type="submit" className="btn-brand">
          {isEdit ? "Save changes" : "Create offer"}
        </button>
        <Link href="/offers" className="btn-ghost">
          Cancel
        </Link>
      </div>
    </form>
  );
}
