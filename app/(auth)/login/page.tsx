"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { loginUser } from "@/actions/auth";
import { Button, Card, Field, Input } from "@/components/ui";
import { FullscreenLoader } from "@/components/ui/FullscreenLoader";
import { initialAuthActionState } from "@/lib/validators/auth";

const ERROR_ID = "login-error";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    loginUser,
    initialAuthActionState,
  );

  const describedBy = state.error ? ERROR_ID : undefined;

  return (
    <div className="mx-auto w-full max-w-md py-8">
      {isPending && (
        <FullscreenLoader
          title="Đang đăng nhập"
          description="Vui lòng chờ trong giây lát trong khi hệ thống xác thực tài khoản và chuyển bạn vào bảng điều khiển."
        />
      )}

      <Card padding="lg">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Chào mừng trở lại
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Đăng nhập để vào bảng điều khiển của bạn.
        </p>

        <form action={formAction} className="mt-6 space-y-5">
          {state.error && (
            <div
              id={ERROR_ID}
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm text-danger"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{state.error}</span>
            </div>
          )}

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

          <Field htmlFor="email" label="Email" required>
            <Input
              type="email"
              id="email"
              name="email"
              placeholder="ban@example.com"
              autoComplete="email"
              aria-describedby={describedBy}
              invalid={Boolean(state.error)}
              required
            />
          </Field>

          <Field htmlFor="password" label="Mật khẩu" required>
            <Input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              autoComplete="current-password"
              aria-describedby={describedBy}
              invalid={Boolean(state.error)}
              required
            />
          </Field>

          <Button type="submit" fullWidth loading={isPending}>
            {isPending ? "Đang đăng nhập…" : "Đăng nhập"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Chưa có tài khoản?{" "}
          <Link
            href="/register"
            className="font-medium text-accent underline-offset-4 transition-colors hover:text-accent-hover hover:underline"
          >
            Tạo tài khoản
          </Link>
        </p>
      </Card>
    </div>
  );
}
