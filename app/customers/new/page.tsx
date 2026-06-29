import Link from "next/link";
import { createCustomer } from "../actions";
import PageHeader from "../../components/PageHeader";

export default function NewCustomerPage() {
  return (
    <>
      <PageHeader title="New customer" subtitle="Add a B2C or B2B customer" />
      <div className="max-w-2xl p-8">
        <form action={createCustomer} className="space-y-6">
          <div className="card space-y-4 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Customer type</label>
                <select name="type" className="input" defaultValue="INDIVIDUAL">
                  <option value="INDIVIDUAL">Individual (B2C)</option>
                  <option value="BUSINESS">Business (B2B)</option>
                </select>
              </div>
              <div>
                <label className="label">Full name *</label>
                <input name="name" required className="input" placeholder="e.g. Khaled Mansour" />
              </div>
              <div>
                <label className="label">Company name</label>
                <input name="companyName" className="input" placeholder="For B2B" />
              </div>
              <div>
                <label className="label">Phone (WhatsApp)</label>
                <input name="phone" className="input" placeholder="+961 70 000 000" />
              </div>
              <div>
                <label className="label">Email</label>
                <input name="email" type="email" className="input" />
              </div>
              <div>
                <label className="label">Address</label>
                <input name="address" className="input" placeholder="Tripoli…" />
              </div>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea name="notes" className="input" rows={2} />
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-600">
              <input type="checkbox" name="whatsappOptIn" defaultChecked />
              Opt in to WhatsApp reminders &amp; updates
            </label>
          </div>

          <div className="card space-y-4 p-6">
            <h3 className="text-sm font-semibold text-zinc-700">
              First vehicle <span className="font-normal text-zinc-400">(optional)</span>
            </h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <input name="vehicleMake" className="input" placeholder="Make (Toyota)" />
              <input name="vehicleModel" className="input" placeholder="Model (Corolla)" />
              <input name="vehicleYear" type="number" className="input" placeholder="Year" />
              <input name="vehiclePlate" className="input" placeholder="Plate" />
              <input name="vehicleMileage" type="number" className="input" placeholder="Mileage (km)" />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-brand">
              Save customer
            </button>
            <Link href="/customers" className="btn-ghost">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
