import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { ProfileForm } from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getUser();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, default_building, default_unit, default_area, default_makani, default_maps_url, default_access_notes")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Profile</h1>
        <p className="mt-0.5 text-sm text-muted">
          Your details and where we collect from or deliver to.
        </p>
      </div>
      <ProfileForm
        email={user!.email ?? ""}
        initial={{
          fullName: profile?.full_name ?? "",
          phone: profile?.phone ?? "",
          building: profile?.default_building ?? "",
          unit: profile?.default_unit ?? "",
          area: profile?.default_area ?? "",
          makani: profile?.default_makani ?? "",
          mapsUrl: profile?.default_maps_url ?? "",
          accessNotes: profile?.default_access_notes ?? "",
        }}
      />
    </div>
  );
}
