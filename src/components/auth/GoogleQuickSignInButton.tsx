"use client";

import { useState } from "react";
import { normalizeCustomerRedirect } from "@/lib/customer-auth";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

type QuickSignInProvider = "google" | "facebook";

export const isFacebookLoginEnabled = process.env.NEXT_PUBLIC_ENABLE_FACEBOOK_LOGIN === "true";

const providerConfig = {
  google: {
    defaultLabel: "Continue with Google",
    openingLabel: "Opening Google...",
    buttonClass:
      "border border-zinc-200 bg-white text-zinc-800 shadow-sm hover:border-orange-200 hover:bg-orange-50",
    scopes: undefined,
  },
  facebook: {
    defaultLabel: "Continue with Facebook",
    openingLabel: "Opening Facebook...",
    buttonClass:
      "border border-[#1877f2] bg-[#1877f2] text-white shadow-sm hover:border-[#0f6de5] hover:bg-[#0f6de5]",
    scopes: undefined,
  },
} satisfies Record<
  QuickSignInProvider,
  {
    defaultLabel: string;
    openingLabel: string;
    buttonClass: string;
    scopes: string | undefined;
  }
>;

export function SocialQuickSignInButton({
  provider,
  redirectPath,
  siteOrigin,
  label,
  className = "",
}: {
  provider: QuickSignInProvider;
  redirectPath?: string;
  siteOrigin?: string;
  label?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const config = providerConfig[provider];
  const redirectFromQuery = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("redirect") : null;
  const currentPath = typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/member";
  const isAuthPage = typeof window !== "undefined" && (window.location.pathname === "/login" || window.location.pathname === "/register");
  const redirectTarget = normalizeCustomerRedirect(redirectPath || redirectFromQuery || (isAuthPage ? "/member" : currentPath));
  const authUrl = getSocialAuthUrl(provider, redirectTarget, siteOrigin);

  const showOpeningState = () => {
    if (!authUrl) {
      return;
    }
    setLoading(true);
  };

  return (
    <div className={className}>
      {authUrl ? (
        <a
          href={authUrl}
          onClick={showOpeningState}
          className={`flex h-12 w-full items-center justify-center gap-3 rounded-full px-4 text-sm font-black transition ${loading ? "pointer-events-none opacity-70" : ""} ${config.buttonClass}`}
        >
          {provider === "google" ? <GoogleIcon /> : <FacebookIcon />}
          <span>{loading ? config.openingLabel : label ?? config.defaultLabel}</span>
        </a>
      ) : (
        <button
          type="button"
          disabled
          className={`flex h-12 w-full cursor-not-allowed items-center justify-center gap-3 rounded-full px-4 text-sm font-black opacity-60 ${config.buttonClass}`}
        >
          {provider === "google" ? <GoogleIcon /> : <FacebookIcon />}
          <span>{label ?? config.defaultLabel}</span>
        </button>
      )}
      {!authUrl ? (
        <p className="mt-2 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
          Supabase Auth is not configured yet. Please check environment variables.
        </p>
      ) : null}
    </div>
  );
}

export function GoogleQuickSignInButton(props: Omit<Parameters<typeof SocialQuickSignInButton>[0], "provider">) {
  return <SocialQuickSignInButton provider="google" {...props} />;
}

export function FacebookQuickSignInButton(props: Omit<Parameters<typeof SocialQuickSignInButton>[0], "provider">) {
  if (!isFacebookLoginEnabled) {
    return null;
  }

  return <SocialQuickSignInButton provider="facebook" {...props} />;
}

function getSocialAuthUrl(provider: QuickSignInProvider, redirectTarget: string, siteOrigin?: string) {
  const config = getSupabasePublicConfig();
  const origin = normalizeOrigin(siteOrigin) ?? getRuntimeOrigin();

  if (!config || !origin) {
    return null;
  }

  const callbackUrl = new URL("/login", origin);
  callbackUrl.searchParams.set("redirect", redirectTarget);

  const authUrl = new URL("/auth/v1/authorize", config.url);
  authUrl.searchParams.set("provider", provider);
  authUrl.searchParams.set("redirect_to", callbackUrl.toString());

  const scopes = providerConfig[provider].scopes;
  if (scopes) {
    authUrl.searchParams.set("scopes", scopes);
  }

  if (provider === "google") {
    authUrl.searchParams.set("prompt", "select_account");
  }

  return authUrl.toString();
}

function getRuntimeOrigin() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ?? "https://luisonesupplyhub.com";
}

function normalizeOrigin(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0">
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.2 3-7.2Z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.4 13.8a6 6 0 0 1 0-3.6V7.6H3.1a10 10 0 0 0 0 8.8l3.3-2.6Z" />
      <path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.8-2.8A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.9 5.6l3.3 2.6C7.2 7.9 9.4 6.1 12 6.1Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <span aria-hidden="true" className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-[#1877f2]">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M14.2 8.1V6.7c0-.7.5-.9.9-.9h2.2V2.1L14.2 2c-3.5 0-4.3 2.6-4.3 4.3v1.8H7.1V12h2.8v10h4.3V12h2.9l.4-3.9h-3.3Z" />
      </svg>
    </span>
  );
}
