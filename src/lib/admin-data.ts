import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AdminDataResult<T> = {
  data: T | null;
  error?: string;
};

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error && "message" in error) {
    return String(error.message);
  }

  return "Supabase is not configured or could not be reached.";
}

export async function readAdminProductsFromSupabase(): Promise<AdminDataResult<unknown[]>> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("products")
    .select("*, product_price_tiers(*)")
    .order("created_at", { ascending: false });

  return error ? { data: null, error: errorMessage(error) } : { data };
}

export async function readAdminCategoriesFromSupabase(): Promise<AdminDataResult<unknown[]>> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase.from("categories").select("*").order("sort_order", { ascending: true });
  return error ? { data: null, error: errorMessage(error) } : { data };
}

export async function readAdminOrdersFromSupabase(): Promise<AdminDataResult<unknown[]>> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*, customers(*), order_items(*), payment_records(*)")
    .order("created_at", { ascending: false });

  return error ? { data: null, error: errorMessage(error) } : { data };
}

