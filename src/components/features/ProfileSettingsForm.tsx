"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Camera, CheckCircle2, UploadCloud } from "lucide-react";
import {
  Button,
  Card,
  Field,
  Input,
  Textarea,
  cn,
  fieldDescribedBy,
} from "@/components/ui";
import { updateProfile } from "@/actions/profile";
import {
  joinTextareaList,
  normalizeTextareaList,
  parseResumeContent,
  serializeResumeContent,
} from "@/lib/profile/resume-content";
import type { UpdateProfileInput } from "@/lib/validators/profile";

interface ProfileSettingsFormProps {
  initialData: UpdateProfileInput;
  authEmail: string;
}

interface ProfileSettingsFormState {
  fullName: string;
  headline: string;
  avatarUrl: string;
  summary: string;
  currentFocus: string;
  strengths: string;
  highlights: string;
  email: string;
  phone: string;
  githubUrl: string;
  linkedinUrl: string;
  facebookUrl: string;
  websiteUrl: string;
}

function toInputValue(value: string | null | undefined) {
  return value ?? "";
}

function toNullableValue(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function ProfileSettingsForm({
  initialData,
  authEmail,
}: ProfileSettingsFormProps) {
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const initialResumeContent = parseResumeContent(initialData.bio);
  const [formData, setFormData] = useState<ProfileSettingsFormState>({
    fullName: toInputValue(initialData.fullName),
    headline: toInputValue(initialData.headline),
    avatarUrl: toInputValue(initialData.avatarUrl),
    summary: toInputValue(initialResumeContent.summary),
    currentFocus: toInputValue(initialResumeContent.currentFocus),
    strengths: joinTextareaList(initialResumeContent.strengths),
    highlights: joinTextareaList(initialResumeContent.highlights),
    email: toInputValue(initialData.email),
    phone: toInputValue(initialData.phone),
    githubUrl: toInputValue(initialData.githubUrl),
    linkedinUrl: toInputValue(initialData.linkedinUrl),
    facebookUrl: toInputValue(initialData.facebookUrl),
    websiteUrl: toInputValue(initialData.websiteUrl),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
    /** Where to show it: next to the avatar picker or the submit button. */
    source?: "avatar" | "form";
  } | null>(null);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setMessage(null);
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsUploadingAvatar(true);
    setMessage(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("avatar", file, file.name);

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: uploadFormData,
      });

      const result = (await response.json()) as {
        error?: string;
        avatarUrl?: string;
      };

      if (!response.ok || !result.avatarUrl) {
        throw new Error(result.error || "Không thể tải ảnh đại diện lên.");
      }

      setFormData((prev) => ({
        ...prev,
        avatarUrl: result.avatarUrl ?? prev.avatarUrl,
      }));
      setMessage({
        type: "success",
        text: "Ảnh đại diện đã được tải lên thành công.",
        source: "avatar",
      });
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        source: "avatar",
        text:
          error instanceof Error
            ? error.message
            : "Không thể tải ảnh đại diện lên.",
      });
    } finally {
      event.target.value = "";
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const bio = serializeResumeContent({
        summary: formData.summary,
        currentFocus: formData.currentFocus,
        strengths: normalizeTextareaList(formData.strengths),
        highlights: normalizeTextareaList(formData.highlights),
      });

      if (bio && bio.length > 4000) {
        setMessage({
          type: "error",
          text: "Nội dung CV đang quá dài. Vui lòng rút gọn bớt để lưu được.",
        });
        return;
      }

      const payload: UpdateProfileInput = {
        fullName: toNullableValue(formData.fullName),
        headline: toNullableValue(formData.headline),
        bio,
        avatarUrl: toNullableValue(formData.avatarUrl),
        email: toNullableValue(formData.email),
        phone: toNullableValue(formData.phone),
        githubUrl: toNullableValue(formData.githubUrl),
        linkedinUrl: toNullableValue(formData.linkedinUrl),
        facebookUrl: toNullableValue(formData.facebookUrl),
        websiteUrl: toNullableValue(formData.websiteUrl),
      };

      const result = await updateProfile(payload);

      if (!result.success) {
        setMessage({
          type: "error",
          text: result.error || "Không thể cập nhật hồ sơ.",
        });
        return;
      }

      setMessage({
        type: "success",
        text: "Thông tin hồ sơ đã được cập nhật.",
      });
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Không thể cập nhật hồ sơ.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const summaryHint = "Giới thiệu ngắn gọn về bản thân, kinh nghiệm và thế mạnh.";
  const listHint = "Mỗi dòng là một ý.";
  const avatarHint =
    "Hỗ trợ JPEG, PNG, WebP, GIF. Kích thước tối đa theo cấu hình upload hiện tại.";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="rounded-lg border border-line bg-sunken p-4 text-sm text-muted">
        Email đăng nhập:{" "}
        <span className="break-all font-medium text-ink">{authEmail}</span>
        <br />
        Các thay đổi bên dưới sẽ hiển thị trên trang Giới thiệu và CV công khai.
      </p>

      <Card as="section" aria-labelledby="avatar-heading">
        <h2 id="avatar-heading" className="text-lg font-semibold text-ink">
          Ảnh đại diện
        </h2>
        <p className="mt-1 text-sm text-muted">
          Ảnh này sẽ hiển thị trên trang Giới thiệu và CV công khai.
        </p>

        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative h-40 w-32 shrink-0 overflow-hidden rounded-xl border border-line bg-sunken">
            {formData.avatarUrl ? (
              <Image
                src={formData.avatarUrl}
                alt="Ảnh đại diện hiện tại"
                fill
                sizes="128px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-soft text-2xl font-semibold uppercase text-accent"
                  aria-hidden="true"
                >
                  {(formData.fullName || "AC")
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("") || "AC"}
                </div>
                <span className="sr-only">Chưa có ảnh đại diện</span>
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-3">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarUpload}
            />

            <Button
              variant="secondary"
              onClick={() => avatarInputRef.current?.click()}
              loading={isUploadingAvatar}
              leftIcon={<UploadCloud size={16} aria-hidden="true" />}
              aria-describedby="avatar-hint"
            >
              {isUploadingAvatar ? "Đang tải ảnh..." : "Tải ảnh mới"}
            </Button>

            <p
              id="avatar-hint"
              className="flex items-start gap-2 text-sm text-muted"
            >
              <Camera size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              {avatarHint}
            </p>

            <FormMessage message={message} source="avatar" />
          </div>
        </div>
      </Card>

      <Card as="section" aria-labelledby="about-heading">
        <h2 id="about-heading" className="text-lg font-semibold text-ink">
          Thông tin hồ sơ công khai
        </h2>
        <p className="mt-1 text-sm text-muted">
          Cập nhật phần Giới thiệu theo bố cục giống CV.
        </p>

        <div className="mt-6 space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Họ tên" htmlFor="profile-fullName">
              <Input
                id="profile-fullName"
                type="text"
                name="fullName"
                autoComplete="name"
                value={formData.fullName}
                onChange={handleChange}
              />
            </Field>

            <Field label="Chức danh" htmlFor="profile-headline">
              <Input
                id="profile-headline"
                type="text"
                name="headline"
                value={formData.headline}
                onChange={handleChange}
                placeholder="Ví dụ: Full Stack Developer"
              />
            </Field>
          </div>

          <Field
            label="Tóm tắt giới thiệu"
            htmlFor="profile-summary"
            hint={summaryHint}
          >
            <Textarea
              id="profile-summary"
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              placeholder="Giới thiệu ngắn gọn về bản thân, kinh nghiệm và thế mạnh..."
              rows={6}
              aria-describedby={fieldDescribedBy("profile-summary", {
                hint: summaryHint,
              })}
            />
          </Field>

          <Field label="Định hướng hiện tại" htmlFor="profile-currentFocus">
            <Textarea
              id="profile-currentFocus"
              name="currentFocus"
              value={formData.currentFocus}
              onChange={handleChange}
              placeholder="Bạn đang tập trung xây dựng kỹ năng, sản phẩm hay mục tiêu nào?"
              rows={4}
            />
          </Field>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field
              label="Điểm mạnh"
              htmlFor="profile-strengths"
              hint={listHint}
            >
              <Textarea
                id="profile-strengths"
                name="strengths"
                value={formData.strengths}
                onChange={handleChange}
                placeholder={
                  "Xây dựng web app\nThiết kế dashboard\nTối ưu quy trình"
                }
                rows={6}
                aria-describedby={fieldDescribedBy("profile-strengths", {
                  hint: listHint,
                })}
              />
            </Field>

            <Field
              label="Điểm nhấn / dấu ấn"
              htmlFor="profile-highlights"
              hint={listHint}
            >
              <Textarea
                id="profile-highlights"
                name="highlights"
                value={formData.highlights}
                onChange={handleChange}
                placeholder={
                  "Đã có dashboard quản trị\nĐã deploy Vercel\nĐang phát triển bộ công cụ"
                }
                rows={6}
                aria-describedby={fieldDescribedBy("profile-highlights", {
                  hint: listHint,
                })}
              />
            </Field>
          </div>
        </div>
      </Card>

      <Card as="section" aria-labelledby="contact-heading">
        <h2 id="contact-heading" className="text-lg font-semibold text-ink">
          Thông tin liên hệ
        </h2>
        <p className="mt-1 text-sm text-muted">
          Các mục này xuất hiện ở cột bên của trang Giới thiệu và CV.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          {CONTACT_FIELDS.map((field) => (
            <Field
              key={field.name}
              label={field.label}
              htmlFor={`profile-${field.name}`}
            >
              <Input
                id={`profile-${field.name}`}
                type={field.type}
                name={field.name}
                autoComplete={field.autoComplete}
                value={formData[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
              />
            </Field>
          ))}
        </div>
      </Card>

      <div className="space-y-3">
        <FormMessage message={message} source="form" />
        <Button type="submit" loading={isLoading}>
          {isLoading ? "Đang lưu..." : "Lưu thông tin"}
        </Button>
      </div>
    </form>
  );
}

const CONTACT_FIELDS: Array<{
  name:
    | "email"
    | "phone"
    | "githubUrl"
    | "linkedinUrl"
    | "facebookUrl"
    | "websiteUrl";
  label: string;
  type: "email" | "tel" | "url";
  placeholder: string;
  autoComplete?: string;
}> = [
  {
    name: "email",
    label: "Email công khai",
    type: "email",
    placeholder: "contact@example.com",
    autoComplete: "email",
  },
  {
    name: "phone",
    label: "Số điện thoại",
    type: "tel",
    placeholder: "+84 ...",
    autoComplete: "tel",
  },
  {
    name: "githubUrl",
    label: "GitHub URL",
    type: "url",
    placeholder: "https://github.com/...",
  },
  {
    name: "linkedinUrl",
    label: "LinkedIn URL",
    type: "url",
    placeholder: "https://linkedin.com/in/...",
  },
  {
    name: "facebookUrl",
    label: "Facebook URL",
    type: "url",
    placeholder: "https://facebook.com/...",
  },
  {
    name: "websiteUrl",
    label: "Địa chỉ website",
    type: "url",
    placeholder: "https://...",
  },
];

function FormMessage({
  message,
  source,
}: {
  message: {
    type: "success" | "error";
    text: string;
    source?: "avatar" | "form";
  } | null;
  source: "avatar" | "form";
}) {
  if (!message || (message.source ?? "form") !== source) {
    return null;
  }

  const isError = message.type === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <p
      role={isError ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-lg border p-3 text-sm",
        isError
          ? "border-danger/30 bg-danger-soft text-danger"
          : "border-success/30 bg-success-soft text-success",
      )}
    >
      <Icon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      {message.text}
    </p>
  );
}
