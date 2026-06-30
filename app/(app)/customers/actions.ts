"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function createCustomer(formData: FormData) {
  const type = String(formData.get("type") || "INDIVIDUAL");
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Name is required");

  const customer = await prisma.customer.create({
    data: {
      type,
      name,
      companyName: str(formData.get("companyName")),
      phone: str(formData.get("phone")),
      email: str(formData.get("email")),
      governorate: str(formData.get("governorate")),
      district: str(formData.get("district")),
      subDistrict: str(formData.get("subDistrict")),
      address: str(formData.get("address")),
      notes: str(formData.get("notes")),
      whatsappOptIn: formData.get("whatsappOptIn") === "on",
    },
  });

  // Optionally create a first vehicle if a plate or make was provided.
  const make = str(formData.get("vehicleMake"));
  const plate = str(formData.get("vehiclePlate"));
  if (make || plate) {
    await prisma.vehicle.create({
      data: {
        customerId: customer.id,
        make,
        model: str(formData.get("vehicleModel")),
        plate,
        year: num(formData.get("vehicleYear")),
        mileage: num(formData.get("vehicleMileage")),
      },
    });
  }

  revalidatePath("/customers");
  redirect(`/customers/${customer.id}`);
}

// Generate (or regenerate) a 6-digit client-portal PIN for the customer.
export async function generatePortalPin(formData: FormData) {
  const customerId = String(formData.get("customerId") || "");
  if (!customerId) throw new Error("Missing customer");
  const pin = String(Math.floor(100000 + Math.random() * 900000));
  await prisma.customer.update({
    where: { id: customerId },
    data: { portalPin: pin },
  });
  revalidatePath(`/customers/${customerId}`);
}

export async function addVehicle(formData: FormData) {
  const customerId = String(formData.get("customerId") || "");
  if (!customerId) throw new Error("Missing customer");
  await prisma.vehicle.create({
    data: {
      customerId,
      make: str(formData.get("make")),
      model: str(formData.get("model")),
      plate: str(formData.get("plate")),
      year: num(formData.get("year")),
      mileage: num(formData.get("mileage")),
    },
  });
  revalidatePath(`/customers/${customerId}`);
}

function str(v: FormDataEntryValue | null): string | undefined {
  const s = v == null ? "" : String(v).trim();
  return s === "" ? undefined : s;
}
function num(v: FormDataEntryValue | null): number | undefined {
  const s = str(v);
  if (s === undefined) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}
