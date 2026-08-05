import { BRAND } from "./brand";

const money = new Intl.NumberFormat(BRAND.locale, {
  style: "currency",
  currency: BRAND.currency,
  maximumFractionDigits: 0,
});

export function formatMoney(amount: number): string {
  return money.format(amount);
}
