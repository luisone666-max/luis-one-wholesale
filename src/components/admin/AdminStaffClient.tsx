"use client";

import { useState } from "react";
import { AdminPageTitle, StatusPill, TableShell } from "@/components/admin/AdminUi";
import { useAdminI18n } from "@/components/admin/AdminShell";
import type { AdminStaffUser } from "@/lib/admin-users-data";

const copy = {
  en: {
    caption: "Create staff login accounts and control who can access each work center.",
    createStaff: "Create Staff Account",
    name: "Name",
    email: "Email",
    password: "Temporary Password",
    role: "Role",
    employeeNo: "Employee No.",
    notes: "Notes",
    status: "Status",
    actions: "Actions",
    active: "Active",
    inactive: "Inactive",
    save: "Save",
    create: "Create Account",
    ownerPassword: "Owner Password",
    activate: "Activate",
    deactivate: "Deactivate",
    saved: "Saved.",
    refresh: "Refresh",
    noUsers: "No staff users found.",
    ownerHint: "Owner/Admin can create staff accounts. Staff users cannot create other admin users.",
    roleGuideTitle: "Role guide",
    roleGuide: [
      { role: "sales", description: "Sales Desk only. Create offline sales slips and view own sales." },
      { role: "cashier", description: "Cashier Center and Cash Drawer. Confirm offline payments and cash totals." },
      { role: "warehouse", description: "Products and online orders. Check stock, prepare items, and update product data." },
      { role: "staff", description: "Basic staff access. Sales Desk plus product lookup." },
      { role: "admin", description: "Manage products, orders, customers, reports, and staff accounts." },
      { role: "owner", description: "Full access, including owner-level password actions and sensitive records." },
    ],
  },
  zh: {
    caption: "在后台创建员工登录账号，并控制谁可以进入各个工作中心。",
    createStaff: "创建员工账号",
    name: "姓名",
    email: "邮箱",
    password: "临时密码",
    role: "权限",
    employeeNo: "工号",
    notes: "备注",
    status: "状态",
    actions: "操作",
    active: "启用",
    inactive: "停用",
    save: "保存",
    create: "创建账号",
    ownerPassword: "老板密码",
    activate: "启用",
    deactivate: "停用",
    saved: "已保存。",
    refresh: "刷新",
    noUsers: "暂无员工账号。",
    ownerHint: "Owner/Admin 可以创建员工账号。普通员工不能创建其他后台账号。",
    roleGuideTitle: "权限说明",
    roleGuide: [
      { role: "sales", description: "只进销售开单。负责线下开销售单，并查看自己的销售额。" },
      { role: "cashier", description: "进入收银中心和钱箱。负责确认线下收款和核对现金。" },
      { role: "warehouse", description: "进入商品和线上订单。负责查库存、备货和维护商品资料。" },
      { role: "staff", description: "基础员工权限。可用销售开单，也可查商品价格。" },
      { role: "admin", description: "管理商品、订单、客户、报表和员工账号。" },
      { role: "owner", description: "最高权限，可以做老板密码相关操作和查看敏感记录。" },
    ],
  },
};

const roleOptions = ["sales", "cashier", "warehouse", "staff", "admin", "owner"];

type ApiUser = {
  id: string;
  auth_user_id?: string | null;
  authUserId?: string;
  email: string | null;
  name: string | null;
  role: string | null;
  active: boolean | null;
  employee_no?: string | null;
  employeeNo?: string;
  notes?: string | null;
  created_at?: string | null;
  createdAt?: string;
};

function mapUser(user: ApiUser): AdminStaffUser {
  return {
    id: user.id,
    authUserId: user.authUserId ?? user.auth_user_id ?? "",
    email: user.email ?? "",
    name: user.name || user.email || "Admin User",
    role: user.role ?? "staff",
    active: user.active ?? false,
    employeeNo: user.employeeNo ?? user.employee_no ?? "",
    notes: user.notes ?? "",
    createdAt: user.createdAt ?? user.created_at ?? "",
  };
}

function inputClass() {
  return "h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-900 outline-none focus:border-orange-500";
}

function tableInputClass() {
  return "h-10 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs font-bold text-zinc-900 outline-none focus:border-orange-500";
}

function StaffUserRow({
  user,
  t,
  loading,
  onSave,
  onToggleActive,
}: {
  user: AdminStaffUser;
  t: (typeof copy)["en"];
  loading: boolean;
  onSave: (id: string, patch: Record<string, unknown>) => void;
  onToggleActive: (id: string, active: boolean) => void;
}) {
  const [draft, setDraft] = useState({
    name: user.name,
    employeeNo: user.employeeNo,
    role: user.role,
    notes: user.notes,
  });

  const dirty =
    draft.name !== user.name ||
    draft.employeeNo !== user.employeeNo ||
    draft.role !== user.role ||
    draft.notes !== user.notes;

  return (
    <tr>
      <td className="px-4 py-4">
        <input
          className={tableInputClass()}
          value={draft.name}
          onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
        />
      </td>
      <td className="px-4 py-4 text-zinc-600">{user.email}</td>
      <td className="px-4 py-4">
        <input
          className={tableInputClass()}
          value={draft.employeeNo}
          onChange={(event) => setDraft((current) => ({ ...current, employeeNo: event.target.value }))}
        />
      </td>
      <td className="px-4 py-4">
        <select className={tableInputClass()} value={draft.role} onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value }))}>
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-4">
        <StatusPill tone={user.active ? "green" : "neutral"}>{user.active ? t.active : t.inactive}</StatusPill>
      </td>
      <td className="px-4 py-4">
        <input
          className={tableInputClass()}
          value={draft.notes}
          onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
        />
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading || !dirty}
            onClick={() => onSave(user.id, draft)}
            className="rounded-md bg-zinc-950 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t.save}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => onToggleActive(user.id, !user.active)}
            className="rounded-md border border-orange-200 px-3 py-2 text-xs font-black text-orange-700 disabled:opacity-60"
          >
            {user.active ? t.deactivate : t.activate}
          </button>
        </div>
      </td>
    </tr>
  );
}

