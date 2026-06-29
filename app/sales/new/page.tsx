import { prisma } from "@/lib/prisma";
import PageHeader from "../../components/PageHeader";
import PosForm from "../PosForm";

export const dynamic = "force-dynamic";

export default async function NewSalePage() {
  const [customers, items, services] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      include: {
        vehicles: true,
        rewards: { where: { status: "AVAILABLE" } },
      },
    }),
    prisma.item.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    prisma.serviceType.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const customerOpts = customers.map((c) => ({
    id: c.id,
    name: c.name,
    vehicles: c.vehicles.map((v) => ({
      id: v.id,
      label:
        [v.make, v.model, v.year].filter(Boolean).join(" ") +
        (v.plate ? ` · ${v.plate}` : ""),
    })),
    rewards: c.rewards.map((r) => ({
      id: r.id,
      description: r.description,
      value: r.value,
    })),
  }));
  const itemOpts = items.map((i) => ({
    id: i.id,
    name: i.name,
    salePrice: i.salePrice,
  }));
  const serviceOpts = services.map((s) => ({ id: s.id, name: s.name }));

  return (
    <>
      <PageHeader
        title="New sale / service"
        subtitle="Record a sale — updates inventory and loyalty automatically"
      />
      <div className="p-8">
        <PosForm
          customers={customerOpts}
          items={itemOpts}
          services={serviceOpts}
        />
      </div>
    </>
  );
}
