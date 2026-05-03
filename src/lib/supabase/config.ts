export function isUsableUrl(value: string | undefined) {
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

export function isUsableKey(value: string | undefined) {
  if (!value) {
    return false;
  }

  return value.length > 20 && !value.includes("supabase_") && !value.includes("service_role_key");
}

export function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isUsableUrl(url) || !isUsableKey(anonKey)) {
    return null;
  }

  return { url: url as string, anonKey: anonKey as string };
}

export function getSupabaseServerConfig() {
  const publicConfig = getSupabasePublicConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!publicConfig) {
    return null;
  }

  return {
    url: publicConfig.url,
    key: isUsableKey(serviceRoleKey) ? (serviceRoleKey as string) : publicConfig.anonKey,
  };
}
