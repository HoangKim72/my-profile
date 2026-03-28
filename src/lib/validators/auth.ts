import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email là bắt buộc")
  .email("Email không hợp lệ")
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
  .max(72, "Mật khẩu quá dài");

const honeypotSchema = z.string().trim().max(0).optional().default("");
const formStartedAtSchema = z.coerce.number().int().nonnegative();

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  website: honeypotSchema,
  formStartedAt: formStartedAtSchema,
});

export const registerSchema = signInSchema.extend({
  confirmPassword: passwordSchema,
});

export type SignInInput = z.infer<typeof signInSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export interface AuthActionState {
  success: boolean;
  error: string | null;
}

export const initialAuthActionState: AuthActionState = {
  success: false,
  error: null,
};
