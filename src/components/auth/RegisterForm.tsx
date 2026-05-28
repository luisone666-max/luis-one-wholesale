"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { GoogleQuickSignInButton } from "@/components/auth/GoogleQuickSignInButton";
import { trackMetaEvent } from "@/components/MetaPixel";
import { getFriendlyAuthError } from "@/lib/customer-auth";

const businessTypes = ["Reseller", "Shop Owner", "Online Seller", "Walk-in Buyer", "Other"];

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    facebookName: "",
    location: "",
    businessType: "Reseller",
    password: "",
    confirmPassword: "",
  });

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/customer-auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessage(getFriendlyAuthError(result.error ?? "Registration failed."));
        return;
      }

      trackMetaEvent("CompleteRegistration", {
        content_name: "Wholesale account registration",
        status: true,
      });
      router.push("/login?registered=1");
    } catch {
      setMessage("Unable to register right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-sm border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-black text-zinc-950">Create Your Wholesale Account</h2>
      <p className="mt-2 text-sm text-zinc-600">Register to place wholesale orders with Luis One Supply Hub.</p>
      <div className="mt-5 rounded-sm border border-orange-100 bg-orange-50 p-3">
        <p className="text-sm font-black text-zinc-950">Quick sign in</p>
        <p className="mt-1 text-xs font-bold text-zinc-500">Use Google to create a customer account without setting a password.</p>
        <GoogleQuickSignInButton className="mt-3" />
      </div>
      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-zinc-200" />
        <span className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400">or create with email</span>
        <span className="h-px flex-1 bg-zinc-200" />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Full Name" value={form.fullName} onChange={(value) => updateField("fullName", value)} required />
        <Field label="Phone Number" value={form.phone} onChange={(value) => updateField("phone", value)} required />
        <Field label="Email" type="email" value={form.email} onChange={(value) => updateField("email", value)} required />
        <Field
          label="Facebook / Messenger Name"
          value={form.facebookName}
          onChange={(value) => updateField("facebookName", value)}
        />
        <Field label="Location" value={form.location} onChange={(value) => updateField("location", value)} />
        <label className="block text-sm font-bold text-zinc-800">
          Business Type
          <select
            value={form.businessType}
            onChange={(event) => updateField("businessType", event.target.value)}
            className="mt-2 h-12 w-full rounded-sm border border-zinc-200 bg-white px-4 outline-none focus:border-orange-500"
          >
            {businessTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <Field label="Password" type="password" value={form.password} onChange={(value) => updateField("password", value)} required />
        <Field
          label="Confirm Password"
          type="password"
          value={form.confirmPassword}
          onChange={(value) => updateField("confirmPassword", value)}
          required
        />
      </div>
      {message ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{message}</p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="mt-6 h-12 w-full rounded-sm bg-[#f65f18] text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-orange-300"
      >
        {loading ? "Creating Account..." : "Register"}
      </button>
      <p className="mt-4 text-center text-sm text-zinc-600">
        Already have an account?{" "}
        <Link href="/login" className="font-black text-orange-700">
          Login
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-bold text-zinc-800">
      {label}
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-sm border border-zinc-200 px-4 outline-none focus:border-orange-500"
      />
    </label>
  );
}
