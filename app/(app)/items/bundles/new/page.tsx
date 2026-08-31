import { prisma } from "@/lib/prisma";
import PageHeader from "@/app/components/PageHeader";
import BundleForm from "../../BundleForm";
import { createBundle } from "../../actions";

export const dynamic = "force-dynamic";

export default async function NewBundlePage() {
  const items = await prisma.item.findMany({
    where: { active: true, kind: "PRODUCT" },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: { id: true, name: true, costPrice: true, salePrice: true },
  });

  return (
    <>
      <PageHeader
        title="New bundle / kit"
        subtitle="Sell multiple items together as one storefront product"
      />
      <div className="p-8">
        <BundleForm action={createBundle} items={items} />
      </div>
    </>
  );
}
