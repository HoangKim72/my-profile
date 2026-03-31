"use client";

import { useActionState, useRef } from "react";
import Link from "next/link";
import { loginUser } from "@/actions/auth";
import { FullscreenLoader } from "@/components/ui/FullscreenLoader";
import { initialAuthActionState } from "@/lib/validators/auth";

export default function LoginPage() {
  const formStartedAtInputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, isPending] = useActionState(
    loginUser,
    initialAuthActionState,
  );

  const markFormInteraction = () => {
    if (
      formStartedAtInputRef.current &&
      formStartedAtInputRef.current.value === "0"
    ) {
      formStartedAtInputRef.current.value = String(Date.now());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      {isPending && (
        <FullscreenLoader
          title="Dang dang nhap"
          description="Vui long cho trong giay lat trong khi he thong xac thuc tai khoan va chuyen ban vao dashboard."
        />
      )}

      <div className="w-full max-w-md">
        <div className="card p-8">
          <h1 className="text-3xl font-bold mb-2 text-center">Welcome Back</h1>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
            Sign in to your account to access your dashboard
          </p>

          {state.error && (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 rounded-lg">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-6">
            <input
              type="hidden"
              name="formStartedAt"
              defaultValue="0"
              ref={formStartedAtInputRef}
            />

            <div className="hidden" aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="you@example.com"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="email"
                onFocus={markFormInteraction}
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="current-password"
                onFocus={markFormInteraction}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-gray-600 dark:text-gray-400 mt-6">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
