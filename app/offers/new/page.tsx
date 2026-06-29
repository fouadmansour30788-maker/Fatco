import { requireRole } from "@/lib/session";
import PageHeader from "../../components/PageHeader";
import OfferForm from "../OfferForm";
import { createOffer } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewOfferPage() {
  await requireRole(["OWNER", "MANAGER"]);
  return (
    <>
      <PageHeader title="New offer" subtitle="Create a promotion or discount" />
      <div className="p-8">
        <OfferForm action={createOffer} />
      </div>
    </>
  );
}
