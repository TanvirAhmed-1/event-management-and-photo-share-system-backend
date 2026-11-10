import { Prisma } from "@prisma/client";

/**
 * Money utilities using Prisma.Decimal for high-precision, drift-free financial arithmetic.
 */

export const toDecimal = (val: number | string | Prisma.Decimal | null | undefined): Prisma.Decimal => {
  if (val === null || val === undefined) return new Prisma.Decimal(0);
  if (val instanceof Prisma.Decimal) return val;
  return new Prisma.Decimal(val);
};

export const roundMoney = (val: number | string | Prisma.Decimal): Prisma.Decimal => {
  const d = toDecimal(val);
  return d.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
};

export const formatBDT = (val: number | string | Prisma.Decimal): string => {
  const rounded = roundMoney(val);
  return `৳${rounded.toFixed(2)}`;
};

