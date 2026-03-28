"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/actions/profile";
import type { UpdateProfileInput } from "@/lib/validators/profile";

interface ProfileSettingsFormProps {
  initialData: UpdateProfileInput;
  authEmail: string;
}

const emptyFormData: UpdateProfileInput = {
  fullName: null,
  headline: null,
  bio: null,
  email: null,
  phone: null,
  githubUrl: null,
  linkedinUrl: null,
  facebookUrl: null,
  websiteUrl: null,
};

function toInputValue(value: string | null | undefined) {
  return value ?? "";
}

export function ProfileSettingsForm({
  initialData,
  authEmail,
}: ProfileSettingsFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<UpdateProfileInput>({
    ...emptyFormData,
    ...initialData,
  });
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await updateProfile(formData);

      if (!result.success) {
        setMessage({
          type: "error",
          text: result.error || "Unable to update profile",
        });
        return;
      }

      setMessage({
        type: "success",
        text: "Profile updated successfully.",
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
        The email field below is your public contact email shown on the site.
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

      <form onSubmit={handleSubmit} className="card p-8 space-y-6">
        <h2 className="text-2xl font-bold">Profile Information</h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={toInputValue(formData.fullName)}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Headline</label>
            <input
              type="text"
              name="headline"
              value={toInputValue(formData.headline)}
              onChange={handleChange}
              placeholder="e.g., Full Stack Developer"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Bio</label>
            <textarea
              name="bio"
              value={toInputValue(formData.bio)}
              onChange={handleChange}
              placeholder="Tell visitors about yourself..."
              rows={5}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Public Contact Email
            </label>
            <input
              type="email"
              name="email"
              value={toInputValue(formData.email)}
              onChange={handleChange}
              placeholder="contact@example.com"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input
              type="tel"
              name="phone"
              value={toInputValue(formData.phone)}
              onChange={handleChange}
              placeholder="+84 ..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">GitHub URL</label>
            <input
              type="url"
              name="githubUrl"
              value={toInputValue(formData.githubUrl)}
              onChange={handleChange}
              placeholder="https://github.com/..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              LinkedIn URL
            </label>
            <input
              type="url"
              name="linkedinUrl"
              value={toInputValue(formData.linkedinUrl)}
              onChange={handleChange}
              placeholder="https://linkedin.com/in/..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Facebook URL</label>
            <input
              type="url"
              name="facebookUrl"
              value={toInputValue(formData.facebookUrl)}
              onChange={handleChange}
              placeholder="https://facebook.com/..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Website URL</label>
            <input
              type="url"
              name="websiteUrl"
              value={toInputValue(formData.websiteUrl)}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-800">
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </>
  );
}
