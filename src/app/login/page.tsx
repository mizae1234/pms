"use client";

import { useActionState, useState } from "react";
import { login, type LoginState } from "@/app/actions/auth";
import { Building2, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    undefined
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-primary via-blue-600 to-accent relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 h-64 w-64 rounded-full bg-white/5 blur-sm" />
        <div className="absolute bottom-32 right-16 h-48 w-48 rounded-full bg-white/10 blur-sm" />
        <div className="absolute top-1/2 left-1/3 h-32 w-32 rounded-full bg-white/5" />

        <div className="relative z-10 text-center px-12">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm shadow-lg">
            <Building2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">PMS</h1>
          <p className="text-lg text-white/80 leading-relaxed">
            Property Management System
            <br />
            <span className="text-white/60 text-sm">
              ระบบบริหารธุรกิจให้เช่าอสังหาริมทรัพย์
            </span>
          </p>
          <div className="mt-8 flex items-center justify-center gap-6 text-white/50 text-sm">
            <span>🏨 Hotel</span>
            <span className="h-4 w-px bg-white/20" />
            <span>🏢 Apartment</span>
            <span className="h-4 w-px bg-white/20" />
            <span>📊 Multi-branch</span>
          </div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex flex-1 items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-white">
              <Building2 className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">PMS</h1>
            <p className="text-sm text-text-muted">
              Property Management System
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-white p-8 shadow-lg">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-text-primary">
                เข้าสู่ระบบ
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                กรอกอีเมลและรหัสผ่านเพื่อเข้าใช้งาน
              </p>
            </div>

            {/* Error message */}
            {state?.message && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
                <svg
                  className="h-4 w-4 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {state.message}
              </div>
            )}

            <form action={action} className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-text-secondary"
                >
                  อีเมล
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-text-muted" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@company.com"
                    className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                {state?.errors?.email && (
                  <p className="mt-1 text-xs text-red-500">
                    {state.errors.email[0]}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-text-secondary"
                >
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-text-muted" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-11 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {state?.errors?.password && (
                  <p className="mt-1 text-xs text-red-500">
                    {state.errors.password[0]}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={pending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  "เข้าสู่ระบบ"
                )}
              </button>
            </form>

            {/* Demo accounts */}
            <div className="mt-6 border-t border-border pt-4">
              <p className="mb-3 text-center text-xs text-text-muted">
                บัญชีทดสอบ (Demo)
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-lg bg-blue-50 px-3 py-2 text-center">
                  <p className="font-semibold text-blue-700">Owner</p>
                  <p className="text-blue-500 mt-0.5">owner@pms.com</p>
                </div>
                <div className="rounded-lg bg-emerald-50 px-3 py-2 text-center">
                  <p className="font-semibold text-emerald-700">Manager</p>
                  <p className="text-emerald-500 mt-0.5">manager@pms.com</p>
                </div>
                <div className="rounded-lg bg-amber-50 px-3 py-2 text-center">
                  <p className="font-semibold text-amber-700">Staff</p>
                  <p className="text-amber-500 mt-0.5">staff@pms.com</p>
                </div>
                <div className="rounded-lg bg-purple-50 px-3 py-2 text-center">
                  <p className="font-semibold text-purple-700">Housekeeper</p>
                  <p className="text-purple-500 mt-0.5">housekeeper@pms.com</p>
                </div>
              </div>
              <p className="mt-2 text-center text-[10px] text-text-muted">
                รหัสผ่าน: <span className="font-mono">password123</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
