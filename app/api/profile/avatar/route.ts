import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/check-auth";
import { imageUploadSchema } from "@/lib/validators/upload";
import { uploadProfileAvatar } from "@/lib/storage/profile-avatar";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const avatar = formData.get("avatar");

  if (!(avatar instanceof File)) {
    return NextResponse.json(
      { error: "Khong tim thay file anh de tai len." },
      { status: 400 },
    );
  }

  try {
    imageUploadSchema.parse({ file: avatar });

    const uploadedAvatar = await uploadProfileAvatar({
      userId: user.id,
      file: avatar,
    });

    await prisma.profile.upsert({
      where: {
        userId: user.id,
      },
      update: {
        avatarUrl: uploadedAvatar.publicUrl,
      },
      create: {
        userId: user.id,
        email: user.email,
        avatarUrl: uploadedAvatar.publicUrl,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    revalidatePath("/about");
    revalidatePath("/cv");
    revalidatePath("/");

    return NextResponse.json({
      success: true,
      avatarUrl: uploadedAvatar.publicUrl,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Khong the tai anh dai dien len luc nay.",
      },
      { status: 400 },
    );
  }
}
