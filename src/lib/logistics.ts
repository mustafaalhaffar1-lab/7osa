import {
  CalendarCheck,
  PackageCheck,
  Truck,
  Undo2,
  CornerUpLeft,
  type LucideIcon,
} from "lucide-react";

/** Shared vocabulary for the dispatch board and the driver app. */

export type JobType =
  | "visit"
  | "pickup_intake"
  | "pickup_on_sale"
  | "delivery"
  | "return_pickup"
  | "return_to_seller";

export type JobStage = "unassigned" | "assigned" | "en_route" | "arrived" | "completed" | "failed";

export const JOB_TYPE: Record<
  JobType,
  { label: string; short: string; icon: LucideIcon; tone: string; direction: "out" | "in" }
> = {
  visit: {
    label: "Home visit & valuation",
    short: "Visit",
    icon: CalendarCheck,
    tone: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    direction: "in",
  },
  pickup_intake: {
    label: "Collect from seller",
    short: "Pickup",
    icon: PackageCheck,
    tone: "bg-brand/10 text-brand",
    direction: "in",
  },
  pickup_on_sale: {
    label: "Collect sold item",
    short: "Collect (sold)",
    icon: PackageCheck,
    tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    direction: "in",
  },
  delivery: {
    label: "Deliver to buyer",
    short: "Delivery",
    icon: Truck,
    tone: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    direction: "out",
  },
  return_pickup: {
    label: "Collect return from buyer",
    short: "Return in",
    icon: Undo2,
    tone: "bg-red-500/10 text-red-600 dark:text-red-400",
    direction: "in",
  },
  return_to_seller: {
    label: "Return to seller",
    short: "Return out",
    icon: CornerUpLeft,
    tone: "bg-red-500/10 text-red-600 dark:text-red-400",
    direction: "out",
  },
};

export const SLOTS = [
  { key: "morning", label: "Morning", hours: "9am – 12pm" },
  { key: "afternoon", label: "Afternoon", hours: "12 – 4pm" },
  { key: "evening", label: "Evening", hours: "4 – 8pm" },
] as const;

/** The forward path in the field. Each stage knows what comes next. */
export const NEXT_STAGE: Partial<Record<JobStage, { to: JobStage; label: string }>> = {
  assigned: { to: "en_route", label: "Start route" },
  en_route: { to: "arrived", label: "I've arrived" },
  arrived: { to: "completed", label: "Mark done" },
};

export const STAGE_LABEL: Record<JobStage, string> = {
  unassigned: "Unassigned",
  assigned: "Assigned",
  en_route: "On the way",
  arrived: "At the door",
  completed: "Done",
  failed: "Failed",
};

export const FAILURE_REASONS = [
  "Customer not home",
  "Customer rescheduled",
  "Wrong or unreachable address",
  "Item not ready",
  "Item bigger than described",
  "Needs a second person",
  "Access denied by building",
  "Customer changed their mind",
] as const;

/** A directions link that works whether we have a pin, a Makani, or just an address. */
export function directionsUrl(job: {
  maps_url?: string | null;
  makani?: string | null;
  building?: string | null;
  area?: string | null;
  address?: string | null;
}): string | null {
  if (job.maps_url) return job.maps_url;
  const q = [job.building, job.area, job.address].filter(Boolean).join(", ");
  if (job.makani) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Makani ${job.makani} Dubai`)}`;
  if (q) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  return null;
}

/** One-line address for a card. */
export function shortAddress(job: {
  unit?: string | null;
  building?: string | null;
  area?: string | null;
  address?: string | null;
}): string {
  const parts = [job.unit, job.building, job.area].filter(Boolean);
  return parts.length ? parts.join(", ") : job.address || "No address";
}

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
