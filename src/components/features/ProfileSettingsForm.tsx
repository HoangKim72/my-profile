"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader, UploadCloud } from "lucide-react";
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
        throw new Error(result.error || "Khong the tai anh dai dien len.");
      }

      setFormData((prev) => ({
        ...prev,
        avatarUrl: result.avatarUrl ?? prev.avatarUrl,
      }));
      setMessage({
        type: "success",
        text: "Anh dai dien da duoc tai len thanh cong.",
      });
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Khong the tai anh dai dien len.",
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
          text: "Noi dung CV dang qua dai. Vui long rut gon bot de luu duoc.",
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
          text: result.error || "Unable to update profile",
        });
        return;
      }

      setMessage({
        type: "success",
        text: "Thong tin ho so da duoc cap nhat.",
      });
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Unable to update profile",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
        Login email: <span className="font-medium">{authEmail}</span>
        <br />
        Cac thay doi ben duoi se duoc hien thi tren trang About va CV cong khai.
      </div>

      {message && (
        <div
          className={`mb-6 rounded-lg p-4 ${
            message.type === "success"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-8 p-8">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold">Thong tin ho so cong khai</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Day la noi admin co the cap nhat phan About theo bo cuc giong CV.
          </p>
        </div>

        <section className="space-y-6 rounded-3xl border border-blue-100 bg-blue-50/60 p-6 dark:border-blue-950/60 dark:bg-blue-950/20">
          <div>
            <h3 className="text-lg font-semibold">Anh dai dien</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Anh nay se hien thi tren trang About va CV cong khai.
            </p>
          </div>

          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div className="relative h-40 w-32 overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-[0_18px_50px_-28px_rgba(37,99,235,0.55)] dark:border-white/10 dark:bg-gray-900">
              {formData.avatarUrl ? (
                <Image
                  src={formData.avatarUrl}
                  alt="Anh dai dien hien tai"
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.96),rgba(191,219,254,0.85)_55%,rgba(147,197,253,0.8))] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),rgba(30,41,59,0.92)_55%,rgba(15,23,42,1))] dark:text-white">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/70 bg-white/80 text-2xl font-black uppercase tracking-[0.16em] shadow-[0_16px_40px_-24px_rgba(59,130,246,0.7)] dark:border-white/10 dark:bg-white/10">
                    {(formData.fullName || "AC")
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("") || "AC"}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarUpload}
              />

              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploadingAvatar ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <UploadCloud size={16} />
                )}
                {isUploadingAvatar ? "Dang tai anh..." : "Tai anh moi"}
              </button>

              <div className="flex items-start gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                <Camera size={16} className="mt-0.5 shrink-0" />
                Ho tro JPEG, PNG, WebP, GIF. Kich thuoc toi da theo cau hinh upload hien tai.
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Ho ten</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Headline</label>
              <input
                type="text"
                name="headline"
                value={formData.headline}
                onChange={handleChange}
                placeholder="Vi du: Full Stack Developer"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Tom tat gioi thieu
            </label>
            <textarea
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              placeholder="Gioi thieu ngan gon ve ban than, kinh nghiem va the manh..."
              rows={6}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Dinh huong hien tai
            </label>
            <textarea
              name="currentFocus"
              value={formData.currentFocus}
              onChange={handleChange}
              placeholder="Ban dang tap trung xay dung ky nang, san pham hay muc tieu nao?"
              rows={4}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Diem manh
              </label>
              <textarea
                name="strengths"
                value={formData.strengths}
                onChange={handleChange}
                placeholder={"Moi dong la mot y\nXay dung web app\nThiet ke dashboard\nToi uu quy trinh"}
                rows={6}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Diem nhan / dau an
              </label>
              <textarea
                name="highlights"
                value={formData.highlights}
                onChange={handleChange}
                placeholder={"Moi dong la mot y\nDa co dashboard quan tri\nDa deploy Vercel\nDang phat trien bo cong cu"}
                rows={6}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
          </div>
        </section>

        <section className="space-y-6 border-t border-gray-200 pt-8 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-semibold">Thong tin lien he</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Cac muc nay xuat hien o sidebar cua trang About va CV.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Email cong khai
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contact@example.com"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">So dien thoai</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+84 ..."
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">GitHub URL</label>
              <input
                type="url"
                name="githubUrl"
                value={formData.githubUrl}
                onChange={handleChange}
                placeholder="https://github.com/..."
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">LinkedIn URL</label>
              <input
                type="url"
                name="linkedinUrl"
                value={formData.linkedinUrl}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/..."
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Facebook URL</label>
              <input
                type="url"
                name="facebookUrl"
                value={formData.facebookUrl}
                onChange={handleChange}
                placeholder="https://facebook.com/..."
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Website URL</label>
              <input
                type="url"
                name="websiteUrl"
                value={formData.websiteUrl}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
          </div>
        </section>

        <div className="flex gap-4 border-t border-gray-200 pt-6 dark:border-gray-800">
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary disabled:opacity-50"
          >
            {isLoading ? "Dang luu..." : "Luu thong tin"}
          </button>
        </div>
      </form>
    </>
  );
}
