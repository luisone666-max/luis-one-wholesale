import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

let browserClient: SupabaseClient | null = null;

export function createBrowserSupabaseClient() {
  const config = getSupabasePublicConfig();

  if (!config) {
    return null;
  }

  browserClient ??= createClient(config.url, config.anonKey);
  return browserClient;
}
