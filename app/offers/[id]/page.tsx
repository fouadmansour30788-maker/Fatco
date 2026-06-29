import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import PageHeader from "../../components/PageHeader";
import OfferForm from "../OfferForm";
import { updateOffer } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditOfferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["OWNER", "MANAGER"]);
  const { id } = await params;
  const offer = await prisma.offer.findUnique({ where: { id } });
  if (!offer) notFound();

  return (
    <>
      <PageHeader title={`Edit — ${offer.name}`} subtitle="Update this offer" />
      <div className="p-8">
        <OfferForm action={updateOffer} values={offer} isEdit />
      </div>
    </>
  );
}
