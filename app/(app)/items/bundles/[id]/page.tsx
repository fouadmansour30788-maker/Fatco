import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/app/components/PageHeader";
import BundleForm from "../../BundleForm";
import { updateBundle } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditBundlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [bundle, items] = await Promise.all([
    prisma.item.findUnique({
      where: { id },
      include: { bundleComponents: { include: { componentItem: true } } },
    }),
    prisma.item.findMany({
      where: { active: true, kind: "PRODUCT" },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: { id: true, name: true, costPrice: true, salePrice: true },
    }),
  ]);
  if (!bundle || bundle.kind !== "BUNDLE") notFound();

  return (
    <>
      <PageHeader title={`Edit — ${bundle.name}`} subtitle="Update kit" />
      <div className="p-8">
        <BundleForm
          action={updateBundle}
          items={items}
          isEdit
          values={{
            ...bundle,
            components: bundle.bundleComponents.map((c) => ({
              itemId: c.componentItemId,
              name: c.componentItem.name,
              qty: c.qty,
            })),
          }}
        />
      </div>
    </>
  );
}
