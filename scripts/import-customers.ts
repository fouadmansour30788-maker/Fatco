// Replace demo data with the parsed real customers (all tagged BUSINESS / B2B).
// Keeps catalog (items, service types, loyalty rules, offers) and users.
import "dotenv/config";
import fs from "fs";
import { prisma } from "../lib/prisma";

type Rec = {
  name: string;
  phone: string | null;
  ref: string;
  loc: { governorate?: string; district?: string; subDistrict?: string };
};

async function main() {
  const data: Rec[] = JSON.parse(
    fs.readFileSync("import/parsed-customers.json", "utf8")
  );
  console.log(`Loaded ${data.length} parsed customers.`);

  // ---- Wipe demo customer/sales data (catalog + users untouched) ----
  await prisma.loyaltyLedger.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.serviceReminder.deleteMany();
  await prisma.transactionLine.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  console.log("Demo customers/sales cleared.");

  // ---- Insert in batches ----
  const rows = data.map((c) => ({
    type: "BUSINESS",
    name: c.name,
    phone: c.phone ?? undefined,
    governorate: c.loc.governorate ?? undefined,
    district: c.loc.district ?? undefined,
    subDistrict: c.loc.subDistrict ?? undefined,
    notes: c.ref ? `Ref: ${c.ref}` : undefined,
  }));

  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const res = await prisma.customer.createMany({ data: slice });
    inserted += res.count;
    process.stdout.write(`  inserted ${inserted}/${rows.length}\r`);
  }
  console.log(`\nInserted ${inserted} customers.`);

  const total = await prisma.customer.count();
  const withLoc = await prisma.customer.count({ where: { governorate: { not: null } } });
  const byDist = await prisma.customer.groupBy({
    by: ["district"],
    where: { district: { not: null } },
    _count: { _all: true },
  });
  console.log(`\nCustomers now: ${total} (B2B), ${withLoc} with location.`);
  console.log(
    "Top districts: " +
      byDist
        .sort((a, b) => b._count._all - a._count._all)
        .slice(0, 8)
        .map((g) => `${g.district}:${g._count._all}`)
        .join(", ")
  );
  await prisma.$disconnect();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
