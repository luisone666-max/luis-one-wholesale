import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminConfig, getSupabaseServerConfig } from "@/lib/supabase/config";

export function createServerSupabaseClient() {
  const config = getSupabaseServerConfig();

  if (!config) {
    return null;
  }

  return createClient(config.url, config.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

export function createSupabaseAdminClient() {
  const config = getSupabaseAdminConfig();

  if (!config) {
    return null;
  }

  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
