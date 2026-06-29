-- AlterTable: add Lebanese location fields to Customer
ALTER TABLE "Customer" ADD COLUMN "governorate" TEXT,
ADD COLUMN "district" TEXT,
ADD COLUMN "subDistrict" TEXT;
