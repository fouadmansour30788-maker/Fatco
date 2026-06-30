// Domain constants. We store these as plain strings in the DB (SQLite/Postgres
// portable) and centralize the allowed values + labels here.

export const CURRENCY = "USD"; // FATCO operates in USD; change here if needed.

export const CUSTOMER_TYPES = ["INDIVIDUAL", "BUSINESS"] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];
export const CUSTOMER_TYPE_LABEL: Record<CustomerType, string> = {
  INDIVIDUAL: "Individual (B2C)",
  BUSINESS: "Business (B2B)",
};

// Suggested item categories (the form lets staff pick one OR type a custom one).
export const ITEM_CATEGORIES = [
  "Engine Oil",
  "Gear / Transmission Oil",
  "Grease & Lubricants",
  "Brake Fluid",
  "Coolant / Antifreeze",
  "Additives",
  "Tyres",
  "Tubes",
  "Rims / Wheels",
  "Wheel Alignment & Balancing",
  "Battery",
  "Oil Filter",
  "Air Filter",
  "Fuel Filter",
  "Cabin Filter",
  "Spark Plugs",
  "Belts",
  "Brake Pads & Discs",
  "Wipers",
  "Bulbs & Electrical",
  "Accessories",
  "Tools & Equipment",
  "Labor / Service",
  "Other",
] as const;
export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

export const SERVICE_CATEGORIES = ["OIL", "WHEEL", "OTHER"] as const;

export const PAYMENT_METHODS = [
  "CASH",
  "CARD",
  "TRANSFER",
  "CREDIT",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const TRANSACTION_STATUSES = ["DRAFT", "COMPLETED", "VOID"] as const;

export const EXPENSE_TYPES = ["DIRECT", "INDIRECT"] as const;
export type ExpenseType = (typeof EXPENSE_TYPES)[number];

export const EXPENSE_CATEGORIES = [
  "Stock Purchase",
  "Salaries",
  "Rent",
  "Utilities",
  "Equipment",
  "Marketing",
  "Transport",
  "Other",
] as const;

export const LOYALTY_RULE_TYPES = ["PUNCH_CARD", "POINTS_PER_AMOUNT"] as const;
export type LoyaltyRuleType = (typeof LOYALTY_RULE_TYPES)[number];

export const USER_ROLES = ["OWNER", "MANAGER", "STAFF"] as const;
export type UserRole = (typeof USER_ROLES)[number];
