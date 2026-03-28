import { z } from "zod";

function emptyToUndefined(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

const optionalText = (maxLength: number) =>
  z
    .preprocess(
      emptyToUndefined,
      z.string().trim().max(maxLength).optional(),
    )
    .transform((value) => value ?? null);

const optionalUrl = z
  .preprocess(
    emptyToUndefined,
    z.string().trim().url("URL không hợp lệ").max(255).optional(),
  )
  .transform((value) => value ?? null);

export const updateProfileSchema = z.object({
  fullName: optionalText(120),
  headline: optionalText(160),
  bio: optionalText(2000),
  email: z
    .preprocess(
      emptyToUndefined,
      z.string().trim().email("Email không hợp lệ").max(255).optional(),
    )
    .transform((value) => value ?? null),
  phone: optionalText(50),
  githubUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  facebookUrl: optionalUrl,
  websiteUrl: optionalUrl,
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
