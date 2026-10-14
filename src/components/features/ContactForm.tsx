// src/components/features/ContactForm.tsx

"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Send } from "lucide-react";
import {
  contactMessageSchema,
  ContactMessageInput,
} from "@/lib/validators/contact";
import type { ContactActionResult } from "@/actions/contact";
import {
  Button,
  Field,
  Input,
  Textarea,
  fieldDescribedBy,
} from "@/components/ui";

const EMPTY_FORM = {
  name: "",
  email: "",
  subject: "",
  message: "",
  website: "",
};

type VisibleField = "name" | "email" | "subject" | "message";
type FieldErrors = Partial<Record<VisibleField, string>>;

const VISIBLE_FIELDS: VisibleField[] = ["name", "email", "subject", "message"];

interface ContactFormProps {
  onSubmit: (data: ContactMessageInput) => Promise<ContactActionResult>;
}

export function ContactForm({ onSubmit }: ContactFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSent, setIsSent] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) =>
      name in prev ? { ...prev, [name]: undefined } : prev,
    );
    setError(null);
    setIsSent(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setFieldErrors({});
    setIsSent(false);

    try {
      const parsed = contactMessageSchema.safeParse(formData);

      if (!parsed.success) {
        const nextErrors: FieldErrors = {};
        for (const issue of parsed.error.issues) {
          const key = issue.path[0];
          if (
            typeof key === "string" &&
            (VISIBLE_FIELDS as string[]).includes(key) &&
            !nextErrors[key as VisibleField]
          ) {
            nextErrors[key as VisibleField] = issue.message;
          }
        }
        setFieldErrors(nextErrors);
        if (Object.keys(nextErrors).length === 0) {
          setError(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ");
        }
        return;
      }

      const result = await onSubmit(parsed.data);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setFormData(EMPTY_FORM);
      setIsSent(true);
    } catch {
      setError("Không thể gửi tin nhắn lúc này. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const controlProps = (id: VisibleField, hint?: string) => ({
    id,
    name: id,
    value: formData[id],
    onChange: handleChange,
    invalid: Boolean(fieldErrors[id]),
    "aria-describedby": fieldDescribedBy(id, {
      hint,
      error: fieldErrors[id],
    }),
    required: true,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div aria-live="polite">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm text-danger"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {isSent && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-lg border border-success/30 bg-success-soft p-3 text-sm text-success"
          >
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>Đã gửi tin nhắn. Mình sẽ phản hồi sớm nhất có thể.</span>
          </div>
        )}
      </div>

      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={formData.website}
          onChange={handleChange}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field htmlFor="name" label="Họ tên" error={fieldErrors.name} required>
          <Input
            type="text"
            placeholder="Tên của bạn"
            autoComplete="name"
            {...controlProps("name")}
          />
        </Field>

        <Field
          htmlFor="email"
          label="Email"
          error={fieldErrors.email}
          required
        >
          <Input
            type="email"
            placeholder="ban@example.com"
            autoComplete="email"
            {...controlProps("email")}
          />
        </Field>
      </div>

      <Field
        htmlFor="subject"
        label="Tiêu đề"
        error={fieldErrors.subject}
        required
      >
        <Input
          type="text"
          placeholder="Bạn muốn trao đổi về điều gì?"
          {...controlProps("subject")}
        />
      </Field>

      <Field
        htmlFor="message"
        label="Nội dung"
        hint="Ít nhất 10 ký tự."
        error={fieldErrors.message}
        required
      >
        <Textarea
          placeholder="Nội dung tin nhắn…"
          rows={6}
          {...controlProps("message", "Ít nhất 10 ký tự.")}
        />
      </Field>

      <Button
        type="submit"
        fullWidth
        loading={isLoading}
        leftIcon={<Send size={16} aria-hidden="true" />}
      >
        {isLoading ? "Đang gửi…" : "Gửi tin nhắn"}
      </Button>
    </form>
  );
}
