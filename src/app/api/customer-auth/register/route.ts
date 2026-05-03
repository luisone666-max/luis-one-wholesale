import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const businessTypes = new Set(["Reseller", "Shop Owner", "Online Seller", "Walk-in Buyer", "Other"]);

type RegisterPayload = {
  fullName?: string;
  phone?: string;
  email?: string;
  facebookName?: string;
  location?: string;
  businessType?: string;
  password?: string;
  confirmPassword?: string;
};

function validatePayload(payload: RegisterPayload) {
  if (!payload.fullName?.trim()) {
    return "Full Name is required.";
  }

  if (!payload.phone?.trim()) {
    return "Phone Number is required.";
  }

  if (!payload.email?.trim()) {
    return "Email is required.";
  }

  if (!payload.businessType || !businessTypes.has(payload.businessType)) {
    return "Please select a valid Business Type.";
  }

  if (!payload.password || payload.password.length < 6) {
    return "Password must be at least 6 characters.";
  }

  if (payload.password !== payload.confirmPassword) {
    return "Password and Confirm Password must match.";
  }

  return null;
}

function friendlyAdminAuthError(message: string) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("already") || lowerMessage.includes("registered") || lowerMessage.includes("duplicate")) {
    return "This email is already registered. Please login instead.";
  }

  if (lowerMessage.includes("password")) {
    return "Invalid password. Please use at least 6 characters.";
  }

  if (lowerMessage.includes("email")) {
    return "Please enter a valid email address.";
  }

  return "Unable to create customer account. Please try again.";
}

function friendlyCustomerInsertError(message: string) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("customers") || lowerMessage.includes("relation") || lowerMessage.includes("schema")) {
    return "Customer profile insert failed. Please make sure the database migrations have been applied.";
  }

  if (lowerMessage.includes("permission") || lowerMessage.includes("row-level security") || lowerMessage.includes("rls")) {
    return "Customer profile insert failed because database permissions are not ready.";
  }

  if (lowerMessage.includes("duplicate")) {
    return "Customer profile already exists for this account.";
  }

  return "Customer profile insert failed. The auth user was rolled back. Please try again.";
}

export async function POST(request: Request) {
  const payload = (await request.json()) as RegisterPayload;
  const validationError = validatePayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Missing Supabase environment variables. Please configure NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 },
    );
  }

  const email = payload.email?.trim().toLowerCase() ?? "";
  const fullName = payload.fullName?.trim() ?? "";

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: payload.password as string,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      phone: payload.phone?.trim(),
      business_type: payload.businessType,
    },
  });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: friendlyAdminAuthError(authError?.message ?? "Unable to create customer account.") },
      { status: 400 },
    );
  }

  const { error: customerError } = await supabase.from("customers").insert({
    auth_user_id: authData.user.id,
    name: fullName,
    phone: payload.phone?.trim(),
    facebook_name: payload.facebookName?.trim() || null,
    location: payload.location?.trim() || null,
    business_type: payload.businessType,
    status: "active",
  });

  if (customerError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: friendlyCustomerInsertError(customerError.message) }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
