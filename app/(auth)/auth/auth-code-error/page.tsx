import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { ButtonLink, Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Xác thực không thành công",
  description: "Không thể hoàn tất đăng nhập hoặc xác nhận email.",
};

export default function AuthCodeErrorPage() {
  return (
    <div className="mx-auto w-full max-w-xl py-8">
      <Card padding="lg">
        <div
          className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger"
          aria-hidden="true"
        >
          <AlertTriangle size={22} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Xác thực không thành công
        </h1>
        <p className="mt-3 text-base leading-7 text-muted">
          Không thể hoàn tất yêu cầu đăng nhập hoặc xác nhận email. Vui lòng
          thử lại, hoặc quay về trang đăng nhập để bắt đầu lại.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href="/login">Về trang đăng nhập</ButtonLink>
          <ButtonLink href="/" variant="secondary">
            Về trang chủ
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
