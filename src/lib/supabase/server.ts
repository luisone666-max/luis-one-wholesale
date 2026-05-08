import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminConfig, getSupabaseServerConfig } from "@/lib/supabase/server-config";

type ServerSupabaseClientOptions = {
  cache?: RequestCache;
  next?: {
    revalidate?: number;
    tags?: string[];
  };
};

export function createServerSupabaseClient(options: ServerSupabaseClientOptions = {}) {
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
      fetch: (input, init) => {
        const requestInit = {
          ...init,
          cache: options.cache ?? "no-store",
          ...(options.next ? { next: options.next } : {}),
        } as RequestInit & { next?: ServerSupabaseClientOptions["next"] };

        return fetch(input, requestInit);
      },
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
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}
