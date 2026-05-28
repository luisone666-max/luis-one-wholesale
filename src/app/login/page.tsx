import { headers } from "next/headers";
import { LoginForm } from "@/components/auth/LoginForm";
import { Container, MarketplaceShell } from "@/components/CustomerUi";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeaderServer as SiteHeader } from "@/components/SiteHeaderServer";

function normalizeLoginRedirect(value: string | undefined) {
  const target = typeof value === "string" ? value.trim() : "";

  if (!target || !target.startsWith("/") || target.startsWith("//") || target.includes("\\") || /[\r\n]/.test(target)) {
    return "/member";
  }

  return target;
}

function getRequestOrigin(headerList: { get(name: string): string | null }) {
  const host = (headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "").split(",")[0]?.trim();

  if (!host) {
    return undefined;
  }

  const protocolFromHeader = (headerList.get("x-forwarded-proto") ?? "").split(",")[0]?.trim();
  const protocol = protocolFromHeader || (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");

  return `${protocol}://${host}`;
}

function getSupabaseStorageKey() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ifnkxkfjkdjicxpkrlxy.supabase.co";

  try {
    const url = new URL(rawUrl);
    return `sb-${url.hostname.split(".")[0]}-auth-token`;
  } catch {
    return "sb-ifnkxkfjkdjicxpkrlxy-auth-token";
  }
}

function SocialAuthHashBridge({ storageKey }: { storageKey: string }) {
  const script = `
(function () {
  try {
    if (!window.location.hash || window.location.hash.indexOf("access_token=") === -1) {
      return;
    }

    var hash = new URLSearchParams(window.location.hash.slice(1));
    var accessToken = hash.get("access_token");
    var refreshToken = hash.get("refresh_token");

    if (!accessToken || !refreshToken) {
      return;
    }

    function decodeBase64Url(value) {
      var base64 = value.replace(/-/g, "+").replace(/_/g, "/");
      var padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      return decodeURIComponent(
        atob(padded)
          .split("")
          .map(function (character) {
            return "%" + ("00" + character.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );
    }

    var now = Math.floor(Date.now() / 1000);
    var payload = JSON.parse(decodeBase64Url(accessToken.split(".")[1] || ""));
    var expiresAt = Number(hash.get("expires_at")) || Number(payload.exp) || now + Number(hash.get("expires_in") || 3600);
    var expiresIn = Number(hash.get("expires_in")) || Math.max(expiresAt - now, 0);
    var userMetadata = payload.user_metadata || {};
    var appMetadata = payload.app_metadata || {};
    var session = {
      access_token: accessToken,
      refresh_token: refreshToken,
      provider_token: null,
      provider_refresh_token: null,
      token_type: hash.get("token_type") || "bearer",
      expires_in: expiresIn,
      expires_at: expiresAt,
      user: {
        id: payload.sub,
        aud: payload.aud || "authenticated",
        role: payload.role || "authenticated",
        email: payload.email || userMetadata.email || "",
        phone: payload.phone || userMetadata.phone || "",
        app_metadata: appMetadata,
        user_metadata: {
          avatar_url: userMetadata.avatar_url,
          email: userMetadata.email,
          full_name: userMetadata.full_name,
          name: userMetadata.name,
          picture: userMetadata.picture,
          provider_id: userMetadata.provider_id
        },
        created_at: new Date(Number(payload.iat || now) * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }
    };

    var sessionValue = JSON.stringify(session);

    try {
      window.localStorage.setItem(${JSON.stringify(storageKey)}, sessionValue);
    } catch (storageError) {
      // Cookie fallback below keeps social login usable in restricted webviews.
    }

    try {
      document.cookie = encodeURIComponent(${JSON.stringify(storageKey)}) + "=" + encodeURIComponent(sessionValue) + "; path=/; max-age=2592000; SameSite=Lax";
    } catch (cookieError) {
      // Supabase will still use localStorage when it is available.
    }

    var query = new URLSearchParams(window.location.search);
    var target = query.get("redirect") || "/member";

    if (!target || target.charAt(0) !== "/" || target.indexOf("//") === 0 || target.indexOf("\\\\") !== -1 || /[\\r\\n]/.test(target)) {
      target = "/member";
    }

    window.location.replace(target);
  } catch (error) {
    console.error("Unable to complete social login callback.", error);
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }
})();
`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ registered?: string; redirect?: string }> }) {
  const params = await searchParams;
  const siteOrigin = getRequestOrigin(await headers());
  const supabaseStorageKey = getSupabaseStorageKey();
  const redirectPath = normalizeLoginRedirect(params.redirect);
  const isCheckoutFlow = redirectPath === "/checkout" || redirectPath === "/cart";

  return (
    <>
      <SocialAuthHashBridge storageKey={supabaseStorageKey} />
      <SiteHeader />
      <MarketplaceShell>
        <Container className={isCheckoutFlow ? "max-w-2xl py-4 sm:py-6" : "grid gap-8 py-6 lg:grid-cols-[440px_1fr] lg:py-10"}>
          <LoginForm registered={params.registered === "1"} redirectPath={redirectPath} siteOrigin={siteOrigin} />
          {isCheckoutFlow ? null : (
            <section className="rounded-sm bg-[#f65f18] p-8 text-white shadow-sm lg:p-10">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-100">Wholesale Account</p>
              <h1 className="mt-4 max-w-xl text-4xl font-black tracking-tight">Login to manage your wholesale orders.</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-orange-50">
                Product prices stay public. Login is only required when adding items to your order list, checking out, and viewing order history.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {["Public prices", "Order history", "Manual confirmation"].map((item) => (
                  <div key={item} className="rounded-sm bg-white/12 p-4 text-sm font-black ring-1 ring-white/25">{item}</div>
                ))}
              </div>
            </section>
          )}
        </Container>
      </MarketplaceShell>
      <SiteFooter />
    </>
  );
}
