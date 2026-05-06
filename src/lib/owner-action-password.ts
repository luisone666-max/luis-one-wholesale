import "server-only";

import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type OwnerSecurityRow = {
  id: string;
  password_hash: string;
  password_salt: string;
};

const iterations = 120000;
const keyLength = 32;
const digest = "sha256";

function hashPassword(password: string, salt: string) {
  return pbkdf2Sync(password, salt, iterations, keyLength, digest).toString("hex");
}

function safeCompare(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}

function makeHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return {
    password_hash: hashPassword(password, salt),
    password_salt: salt,
  };
}

async function getOwnerSetting(admin: SupabaseClient) {
  const { data, error } = await admin
    .from("owner_security_settings")
    .select("id,password_hash,password_salt")
    .eq("id", "owner")
    .maybeSingle();

  if (error) {
    return { setting: null, message: error.message };
  }

  return { setting: (data as OwnerSecurityRow | null) ?? null, message: "" };
}

async function ensureOwnerSetting(admin: SupabaseClient, updatedByAdminUserId?: string) {
  const current = await getOwnerSetting(admin);

  if (current.message || current.setting) {
    return current;
  }

  const initialPassword = process.env.OWNER_ACTION_PASSWORD;

  if (!initialPassword) {
    return { setting: null, message: "Owner password is not configured." };
  }

  const hash = makeHash(initialPassword);
  const { data, error } = await admin
    .from("owner_security_settings")
    .upsert({
      id: "owner",
      ...hash,
      updated_by_admin_user_id: updatedByAdminUserId ?? null,
      updated_at: new Date().toISOString(),
    })
    .select("id,password_hash,password_salt")
    .single();

  if (error || !data) {
    return { setting: null, message: error?.message ?? "Owner password setup failed." };
  }

  return { setting: data as OwnerSecurityRow, message: "" };
}

async function verifyStoredOwnerPassword(admin: SupabaseClient, value: unknown, updatedByAdminUserId?: string) {
  if (typeof value !== "string" || !value) {
    return { ok: false, message: "Owner password is required." };
  }

  const { setting, message } = await ensureOwnerSetting(admin, updatedByAdminUserId);

  if (!setting) {
    return { ok: false, message };
  }

  const actualHash = hashPassword(value, setting.password_salt);

  if (!safeCompare(actualHash, setting.password_hash)) {
    return { ok: false, message: "Owner password is incorrect." };
  }

  return { ok: true, message: "" };
}

export async function verifyOwnerActionPassword(value: unknown, updatedByAdminUserId?: string) {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return { ok: false, message: "Supabase admin client is not configured." };
  }

  return verifyStoredOwnerPassword(admin, value, updatedByAdminUserId);
}

export function verifyOwnerMasterPassword(value: unknown) {
  const expected = process.env.OWNER_MASTER_PASSWORD;

  if (!expected) {
    return { ok: false, message: "Highest permission password is not configured." };
  }

  if (typeof value !== "string" || !value) {
    return { ok: false, message: "Highest permission password is required." };
  }

  if (!safeCompare(value, expected)) {
    return { ok: false, message: "Highest permission password is incorrect." };
  }

  return { ok: true, message: "" };
}

export async function changeOwnerActionPassword({
  currentPassword,
  highestPermissionPassword,
  newPassword,
  updatedByAdminUserId,
}: {
  currentPassword: unknown;
  highestPermissionPassword: unknown;
  newPassword: unknown;
  updatedByAdminUserId: string;
}) {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return { ok: false, message: "Supabase admin client is not configured." };
  }

  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return { ok: false, message: "New owner password must be at least 8 characters." };
  }

  const currentCheck = await verifyStoredOwnerPassword(admin, currentPassword, updatedByAdminUserId);
  const masterCheck = currentCheck.ok ? currentCheck : verifyOwnerMasterPassword(highestPermissionPassword);

  if (!currentCheck.ok && !masterCheck.ok) {
    return { ok: false, message: "Old password or highest permission password is required." };
  }

  const hash = makeHash(newPassword);
  const { error } = await admin.from("owner_security_settings").upsert({
    id: "owner",
    ...hash,
    updated_by_admin_user_id: updatedByAdminUserId,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Owner password updated." };
}
