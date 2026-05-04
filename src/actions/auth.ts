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

const GENERIC_SIGN_IN_ERROR = "Email hoặc mật khẩu không đúng.";
const GENERIC_SIGN_UP_ERROR =
  "Không thể tạo tài khoản với thông tin này. Vui lòng thử lại.";
const GENERIC_RATE_LIMIT_ERROR =
  "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.";
const APP_USER_SYNC_ERROR =
  "Xác thực thành công nhưng ứng dụng chưa đồng bộ được hồ sơ nội bộ. Kiểm tra DATABASE_URL, migration Prisma và ADMIN_EMAILS trên môi trường deploy.";

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
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? GENERIC_SIGN_IN_ERROR,
    };
  }

  const antiBotState = await assertHumanRequest({
    website: parsed.data.website,
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

    try {
      await syncAuthUserRecord({
        userId: data.user.id,
        email: data.user.email ?? parsed.data.email,
      });
    } catch (syncError) {
      console.error(
        "Supabase sign-in succeeded but app user sync failed:",
        syncError,
      );

      await supabase.auth.signOut().catch((signOutError) => {
        console.error(
          "Unable to roll back Supabase session after sync failure:",
          signOutError,
        );
      });

      return {
        success: false,
        error: APP_USER_SYNC_ERROR,
      };
    }

    shouldRedirect = true;
  } catch (error) {
    console.error("Unexpected error during login:", error);
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

    try {
      await syncAuthUserRecord({
        userId: createdUser.user.id,
        email: parsed.data.email,
      });
    } catch (syncError) {
      console.error("Created Supabase user but failed to sync app user:", syncError);
      return {
        success: false,
        error: APP_USER_SYNC_ERROR,
      };
    }

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
  } catch (error) {
    console.error("Unexpected error during register:", error);
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

  return { allowed: true };
}
