import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/** Current authenticated user (or null), read from the request session. */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
