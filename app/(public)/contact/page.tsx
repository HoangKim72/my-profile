// app/(public)/contact/page.tsx

import type { Metadata } from "next";
import { submitContactMessage } from "@/actions/contact";
import { ContactForm } from "@/components/features/ContactForm";
import { Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Liên hệ",
  description: "Gửi câu hỏi, góp ý hoặc lời mời hợp tác.",
};

export default function ContactPage() {
  return (
    <div className="container-custom max-w-2xl py-10 sm:py-14">
      <PageHeader
        eyebrow="Liên hệ"
        title="Gửi tin nhắn cho mình"
        description="Bạn có câu hỏi hoặc muốn hợp tác? Điền form bên dưới, mình sẽ phản hồi sớm nhất có thể."
      />

      <Card padding="lg" className="mt-8">
        <ContactForm onSubmit={submitContactMessage} />
      </Card>
    </div>
  );
}
