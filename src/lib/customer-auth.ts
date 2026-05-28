"use client";

import type { User } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export type CustomerProfile = {
  id: string;
  auth_user_id: string | null;
  name: string;
  phone: string | null;
  facebook_name: string | null;
  messenger_link: string | null;
  location: string | null;
  business_type: string | null;
  status: string | null;
};

export type CustomerSessionState = {
  user: User | null;
  customer: CustomerProfile | null;
};

type SessionOptions = {
  ensureProfile?: boolean;
};

function textOrEmpty(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function customerNameFromUser(user: User) {
  const metadata = user.user_metadata ?? {};
  return (
    textOrEmpty(metadata.full_name) ||
    textOrEmpty(metadata.name) ||
    textOrEmpty(metadata.user_name) ||
    textOrEmpty(user.email?.split("@")[0]) ||
    "Luis One Customer"
  );
}

export function normalizeCustomerRedirect(value: string | null | undefined, fallback = "/member") {
  const target = textOrEmpty(value);

  if (!target || !target.startsWith("/") || target.startsWith("//") || target.includes("\\") || /[\r\n]/.test(target)) {
    return fallback;
  }

  return target;
}

export function getFriendlyAuthError(message: string) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("invalid login")) {
    return "Email or password is incorrect.";
  }

  if (lowerMessage.includes("missing supabase environment")) {
    return "Supabase is not configured yet. Please add the required environment variables.";
  }

  if (lowerMessage.includes("already registered") || lowerMessage.includes("already exists")) {
    return "This email is already registered. Please login instead.";
  }

  if (lowerMessage.includes("invalid password") || lowerMessage.includes("password")) {
    return "Please use a stronger password with at least 6 characters.";
  }

  if (lowerMessage.includes("customer profile insert failed")) {
    return message;
  }

  if (lowerMessage.includes("supabase")) {
    return "Authentication is not configured yet. Please check Supabase environment variables.";
  }

  return message || "Something went wrong. Please try again.";
}

export async function getCurrentCustomerSession(options: SessionOptions = {}): Promise<CustomerSessionState> {
  const supabase = createBrowserSupabaseClient();

  if (!supabase) {
    return { user: null, customer: null };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, customer: null };
  }

  const { data } = await supabase
    .from("customers")
    .select("id,auth_user_id,name,phone,facebook_name,messenger_link,location,business_type,status")
    .eq("auth_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const customer = (data as CustomerProfile | null) ?? null;

  if (customer || !options.ensureProfile) {
    return { user, customer };
  }

  const metadata = user.user_metadata ?? {};
  const { data: insertedData } = await supabase
    .from("customers")
    .insert({
      auth_user_id: user.id,
      name: customerNameFromUser(user),
      phone: textOrEmpty(metadata.phone) || null,
      facebook_name: null,
      messenger_link: null,
      location: null,
      business_type: "Walk-in Buyer",
      status: "active",
    })
    .select("id,auth_user_id,name,phone,facebook_name,messenger_link,location,business_type,status")
    .maybeSingle();

  return { user, customer: (insertedData as CustomerProfile | null) ?? null };
}

export async function logoutCustomer() {
  const supabase = createBrowserSupabaseClient();

  if (!supabase) {
    return;
  }

  await supabase.auth.signOut();
}
