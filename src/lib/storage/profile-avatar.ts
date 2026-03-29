import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

const PROFILE_AVATAR_BUCKET =
  process.env.NEXT_PUBLIC_PROFILE_AVATAR_BUCKET ?? "profile-images";
const PROFILE_AVATAR_MAX_SIZE_BYTES = parseInt(
  process.env.NEXT_PUBLIC_MAX_FILE_SIZE || "10485760",
  10,
);
const PROFILE_AVATAR_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

let bucketReadyPromise: Promise<void> | null = null;

function createStorageAdminClient() {
  return createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function isMissingBucketError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const errorLike = error as {
    message?: string;
    status?: number;
    statusCode?: number | string;
  };

  return (
    errorLike.status === 404 ||
    String(errorLike.statusCode ?? "") === "404" ||
    (errorLike.message ?? "").toLowerCase().includes("not found")
  );
}

function isBucketAlreadyCreatedError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const errorLike = error as {
    message?: string;
    status?: number;
    statusCode?: number | string;
  };

  return (
    errorLike.status === 409 ||
    String(errorLike.statusCode ?? "") === "409" ||
    (errorLike.message ?? "").toLowerCase().includes("already")
  );
}

function getFileExtension(fileName: string, mimeType: string) {
  const fileNameExtension = fileName.split(".").pop()?.trim().toLowerCase();

  if (fileNameExtension) {
    return fileNameExtension;
  }

  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "bin";
  }
}

export async function ensureProfileAvatarBucket() {
  if (bucketReadyPromise) {
    return bucketReadyPromise;
  }

  bucketReadyPromise = (async () => {
    const supabase = createStorageAdminClient();
    const { data: bucket, error: getBucketError } = await supabase.storage.getBucket(
      PROFILE_AVATAR_BUCKET,
    );

    if (bucket) {
      return;
    }

    if (getBucketError && !isMissingBucketError(getBucketError)) {
      throw getBucketError;
    }

    const { error: createBucketError } = await supabase.storage.createBucket(
      PROFILE_AVATAR_BUCKET,
      {
        public: true,
        fileSizeLimit: PROFILE_AVATAR_MAX_SIZE_BYTES,
        allowedMimeTypes: [...PROFILE_AVATAR_ALLOWED_MIME_TYPES],
      },
    );

    if (createBucketError && !isBucketAlreadyCreatedError(createBucketError)) {
      throw createBucketError;
    }
  })().catch((error) => {
    bucketReadyPromise = null;
    throw error;
  });

  return bucketReadyPromise;
}

async function removeExistingProfileAvatars(userId: string, keepFilePath?: string) {
  const supabase = createStorageAdminClient();
  const folderPath = `avatars/${userId}`;
  const { data: files, error } = await supabase.storage
    .from(PROFILE_AVATAR_BUCKET)
    .list(folderPath, {
      limit: 100,
    });

  if (error) {
    throw error;
  }

  if (!files || files.length === 0) {
    return;
  }

  const filePaths = files
    .map((file) => `${folderPath}/${file.name}`)
    .filter((filePath) => filePath !== keepFilePath);

  if (filePaths.length === 0) {
    return;
  }

  const { error: removeError } = await supabase.storage
    .from(PROFILE_AVATAR_BUCKET)
    .remove(filePaths);

  if (removeError) {
    throw removeError;
  }
}

export async function uploadProfileAvatar(input: {
  userId: string;
  file: File;
}) {
  await ensureProfileAvatarBucket();

  const extension = getFileExtension(input.file.name, input.file.type);
  const filePath = `avatars/${input.userId}/${Date.now()}.${extension}`;
  const supabase = createStorageAdminClient();

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_AVATAR_BUCKET)
    .upload(filePath, input.file, {
      contentType: input.file.type || "application/octet-stream",
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  await removeExistingProfileAvatars(input.userId, filePath);

  const { data } = supabase.storage
    .from(PROFILE_AVATAR_BUCKET)
    .getPublicUrl(filePath);

  return {
    filePath,
    publicUrl: data.publicUrl,
  };
}
