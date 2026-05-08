import "server-only";

import { getSupabasePublicConfig, isUsableKey } from "@/lib/supabase/config";

export function getSupabaseServerConfig() {
  const publicConfig = getSupabasePublicConfig();

  if (!publicConfig) {
    return null;
  }

  return {
    url: publicConfig.url,
    key: publicConfig.anonKey,
  };
}

export function getSupabaseAdminConfig() {
  const publicConfig = getSupabasePublicConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!publicConfig || !isUsableKey(serviceRoleKey)) {
    return null;
  }

  return {
    url: publicConfig.url,
    serviceRoleKey: serviceRoleKey as string,
  };
}
