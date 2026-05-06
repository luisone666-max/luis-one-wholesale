import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/server";

type AdminUserRow = {
  id: string;
  auth_user_id?: string | null;
  email: string | null;
  name: string | null;
  role: string | null;
  active: boolean | null;
  employee_no?: string | null;
  notes?: string | null;
  created_at?: string | null;
};

export type AdminStaffUser = {
  id: string;
  authUserId?: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  employeeNo: string;
  notes: string;
  createdAt: string;
};

function mapAdminUser(user: AdminUserRow): AdminStaffUser {
  return {
    id: user.id,
    authUserId: user.auth_user_id ?? "",
    email: user.email ?? "",
    name: user.name || user.email || "Admin User",
    role: user.role ?? "staff",
    active: user.active ?? false,
    employeeNo: user.employee_no ?? "",
    notes: user.notes ?? "",
    createdAt: user.created_at ?? "",
  };
}

export async function getAdminStaffUsers(options: { activeOnly?: boolean } = {}): Promise<{ users: AdminStaffUser[]; error?: string }> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return { users: [], error: "Supabase admin client is not configured." };
  }

  let query = supabase.from("admin_users").select("id,auth_user_id,email,name,role,active,employee_no,notes,created_at").order("name", { ascending: true });

  if (options.activeOnly) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;

  if (error) {
    return { users: [], error: error.message };
  }

  return {
    users: ((data ?? []) as AdminUserRow[]).map(mapAdminUser),
  };
}

export async function getActiveAdminStaffUsers() {
  return getAdminStaffUsers({ activeOnly: true });
}