export function AdminStaffClient({ initialUsers, initialError }: { initialUsers: AdminStaffUser[]; initialError?: string }) {
  const { language } = useAdminI18n();
  const t = copy[language];
  const [users, setUsers] = useState(initialUsers);
  const [message, setMessage] = useState(initialError ?? "");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
    employeeNo: "",
    notes: "",
  });
  const [ownerPassword, setOwnerPassword] = useState("");

  async function refresh() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/staff");
      const result = (await response.json()) as { ok?: boolean; message?: string; users?: ApiUser[] };

      if (!response.ok || !result.ok) {
        setMessage(result.message ?? "Unable to load staff users.");
        return;
      }

      setUsers((result.users ?? []).map(mapUser));
    } finally {
      setLoading(false);
    }
  }

  async function createStaff() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...draft, ownerPassword }),
      });
      const result = (await response.json()) as { ok?: boolean; message?: string; user?: ApiUser };

      if (!response.ok || !result.ok || !result.user) {
        setMessage(result.message ?? "Unable to create staff account.");
        return;
      }

      setUsers((current) => [mapUser(result.user as ApiUser), ...current]);
      setDraft({ name: "", email: "", password: "", role: "staff", employeeNo: "", notes: "" });
      setMessage(t.saved);
    } finally {
      setLoading(false);
    }
  }

  async function updateStaff(id: string, patch: Record<string, unknown>) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/staff/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...patch, ownerPassword }),
      });
      const result = (await response.json()) as { ok?: boolean; message?: string; user?: ApiUser };

      if (!response.ok || !result.ok || !result.user) {
        setMessage(result.message ?? "Unable to update staff account.");
        return;
      }

      const nextUser = mapUser(result.user);
      setUsers((current) => current.map((user) => (user.id === id ? nextUser : user)));
      setMessage(t.saved);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <AdminPageTitle titleKey="staffAccess" caption={t.caption} />

      <div className="rounded-md border border-orange-200 bg-orange-50 p-3 text-sm font-bold text-orange-800">{t.ownerHint}</div>
      {message ? <div className="rounded-md border border-zinc-200 bg-white p-3 text-sm font-bold text-zinc-700">{message}</div> : null}

      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-black uppercase tracking-[0.14em] text-zinc-500">{t.roleGuideTitle}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {t.roleGuide.map((item) => (
            <div key={item.role} className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
              <p className="text-sm font-black text-zinc-950">{item.role}</p>
              <p className="mt-1 text-xs font-bold leading-5 text-zinc-600">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <label className="block max-w-sm">
          <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">{t.ownerPassword}</span>
          <input
            className={`${inputClass()} mt-2`}
            type="password"
            value={ownerPassword}
            onChange={(event) => setOwnerPassword(event.target.value)}
            placeholder={t.ownerPassword}
          />
        </label>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-black text-zinc-950">{t.createStaff}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <input className={inputClass()} placeholder={t.name} value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
          <input className={inputClass()} placeholder={t.email} value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} />
          <input className={inputClass()} placeholder={t.password} type="password" value={draft.password} onChange={(event) => setDraft((current) => ({ ...current, password: event.target.value }))} />
          <select className={inputClass()} value={draft.role} onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value }))}>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <input className={inputClass()} placeholder={t.employeeNo} value={draft.employeeNo} onChange={(event) => setDraft((current) => ({ ...current, employeeNo: event.target.value }))} />
          <input className={inputClass()} placeholder={t.notes} value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} />
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" disabled={loading} onClick={() => void createStaff()} className="rounded-md bg-[#f65f18] px-5 py-2.5 text-sm font-black text-white disabled:opacity-60">
            {t.create}
          </button>
          <button type="button" disabled={loading} onClick={() => void refresh()} className="rounded-md border border-zinc-200 bg-white px-5 py-2.5 text-sm font-black text-zinc-700 disabled:opacity-60">
            {t.refresh}
          </button>
        </div>
      </section>

      <TableShell>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
              <tr>
                <th className="px-4 py-3">{t.name}</th>
                <th className="px-4 py-3">{t.email}</th>
                <th className="px-4 py-3">{t.employeeNo}</th>
                <th className="px-4 py-3">{t.role}</th>
                <th className="px-4 py-3">{t.status}</th>
                <th className="px-4 py-3">{t.notes}</th>
                <th className="px-4 py-3">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {users.length ? (
                users.map((user) => (
                  <StaffUserRow
                    key={`${user.id}:${user.name}:${user.employeeNo}:${user.role}:${user.notes}`}
                    user={user}
                    t={t}
                    loading={loading}
                    onSave={(id, patch) => void updateStaff(id, patch)}
                    onToggleActive={(id, active) => void updateStaff(id, { active })}
                  />
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-center text-sm font-bold text-zinc-500" colSpan={7}>
                    {t.noUsers}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </TableShell>
    </div>
  );
}
