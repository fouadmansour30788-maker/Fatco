import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Deterministic pseudo-random for reproducible seeds.
let _s = 42;
function rand() {
  _s = (_s * 1103515245 + 12345) & 0x7fffffff;
  return _s / 0x7fffffff;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function reset() {
  // Order matters (FK constraints).
  await prisma.loyaltyLedger.deleteMany();
  await prisma.transactionLine.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.serviceReminder.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.loyaltyRule.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.item.deleteMany();
  await prisma.serviceType.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await reset();

  // ---- Staff ----
  await prisma.user.create({
    data: {
      email: "admin@fatco.com",
      name: "FATCO Admin",
      passwordHash: await bcrypt.hash("fatco123", 10),
      role: "OWNER",
    },
  });

  // ---- Service types ----
  const oilChange = await prisma.serviceType.create({
    data: { name: "Oil Change", category: "OIL", reminderIntervalDays: 120, reminderIntervalKm: 5000 },
  });
  const wheelInstall = await prisma.serviceType.create({
    data: { name: "Wheel Installation", category: "WHEEL", reminderIntervalKm: 40000 },
  });
  const wheelAlign = await prisma.serviceType.create({
    data: { name: "Wheel Alignment", category: "WHEEL", reminderIntervalDays: 180 },
  });
  const filterChange = await prisma.serviceType.create({
    data: { name: "Filter Replacement", category: "OTHER", reminderIntervalDays: 120 },
  });

  // ---- Items (catalog + inventory) ----
  const items = await Promise.all(
    [
      { sku: "OIL-5W30-4L", name: "Engine Oil 5W-30 (4L)", category: "OIL", unit: "btl", costPrice: 18, salePrice: 32, stockQty: 60, reorderLevel: 15 },
      { sku: "OIL-10W40-4L", name: "Engine Oil 10W-40 (4L)", category: "OIL", unit: "btl", costPrice: 15, salePrice: 28, stockQty: 45, reorderLevel: 15 },
      { sku: "TYRE-205-55-16", name: "Tyre 205/55 R16", category: "TYRE", unit: "pcs", costPrice: 55, salePrice: 89, stockQty: 24, reorderLevel: 8 },
      { sku: "TYRE-225-45-17", name: "Tyre 225/45 R17", category: "TYRE", unit: "pcs", costPrice: 70, salePrice: 115, stockQty: 6, reorderLevel: 8 },
      { sku: "FLT-OIL-01", name: "Oil Filter (standard)", category: "FILTER", unit: "pcs", costPrice: 4, salePrice: 9, stockQty: 80, reorderLevel: 20 },
      { sku: "FLT-AIR-01", name: "Air Filter", category: "FILTER", unit: "pcs", costPrice: 6, salePrice: 14, stockQty: 12, reorderLevel: 15 },
      { sku: "BAT-12V-70", name: "Battery 12V 70Ah", category: "BATTERY", unit: "pcs", costPrice: 65, salePrice: 105, stockQty: 10, reorderLevel: 4 },
      { sku: "LAB-OIL", name: "Labor — Oil Change", category: "LABOR", unit: "job", costPrice: 0, salePrice: 8, stockQty: 0, reorderLevel: 0, trackStock: false },
      { sku: "LAB-WHEEL", name: "Labor — Wheel Service", category: "LABOR", unit: "job", costPrice: 0, salePrice: 15, stockQty: 0, reorderLevel: 0, trackStock: false },
    ].map((d) => prisma.item.create({ data: d }))
  );
  const itemBySku = Object.fromEntries(items.map((i) => [i.sku!, i]));

  // ---- Loyalty rules ----
  await prisma.loyaltyRule.create({
    data: {
      name: "Oil Change Punch Card",
      type: "PUNCH_CARD",
      serviceTypeId: oilChange.id,
      threshold: 5,
      rewardValue: 40, // a free oil change is worth ~$40
      rewardDescription: "5 oil changes → 1 free oil change",
    },
  });
  await prisma.loyaltyRule.create({
    data: {
      name: "Spend & Earn",
      type: "POINTS_PER_AMOUNT",
      pointsPerAmount: 1, // 1 point per $1 spent
      rewardDescription: "Earn 1 point for every $1 spent",
    },
  });

  // ---- Offers ----
  await prisma.offer.create({
    data: {
      name: "Summer Tyre Deal",
      description: "10% off all tyres",
      discountType: "PERCENT",
      discountValue: 10,
      startDate: daysAgo(20),
      endDate: daysAgo(-20),
    },
  });

  // ---- Expenses ----
  const expenseSeed = [
    { type: "DIRECT", category: "Stock Purchase", amount: 2400, vendor: "Oil Supplier Co.", days: 50 },
    { type: "DIRECT", category: "Stock Purchase", amount: 3100, vendor: "Tyre Importer", days: 35 },
    { type: "INDIRECT", category: "Salaries", amount: 1800, vendor: "Payroll", days: 30 },
    { type: "INDIRECT", category: "Rent", amount: 900, vendor: "Landlord", days: 30 },
    { type: "INDIRECT", category: "Utilities", amount: 220, vendor: "Electricity", days: 12 },
    { type: "INDIRECT", category: "Salaries", amount: 1800, vendor: "Payroll", days: 1 },
  ];
  for (const e of expenseSeed) {
    await prisma.expense.create({
      data: { type: e.type, category: e.category, amount: e.amount, vendor: e.vendor, date: daysAgo(e.days) },
    });
  }

  // ---- Customers + vehicles ----
  const customerSeed = [
    { type: "INDIVIDUAL", name: "Khaled Mansour", phone: "+96170111222" },
    { type: "INDIVIDUAL", name: "Rania Haddad", phone: "+96171333444" },
    { type: "INDIVIDUAL", name: "Samir Khoury", phone: "+96176555666" },
    { type: "INDIVIDUAL", name: "Lina Saab", phone: "+96103777888" },
    { type: "BUSINESS", name: "Tripoli Taxi Fleet", companyName: "Tripoli Taxi Co.", phone: "+96106999000" },
    { type: "BUSINESS", name: "North Logistics", companyName: "North Logistics SARL", phone: "+96181222333" },
  ];
  const makes = ["Toyota", "Hyundai", "Kia", "Nissan", "Mercedes"];
  const models = ["Corolla", "Elantra", "Sportage", "Sunny", "C200"];
  type SeededCustomer = { id: string; type: string; vehicles: { id: string }[] };
  const customers: SeededCustomer[] = [];
  for (const c of customerSeed) {
    const vehicleCount = c.type === "BUSINESS" ? 3 : 1;
    const created = await prisma.customer.create({
      data: {
        type: c.type,
        name: c.name,
        companyName: c.companyName,
        phone: c.phone,
        whatsappOptIn: true,
        vehicles: {
          create: Array.from({ length: vehicleCount }).map((_, i) => ({
            make: pick(makes),
            model: pick(models),
            year: 2014 + Math.floor(rand() * 10),
            plate: `${pick(["B", "G", "T", "M"])}/${100000 + Math.floor(rand() * 899999)}`,
            mileage: 30000 + Math.floor(rand() * 120000),
          })),
        },
      },
      include: { vehicles: true },
    });
    customers.push(created);
  }

  // ---- Transactions (sales/services) over the last ~120 days ----
  let txNumber = 1000;

  async function recordSale(opts: {
    customer: (typeof customers)[number];
    vehicleId: string;
    daysBack: number;
    lines: { item: (typeof items)[number]; qty: number; serviceTypeId?: string }[];
  }) {
    const lineData = opts.lines.map((l) => {
      const lineTotal = l.item.salePrice * l.qty;
      return {
        itemId: l.item.id,
        serviceTypeId: l.serviceTypeId,
        description: l.item.name,
        qty: l.qty,
        unitPrice: l.item.salePrice,
        unitCost: l.item.costPrice,
        lineTotal,
      };
    });
    const subtotal = lineData.reduce((s, l) => s + l.lineTotal, 0);
    const cost = lineData.reduce((s, l) => s + l.unitCost * l.qty, 0);
    const total = subtotal; // no tax/discount in seed
    const date = daysAgo(opts.daysBack);

    const tx = await prisma.transaction.create({
      data: {
        number: txNumber++,
        customerId: opts.customer.id,
        vehicleId: opts.vehicleId,
        status: "COMPLETED",
        date,
        subtotal,
        total,
        cost,
        paymentMethod: pick(["CASH", "CARD", "TRANSFER"]),
        lines: { create: lineData },
      },
    });

    // Inventory movements + stock decrement for tracked items.
    for (const l of opts.lines) {
      if (l.item.trackStock) {
        await prisma.inventoryMovement.create({
          data: { itemId: l.item.id, type: "SALE", qty: -l.qty, unitCost: l.item.costPrice, reference: `TX-${tx.number}` },
        });
        await prisma.item.update({ where: { id: l.item.id }, data: { stockQty: { decrement: l.qty } } });
      }
    }

    // Loyalty: 1 point per $1 spent.
    const points = Math.round(total);
    await prisma.loyaltyLedger.create({
      data: { customerId: opts.customer.id, transactionId: tx.id, type: "EARN", points, note: "Spend & Earn", createdAt: date },
    });
    await prisma.customer.update({ where: { id: opts.customer.id }, data: { pointsBalance: { increment: points } } });
  }

  // Generate a spread of services per customer.
  for (const cust of customers) {
    const serviceCount = cust.type === "BUSINESS" ? 8 : 3 + Math.floor(rand() * 3);
    for (let i = 0; i < serviceCount; i++) {
      const vehicle = pick(cust.vehicles);
      const daysBack = Math.floor(rand() * 115) + 2;
      const kind = rand();
      let lines;
      if (kind < 0.55) {
        // Oil change package
        lines = [
          { item: pick([itemBySku["OIL-5W30-4L"], itemBySku["OIL-10W40-4L"]]), qty: 1, serviceTypeId: oilChange.id },
          { item: itemBySku["FLT-OIL-01"], qty: 1 },
          { item: itemBySku["LAB-OIL"], qty: 1 },
        ];
      } else if (kind < 0.8) {
        // Tyres
        lines = [
          { item: pick([itemBySku["TYRE-205-55-16"], itemBySku["TYRE-225-45-17"]]), qty: 2, serviceTypeId: wheelInstall.id },
          { item: itemBySku["LAB-WHEEL"], qty: 1 },
        ];
      } else if (kind < 0.92) {
        lines = [{ item: itemBySku["FLT-AIR-01"], qty: 1, serviceTypeId: filterChange.id }];
      } else {
        lines = [{ item: itemBySku["BAT-12V-70"], qty: 1 }];
      }
      await recordSale({ customer: cust, vehicleId: vehicle.id, daysBack, lines });
    }
  }

  // --- Reminder demo: customers whose only oil change is overdue (>120 days) ---
  const overdueSeed = [
    { name: "Georges Aoun", phone: "+96171010101", daysBack: 165 },
    { name: "Maya Fares", phone: "+96176202020", daysBack: 195 },
  ];
  for (const o of overdueSeed) {
    const c = await prisma.customer.create({
      data: {
        type: "INDIVIDUAL",
        name: o.name,
        phone: o.phone,
        whatsappOptIn: true,
        vehicles: {
          create: {
            make: pick(makes),
            model: pick(models),
            year: 2018,
            plate: `T/${200000 + Math.floor(rand() * 700000)}`,
            mileage: 62000,
          },
        },
      },
      include: { vehicles: true },
    });
    await recordSale({
      customer: c,
      vehicleId: c.vehicles[0].id,
      daysBack: o.daysBack,
      lines: [
        { item: itemBySku["OIL-5W30-4L"], qty: 1, serviceTypeId: oilChange.id },
        { item: itemBySku["LAB-OIL"], qty: 1 },
      ],
    });
  }

  // Stable demo portal PIN on the first customer.
  await prisma.customer.update({
    where: { id: customers[0].id },
    data: { portalPin: "123456" },
  });

  const counts = {
    customers: await prisma.customer.count(),
    vehicles: await prisma.vehicle.count(),
    items: await prisma.item.count(),
    transactions: await prisma.transaction.count(),
    expenses: await prisma.expense.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
