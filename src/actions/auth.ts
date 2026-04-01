"use server";

import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { syncAuthUserRecord } from "@/lib/auth/user-record";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import {
  consumeRateLimit,
  rateLimitPresets,
} from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request";
import {
  initialAuthActionState,
  registerSchema,
  signInSchema,
  type AuthActionState,
} from "@/lib/validators/auth";

const MIN_HUMAN_FORM_FILL_MS = 120;
const GENERIC_SIGN_IN_ERROR = "Email hoặc mật khẩu không đúng.";
const GENERIC_SIGN_UP_ERROR =
  "Không thể tạo tài khoản với thông tin này. Vui lòng thử lại.";
const GENERIC_RATE_LIMIT_ERROR =
  "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.";

function createSupabaseAdmin() {
  return createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function loginUser(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    website: formData.get("website"),
    formStartedAt: formData.get("formStartedAt"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? GENERIC_SIGN_IN_ERROR,
    };
  }

  const antiBotState = await assertHumanRequest({
    website: parsed.data.website,
    formStartedAt: parsed.data.formStartedAt,
  });

  if (!antiBotState.allowed) {
    return antiBotState.response;
  }

  const ip = await getClientIp();
  const rateLimit = consumeRateLimit({
    key: `auth:login:${ip}`,
    ...rateLimitPresets.authLogin,
  });

  if (!rateLimit.allowed) {
    return {
      success: false,
      error: GENERIC_RATE_LIMIT_ERROR,
    };
  }

  let shouldRedirect = false;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error || !data.user) {
      return {
        success: false,
        error: GENERIC_SIGN_IN_ERROR,
      };
    }

    await syncAuthUserRecord({
      userId: data.user.id,
      email: data.user.email ?? parsed.data.email,
    });
    shouldRedirect = true;
  } catch {
    return {
      success: false,
      error: GENERIC_SIGN_IN_ERROR,
    };
  }

  if (shouldRedirect) {
    redirect("/dashboard");
  }

  return {
    success: false,
    error: GENERIC_SIGN_IN_ERROR,
  };
}

export async function registerUser(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    website: formData.get("website"),
    formStartedAt: formData.get("formStartedAt"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? GENERIC_SIGN_UP_ERROR,
    };
  }

  if (parsed.data.password !== parsed.data.confirmPassword) {
    return {
      success: false,
      error: "Mật khẩu xác nhận không khớp.",
    };
  }

  const antiBotState = await assertHumanRequest({
    website: parsed.data.website,
    formStartedAt: parsed.data.formStartedAt,
  });

  if (!antiBotState.allowed) {
    return antiBotState.response;
  }

  const ip = await getClientIp();
  const rateLimit = consumeRateLimit({
    key: `auth:register:${ip}`,
    ...rateLimitPresets.authRegister,
  });

  if (!rateLimit.allowed) {
    return {
      success: false,
      error: GENERIC_RATE_LIMIT_ERROR,
    };
  }

  let shouldRedirect = false;

  try {
    const supabaseAdmin = createSupabaseAdmin();
    const { data: createdUser, error } = await supabaseAdmin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
    });

    if (error || !createdUser.user) {
      return {
        success: false,
        error: GENERIC_SIGN_UP_ERROR,
      };
    }

    await syncAuthUserRecord({
      userId: createdUser.user.id,
      email: parsed.data.email,
    });

    const supabase = await createSupabaseServerClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (signInError) {
      return {
        success: false,
        error: "Tài khoản đã tạo nhưng chưa thể đăng nhập ngay. Vui lòng thử lại.",
      };
    }
    shouldRedirect = true;
  } catch {
    return {
      success: false,
      error: GENERIC_SIGN_UP_ERROR,
    };
  }

  if (shouldRedirect) {
    redirect("/dashboard");
  }

  return {
    success: false,
    error: GENERIC_SIGN_UP_ERROR,
  };
}

async function assertHumanRequest(input: {
  website: string;
  formStartedAt: number;
}): Promise<
  | { allowed: true }
  | {
      allowed: false;
      response: AuthActionState;
    }
> {
  if (input.website.trim().length > 0) {
    return {
      allowed: false,
      response: initialAuthActionState,
    };
  }

  if (
    input.formStartedAt === 0 ||
    Date.now() - input.formStartedAt < MIN_HUMAN_FORM_FILL_MS
  ) {
    return {
      allowed: false,
      response: {
        success: false,
        error: "Biểu mẫu được gửi quá nhanh. Vui lòng thử lại.",
      },
    };
  }

  return { allowed: true };
}
