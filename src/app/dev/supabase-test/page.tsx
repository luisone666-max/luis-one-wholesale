import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { requireActiveAdminPage } from "@/lib/admin-auth";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { getSupabaseAdminConfig } from "@/lib/supabase/server-config";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Check = {
  label: string;
  status: "ok" | "warning" | "blocked";
  detail: string;
};

function StatusBadge({ status }: { status: Check["status"] }) {
  const styles = {
    ok: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warning: "bg-amber-50 text-amber-700 ring-amber-200",
    blocked: "bg-red-50 text-red-700 ring-red-200",
  };

  return <span className={`rounded px-2 py-1 text-xs font-black uppercase ring-1 ${styles[status]}`}>{status}</span>;
}

function maskHost(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return "Invalid URL";
  }
}

async function runChecks(): Promise<Check[]> {
  const publicConfig = getSupabasePublicConfig();
  const adminConfig = getSupabaseAdminConfig();
  const checks: Check[] = [
    {
      label: "NEXT_PUBLIC_SUPABASE_URL",
      status: publicConfig ? "ok" : "blocked",
      detail: publicConfig ? `Configured for ${maskHost(publicConfig.url)}` : "Missing or still using placeholder value.",
    },
    {
      label: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      status: publicConfig ? "ok" : "blocked",
      detail: publicConfig ? "Configured. Value is intentionally hidden." : "Missing or still using placeholder value.",
    },
    {
      label: "SUPABASE_SERVICE_ROLE_KEY",
      status: adminConfig ? "ok" : "warning",
      detail: adminConfig ? "Configured for server-only admin operations. Value is intentionally hidden." : "Missing or still using placeholder value.",
    },
  ];

  if (!publicConfig) {
    return checks;
  }

  const anonClient = createClient(publicConfig.url, publicConfig.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { count: categoryCount, error: publicReadError } = await anonClient
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("active", true);

  checks.push({
    label: "Public category read",
    status: publicReadError ? "blocked" : "ok",
    detail: publicReadError ? publicReadError.message : `${categoryCount ?? 0} active categories visible to public clients.`,
  });

  const { count: productCount, error: productReadError } = await anonClient
    .from("customer_products")
    .select("id", { count: "exact", head: true });

  checks.push({
    label: "Public product view",
    status: productReadError ? "blocked" : "ok",
    detail: productReadError ? productReadError.message : `${productCount ?? 0} products visible through customer_products view.`,
  });

  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    checks.push({
      label: "Server admin client",
      status: "warning",
      detail: "Service role is not configured, so registration cannot create auth users from the server.",
    });
    return checks;
  }

  const { count: customerCount, error: customerReadError } = await adminClient
    .from("customers")
    .select("id", { count: "exact", head: true });

  checks.push({
    label: "Server customer table read",
    status: customerReadError ? "blocked" : "ok",
    detail: customerReadError ? customerReadError.message : `${customerCount ?? 0} customer rows found using server-only key.`,
  });

  return checks;
}

export default async function SupabaseTestPage() {
  const isDevelopment = process.env.NODE_ENV === "development";

  if (!isDevelopment) {
    notFound();
  }

  await requireActiveAdminPage();

  const checks = await runChecks();

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">Development diagnostic</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Supabase connection test</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          This page only reports whether configuration and basic database reads work. It never prints secret values.
        </p>

        <div className="mt-6 divide-y divide-zinc-100 overflow-hidden rounded-md border border-zinc-200">
          {checks.map((check) => (
            <div key={check.label} className="grid gap-3 bg-white p-4 sm:grid-cols-[220px_auto_1fr] sm:items-center">
              <p className="font-black text-zinc-950">{check.label}</p>
              <StatusBadge status={check.status} />
              <p className="text-sm font-semibold text-zinc-600">{check.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
