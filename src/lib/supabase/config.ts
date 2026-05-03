export function normalizeSupabaseUrl(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value.trim());

    if (url.protocol !== "https:" || !url.hostname.includes("supabase")) {
      return null;
    }

    // Supabase dashboard shows both the project URL and the Data API /rest/v1 URL.
    // supabase-js needs the project root URL, so accept either and normalize safely.
    return `${url.origin}`;
  } catch {
    return null;
  }
}

export function isUsableKey(value: string | undefined) {
  if (!value) {
    return false;
  }

  return value.length > 20 && !value.includes("supabase_") && !value.includes("service_role_key");
}

export function getSupabasePublicConfig() {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !isUsableKey(anonKey)) {
    return null;
  }

  return { url, anonKey: anonKey as string };
}

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
