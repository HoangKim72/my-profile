import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import {
  PROJECT_ARCHIVE_ALLOWED_MIME_TYPES,
  PROJECT_ARCHIVE_MAX_SIZE_BYTES,
  sanitizeArchiveFileName,
} from "@/lib/projects/archive";

const PROJECT_ARCHIVE_BUCKET =
  process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? "portfolio-files";

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

export function getProjectArchiveBucketName() {
  return PROJECT_ARCHIVE_BUCKET;
}

export async function ensureProjectArchiveBucket() {
  if (bucketReadyPromise) {
    return bucketReadyPromise;
  }

  bucketReadyPromise = (async () => {
    const supabase = createStorageAdminClient();
    const { data: bucket, error: getBucketError } = await supabase.storage.getBucket(
      PROJECT_ARCHIVE_BUCKET,
    );

    if (bucket) {
      return;
    }

    if (getBucketError && !isMissingBucketError(getBucketError)) {
      throw getBucketError;
    }

    const { error: createBucketError } = await supabase.storage.createBucket(
      PROJECT_ARCHIVE_BUCKET,
      {
        public: false,
        fileSizeLimit: PROJECT_ARCHIVE_MAX_SIZE_BYTES,
        allowedMimeTypes: [...PROJECT_ARCHIVE_ALLOWED_MIME_TYPES],
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

export async function uploadProjectArchive(input: {
  projectId: string;
  fileName: string;
  file: File;
  mimeType?: string;
}) {
  await ensureProjectArchiveBucket();

  const safeFileName = sanitizeArchiveFileName(input.fileName);
  const filePath = `project-archives/${input.projectId}/${Date.now()}-${safeFileName}`;
  const supabase = createStorageAdminClient();
  const { error } = await supabase.storage
    .from(PROJECT_ARCHIVE_BUCKET)
    .upload(filePath, input.file, {
      contentType: input.mimeType || "application/zip",
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return {
    fileName: safeFileName,
    filePath,
  };
}

export async function removeStoredProjectArchive(filePath: string) {
  if (!filePath) {
    return;
  }

  await ensureProjectArchiveBucket();

  const supabase = createStorageAdminClient();
  const { error } = await supabase.storage
    .from(PROJECT_ARCHIVE_BUCKET)
    .remove([filePath]);

  if (error) {
    throw error;
  }
}

export async function downloadStoredProjectArchive(filePath: string) {
  await ensureProjectArchiveBucket();

  const supabase = createStorageAdminClient();
  const { data, error } = await supabase.storage
    .from(PROJECT_ARCHIVE_BUCKET)
    .download(filePath);

  if (error || !data) {
    throw error ?? new Error("Không thể tải file từ storage.");
  }

  return data;
}
