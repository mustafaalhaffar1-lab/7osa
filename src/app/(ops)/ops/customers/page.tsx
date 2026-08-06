import { createClient } from "@/lib/supabase/server";
import { CustomerDirectory, type DirectoryUser } from "./CustomerDirectory";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const supabase = await createClient();
  const { data: users, error } = await supabase.rpc("ops_list_users");

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Customers</h1>
      <p className="mt-1 text-sm text-muted">
        Everyone who buys or sells on Hoosa. Click a customer for their full profile.
      </p>
      {error ? (
        <p className="mt-4 text-sm text-red-500">{error.message}</p>
      ) : (
        <CustomerDirectory users={(users as DirectoryUser[]) ?? []} />
      )}
    </div>
  );
}
