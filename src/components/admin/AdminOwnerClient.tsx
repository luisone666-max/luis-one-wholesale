"use client";

import { useEffect, useState } from "react";
import { AdminPageTitle } from "@/components/admin/AdminUi";
import { useAdminI18n } from "@/components/admin/AdminShell";

const copy = {
  en: {
    caption: "Protected owner-only control center. Enter owner password before using sensitive controls.",
    enterPassword: "Enter Owner Password",
    unlock: "Unlock Owner Center",
    unlocked: "Owner center unlocked.",
    changePassword: "Change Owner Password",
    currentPassword: "Old Owner Password",
    highestPassword: "Highest Permission Password",
    newPassword: "New Owner Password",
    savePassword: "Save New Password",
    hint: "You can change the owner password with the old password. If the old password is forgotten, use the highest permission password.",
    sensitiveAreas: "Sensitive Areas",
    staffAccess: "Staff Access",
    reports: "Employee Sales Reports",
    cashDrawer: "Cash Drawer",
    auditLogs: "Security Audit Logs",
    auditCaption: "Latest sensitive admin actions across products, categories, orders, and staff.",
    noAuditLogs: "No audit logs yet.",
    auditNotReady: "Audit log table is not ready yet. Run the latest migration first.",
    open: "Open",
    ownerPasswordFailed: "Owner password failed.",
    passwordUpdateFailed: "Password update failed.",
    staffAccessCaption: "Create, deactivate, and assign staff roles.",
    reportsCaption: "See monthly employee sales totals.",
    cashDrawerCaption: "Open and close daily cash drawer.",
    time: "Time",
    admin: "Admin",
    action: "Action",
    target: "Target",
  },
  zh: {
    caption: "老板专用页面。进入敏感操作前必须输入老板密码。",
    enterPassword: "输入老板密码",
    unlock: "进入老板中心",
    unlocked: "老板中心已解锁。",
    changePassword: "修改老板密码",
    currentPassword: "旧老板密码",
    highestPassword: "最高权限密码",
    newPassword: "新老板密码",
    savePassword: "保存新密码",
    hint: "知道旧密码可以改新密码；如果忘记旧密码，可以用最高权限密码重置。",
    sensitiveAreas: "敏感功能入口",
    staffAccess: "员工权限",
    reports: "员工销售报表",
    cashDrawer: "收银钱箱",
    auditLogs: "安全操作记录",
    auditCaption: "最新敏感后台操作：商品、分类、订单、员工权限。",
    noAuditLogs: "暂无安全操作记录。",
    auditNotReady: "操作记录表还没有准备好，请先执行最新 migration。",
    open: "打开",
    ownerPasswordFailed: "老板密码验证失败。",
    passwordUpdateFailed: "老板密码修改失败。",
    staffAccessCaption: "创建、停用员工账号，并分配员工权限。",
    reportsCaption: "查看每个月每个员工的销售额。",
    cashDrawerCaption: "打开和关闭每日收银钱箱。",
    time: "时间",
    admin: "管理员",
    action: "操作",
    target: "对象",
  },
};

type AuditLog = {
  id: string;
  admin_email: string | null;
  admin_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
  created_at: string;
};

function inputClass() {
  return "h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-900 outline-none focus:border-orange-500";
}

function OwnerLink({ href, title, caption, button }: { href: string; title: string; caption: string; button: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-black text-zinc-950">{title}</h3>
      <p className="mt-2 text-sm font-bold leading-6 text-zinc-500">{caption}</p>
      <a href={href} className="mt-4 inline-flex rounded-md bg-[#f65f18] px-4 py-2 text-sm font-black text-white">
        {button}
      </a>
    </div>
  );
}

