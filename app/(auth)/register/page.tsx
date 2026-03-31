"use client";

import { useActionState, useRef } from "react";
import Link from "next/link";
import { registerUser } from "@/actions/auth";
import { FullscreenLoader } from "@/components/ui/FullscreenLoader";
import { initialAuthActionState } from "@/lib/validators/auth";

export default function RegisterPage() {
  const formStartedAtInputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, isPending] = useActionState(
    registerUser,
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
          title="Dang tao tai khoan"
          description="Vui long cho trong giay lat trong khi he thong tao tai khoan, dang nhap va chuyen ban vao dashboard."
        />
      )}

      <div className="w-full max-w-md">
        <div className="card p-8">
          <h1 className="text-3xl font-bold mb-2 text-center">
            Create Account
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
            Sign up to start building your portfolio
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
                placeholder="Minimum 8 characters"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="new-password"
                minLength={8}
                onFocus={markFormInteraction}
                required
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium mb-2"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Repeat your password"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="new-password"
                minLength={8}
                onFocus={markFormInteraction}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <p className="text-center text-gray-600 dark:text-gray-400 mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
