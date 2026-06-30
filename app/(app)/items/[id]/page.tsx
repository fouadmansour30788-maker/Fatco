import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/app/components/PageHeader";
import ItemForm from "../ItemForm";
import { updateItem } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await prisma.item.findUnique({ where: { id } });
  if (!item) notFound();

  return (
    <>
      <PageHeader title={`Edit — ${item.name}`} subtitle="Update catalog item" />
      <div className="p-8">
        <ItemForm action={updateItem} values={item} isEdit />
      </div>
    </>
  );
}
