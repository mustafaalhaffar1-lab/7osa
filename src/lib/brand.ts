/**
 * Single source of truth for brand identity. Rename the whole product here.
 */
export const BRAND = {
  name: "Hoosa",
  tagline: "Sell your home, effortlessly.",
  description:
    "Managed resale concierge for home goods. We collect, inspect, photograph, price, sell, and deliver — you just get paid.",
  currency: "AED",
  locale: "en-AE",
  supportEmail: "hello@hoosa.ae",
  city: "Dubai",
} as const;

/** Absolute base URL used for printed QR labels (must point at production). */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://hoosa.vercel.app";

