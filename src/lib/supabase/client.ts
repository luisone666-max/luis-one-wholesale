import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

let browserClient: SupabaseClient | null = null;

const authCookieMaxAgeSeconds = 60 * 60 * 24 * 30;

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function readCookie(name: string) {
  if (!canUseBrowserStorage() || typeof document.cookie !== "string") {
    return null;
  }

  const encodedName = `${encodeURIComponent(name)}=`;
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(encodedName));

  return cookie ? decodeURIComponent(cookie.slice(encodedName.length)) : null;
}

function writeCookie(name: string, value: string) {
  if (!canUseBrowserStorage() || typeof document.cookie !== "string") {
    return;
  }

  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(getCookieSafeAuthValue(value))}; path=/; max-age=${authCookieMaxAgeSeconds}; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (!canUseBrowserStorage() || typeof document.cookie !== "string") {
    return;
  }

  document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0; SameSite=Lax`;
}

const authStorage = {
  getItem(key: string) {
    if (!canUseBrowserStorage()) {
      return null;
    }

    try {
      return window.localStorage.getItem(key) ?? readCookie(key);
    } catch {
      return readCookie(key);
    }
  },
  setItem(key: string, value: string) {
    if (!canUseBrowserStorage()) {
      return;
    }

    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Cookie fallback below keeps OAuth redirects usable in restricted webviews.
    }

    writeCookie(key, value);
  },
  removeItem(key: string) {
    if (!canUseBrowserStorage()) {
      return;
    }

    try {
      window.localStorage.removeItem(key);
    } catch {
      // Cookie fallback is cleared below.
    }

    deleteCookie(key);
  },
};

function getAuthStorageKey() {
  const config = getSupabasePublicConfig();

  if (!config) {
    return null;
  }

  try {
    const url = new URL(config.url);
    return `sb-${url.hostname.split(".")[0]}-auth-token`;
  } catch {
    return null;
  }
}

export function hasCachedBrowserSupabaseSession() {
  if (!canUseBrowserStorage()) {
    return false;
  }

  const storageKey = getAuthStorageKey();

  if (!storageKey) {
    return false;
  }

  const rawSession = authStorage.getItem(storageKey);

  if (!rawSession) {
    return false;
  }

  try {
    const session = JSON.parse(rawSession) as { access_token?: string; expires_at?: number };
    const expiresAt = Number(session.expires_at ?? 0);

    return Boolean(session.access_token && (!expiresAt || expiresAt > Math.floor(Date.now() / 1000) + 60));
  } catch {
    return false;
  }
}

function getCookieSafeAuthValue(value: string) {
  try {
    const session = JSON.parse(value) as {
      access_token?: string;
      refresh_token?: string;
      provider_token?: string | null;
      provider_refresh_token?: string | null;
      user?: {
        id?: string;
        aud?: string;
        role?: string;
        email?: string;
        phone?: string;
        app_metadata?: Record<string, unknown>;
        user_metadata?: Record<string, unknown>;
        created_at?: string;
        updated_at?: string;
      };
      [key: string]: unknown;
    };
    const metadata = session.user?.user_metadata ?? {};

    return JSON.stringify({
      ...session,
      provider_token: null,
      provider_refresh_token: null,
      user: session.user
        ? {
            id: session.user.id,
            aud: session.user.aud,
            role: session.user.role,
            email: session.user.email,
            phone: session.user.phone,
            app_metadata: session.user.app_metadata,
            user_metadata: {
              avatar_url: metadata.avatar_url,
              email: metadata.email,
              full_name: metadata.full_name,
              name: metadata.name,
              picture: metadata.picture,
              provider_id: metadata.provider_id,
            },
            created_at: session.user.created_at,
            updated_at: session.user.updated_at,
          }
        : session.user,
    });
  } catch {
    return value;
  }
}

export function createBrowserSupabaseClient() {
  const config = getSupabasePublicConfig();

  if (!config) {
    return null;
  }

  browserClient ??= createClient(config.url, config.anonKey, {
    auth: {
      storage: authStorage,
    },
  });
  return browserClient;
}
