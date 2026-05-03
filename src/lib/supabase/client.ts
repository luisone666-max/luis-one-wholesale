import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

function isUsableUrl(value: string | undefined) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.includes("supabase");
  } catch {
    return false;
  }
}

function isUsableKey(value: string | undefined) {
  return Boolean(value && value.length > 20 && !value.includes("supabase_") && !value.includes("service_role_key"));
}

export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isUsableUrl(url) || !isUsableKey(anonKey)) {
    return null;
  }

  browserClient ??= createClient(url as string, anonKey as string);
  return browserClient;
}
