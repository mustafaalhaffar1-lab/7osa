import { redirect } from "next/navigation";

/** Inventory opens on the product list. */
export default function InventoryIndex() {
  redirect("/ops/inventory/products");
}
