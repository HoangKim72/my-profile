"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { registerUser } from "@/actions/auth";
import {
  Button,
  Card,
  Field,
  Input,
  fieldDescribedBy,
} from "@/components/ui";
import { FullscreenLoader } from "@/components/ui/FullscreenLoader";
import { initialAuthActionState } from "@/lib/validators/auth";

const ERROR_ID = "register-error";
const PASSWORD_HINT = "Tối thiểu 8 ký tự.";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(
    registerUser,
    initialAuthActionState,
  );

  const hasError = Boolean(state.error);
  const withError = (ids?: string) =>
    [ids, hasError ? ERROR_ID : undefined].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="mx-auto w-full max-w-md py-8">
      {isPending && (
        <FullscreenLoader
          title="Đang tạo tài khoản"
          description="Vui lòng chờ trong giây lát trong khi hệ thống tạo tài khoản, đăng nhập và chuyển bạn vào bảng điều khiển."
        />
      )}

      <Card padding="lg">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Tạo tài khoản
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Đăng ký để dùng các công cụ và kho tài liệu.
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
              aria-describedby={withError()}
              invalid={hasError}
              required
            />
          </Field>

          <Field
            htmlFor="password"
            label="Mật khẩu"
            hint={PASSWORD_HINT}
            required
          >
            <Input
              type="password"
              id="password"
              name="password"
              placeholder="Tối thiểu 8 ký tự"
              autoComplete="new-password"
              minLength={8}
              aria-describedby={withError(
                fieldDescribedBy("password", { hint: PASSWORD_HINT }),
              )}
              invalid={hasError}
              required
            />
          </Field>

          <Field htmlFor="confirmPassword" label="Nhập lại mật khẩu" required>
            <Input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Nhập lại mật khẩu"
              autoComplete="new-password"
              minLength={8}
              aria-describedby={withError()}
              invalid={hasError}
              required
            />
          </Field>

          <Button type="submit" fullWidth loading={isPending}>
            {isPending ? "Đang tạo tài khoản…" : "Tạo tài khoản"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Đã có tài khoản?{" "}
          <Link
            href="/login"
            className="font-medium text-accent underline-offset-4 transition-colors hover:text-accent-hover hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </Card>
    </div>
  );
}