export function AdminOwnerClient() {
  const { language } = useAdminI18n();
  const t = copy[language];
  const [unlocked, setUnlocked] = useState(false);
  const [ownerPassword, setOwnerPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [highestPermissionPassword, setHighestPermissionPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditMessage, setAuditMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!unlocked) {
      return;
    }

    let active = true;

    void fetch("/api/admin/audit-logs")
      .then((response) => response.json())
      .then((result: { ok?: boolean; logs?: AuditLog[]; message?: string }) => {
        if (!active) {
          return;
        }

        setAuditLogs(result.logs ?? []);
        setAuditMessage(result.message ?? "");
      })
      .catch(() => {
        if (active) {
          setAuditMessage(t.auditNotReady);
        }
      });

    return () => {
      active = false;
    };
  }, [t.auditNotReady, unlocked]);

  async function unlock() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/owner/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ownerPassword }),
      });
      const result = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !result.ok) {
        setMessage(result.message ?? t.ownerPasswordFailed);
        return;
      }

      setUnlocked(true);
      setMessage(t.unlocked);
    } catch {
      setMessage(t.ownerPasswordFailed);
    } finally {
      setLoading(false);
    }
  }

  async function changePassword() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/owner/password", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword, highestPermissionPassword, newPassword }),
      });
      const result = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !result.ok) {
        setMessage(result.message ?? t.passwordUpdateFailed);
        return;
      }

      setOwnerPassword(newPassword);
      setCurrentPassword("");
      setHighestPermissionPassword("");
      setNewPassword("");
      setMessage(result.message ?? t.unlocked);
    } catch {
      setMessage(t.passwordUpdateFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <AdminPageTitle titleKey="ownerCenter" caption={t.caption} />

      {message ? <div className="rounded-md border border-orange-200 bg-orange-50 p-3 text-sm font-bold text-orange-800">{message}</div> : null}

      {!unlocked ? (
        <section className="max-w-md rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">{t.enterPassword}</span>
            <input className={`${inputClass()} mt-2`} type="password" value={ownerPassword} onChange={(event) => setOwnerPassword(event.target.value)} />
          </label>
          <button type="button" disabled={loading} onClick={() => void unlock()} className="mt-4 rounded-md bg-[#f65f18] px-5 py-2.5 text-sm font-black text-white disabled:opacity-60">
            {t.unlock}
          </button>
        </section>
      ) : (
        <>
          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-zinc-950">{t.changePassword}</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-zinc-500">{t.hint}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <input className={inputClass()} type="password" placeholder={t.currentPassword} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
              <input
                className={inputClass()}
                type="password"
                placeholder={t.highestPassword}
                value={highestPermissionPassword}
                onChange={(event) => setHighestPermissionPassword(event.target.value)}
              />
              <input className={inputClass()} type="password" placeholder={t.newPassword} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            </div>
            <button type="button" disabled={loading} onClick={() => void changePassword()} className="mt-4 rounded-md bg-zinc-950 px-5 py-2.5 text-sm font-black text-white disabled:opacity-60">
              {t.savePassword}
            </button>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-black text-zinc-950">{t.sensitiveAreas}</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <OwnerLink href="/admin/staff" title={t.staffAccess} caption={t.staffAccessCaption} button={t.open} />
              <OwnerLink href="/admin/reports" title={t.reports} caption={t.reportsCaption} button={t.open} />
              <OwnerLink href="/admin/cash-drawer" title={t.cashDrawer} caption={t.cashDrawerCaption} button={t.open} />
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-zinc-950">{t.auditLogs}</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-zinc-500">{t.auditCaption}</p>
            {auditMessage ? <p className="mt-3 rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-bold text-orange-700">{auditMessage}</p> : null}
            {auditLogs.length ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-zinc-50 text-xs uppercase tracking-[0.14em] text-zinc-500">
                    <tr>
                      <th className="px-3 py-2">{t.time}</th>
                      <th className="px-3 py-2">{t.admin}</th>
                      <th className="px-3 py-2">{t.action}</th>
                      <th className="px-3 py-2">{t.target}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-3 py-2 font-bold text-zinc-500">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="px-3 py-2 font-black text-zinc-900">
                          {log.admin_email ?? "-"} <span className="text-xs text-zinc-400">{log.admin_role}</span>
                        </td>
                        <td className="px-3 py-2 font-black text-orange-700">{log.action}</td>
                        <td className="px-3 py-2 font-bold text-zinc-600">{log.entity_type}: {log.entity_label ?? log.entity_id ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : !auditMessage ? (
              <p className="mt-4 text-sm font-bold text-zinc-500">{t.noAuditLogs}</p>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}
