import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { UserRows, type AdminUser } from "./UserRows";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const me = await getUser();
  const [{ data: users, error }, { data: amAdmin }] = await Promise.all([
    supabase.rpc("ops_list_users"),
    me ? supabase.rpc("is_admin", { uid: me.id }) : Promise.resolve({ data: false } as const),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Users</h1>
      <p className="mt-1 text-sm text-muted">
        Everyone on the platform — sellers, buyers, and staff.{" "}
        {amAdmin ? "You can grant or revoke staff roles." : "Role changes need an admin."}
      </p>
      {error ? (
        <p className="mt-4 text-sm text-red-500">{error.message}</p>
      ) : (
        <UserRows users={(users as AdminUser[]) ?? []} amAdmin={Boolean(amAdmin)} myId={me?.id ?? ""} />
      )}
    </div>
  );
}
