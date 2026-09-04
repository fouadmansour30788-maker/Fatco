import { getStoreContent } from "@/lib/storeContent";
import PageHeader from "@/app/components/PageHeader";
import { saveStoreContent } from "./actions";

export const dynamic = "force-dynamic";

export default async function StoreContentPage() {
  const content = await getStoreContent();

  return (
    <>
      <PageHeader
        title="Store Content"
        subtitle="Controls the hero banner and footer on the online store (/shop)"
      />
      <div className="p-8">
        <form action={saveStoreContent} className="max-w-2xl space-y-6">
          <div className="card space-y-4 p-6">
            <div>
              <h3 className="mb-1 text-sm font-semibold">Hero banner</h3>
              <p className="text-xs text-zinc-500">
                Shown at the top of the storefront. Leave the image blank to hide it.
              </p>
            </div>
            <div>
              <label className="label">Image URL</label>
              <input
                name="heroImageUrl"
                type="url"
                defaultValue={content.heroImageUrl}
                className="input"
                placeholder="https://…"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Headline</label>
                <input
                  name="heroHeadline"
                  defaultValue={content.heroHeadline}
                  className="input"
                  placeholder="e.g. Everything your car needs"
                />
              </div>
              <div>
                <label className="label">Headline (Arabic)</label>
                <input
                  name="heroHeadlineAr"
                  dir="rtl"
                  defaultValue={content.heroHeadlineAr}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Subtitle</label>
                <input
                  name="heroSubtitle"
                  defaultValue={content.heroSubtitle}
                  className="input"
                  placeholder="e.g. Oil, tyres, filters and more — delivered."
                />
              </div>
              <div>
                <label className="label">Subtitle (Arabic)</label>
                <input
                  name="heroSubtitleAr"
                  dir="rtl"
                  defaultValue={content.heroSubtitleAr}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Button text</label>
                <input
                  name="heroCtaLabel"
                  defaultValue={content.heroCtaLabel}
                  className="input"
                  placeholder="e.g. Shop now"
                />
              </div>
              <div>
                <label className="label">Button link</label>
                <input
                  name="heroCtaHref"
                  defaultValue={content.heroCtaHref}
                  className="input"
                  placeholder="/shop?category=OIL"
                />
              </div>
            </div>
          </div>

          <div className="card space-y-4 p-6">
            <div>
              <h3 className="mb-1 text-sm font-semibold">Footer</h3>
              <p className="text-xs text-zinc-500">
                Contact details and social links shown at the bottom of the
                storefront. Blank fields are hidden.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Phone</label>
                <input
                  name="footerPhone"
                  defaultValue={content.footerPhone}
                  className="input"
                  placeholder="+961 6 000 000"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  name="footerEmail"
                  type="email"
                  defaultValue={content.footerEmail}
                  className="input"
                />
              </div>
              <div className="col-span-2">
                <label className="label">Address</label>
                <input
                  name="footerAddress"
                  defaultValue={content.footerAddress}
                  className="input"
                />
              </div>
              <div className="col-span-2">
                <label className="label">Address (Arabic)</label>
                <input
                  name="footerAddressAr"
                  dir="rtl"
                  defaultValue={content.footerAddressAr}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Facebook URL</label>
                <input
                  name="footerFacebookUrl"
                  type="url"
                  defaultValue={content.footerFacebookUrl}
                  className="input"
                  placeholder="https://facebook.com/…"
                />
              </div>
              <div>
                <label className="label">Instagram URL</label>
                <input
                  name="footerInstagramUrl"
                  type="url"
                  defaultValue={content.footerInstagramUrl}
                  className="input"
                  placeholder="https://instagram.com/…"
                />
              </div>
              <div>
                <label className="label">WhatsApp link</label>
                <input
                  name="footerWhatsappUrl"
                  type="url"
                  defaultValue={content.footerWhatsappUrl}
                  className="input"
                  placeholder="https://wa.me/9611234567"
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn-brand">
            Save changes
          </button>
        </form>
      </div>
    </>
  );
}
