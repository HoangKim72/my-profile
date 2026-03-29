export interface ResumeContent {
  summary: string | null;
  currentFocus: string | null;
  strengths: string[];
  highlights: string[];
}

interface StoredResumeContent extends ResumeContent {
  version: number;
}

const RESUME_CONTENT_VERSION = 1;

function sanitizeText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => sanitizeText(item))
        .filter((item): item is string => item !== null),
    ),
  );
}

function isStoredResumeContent(
  value: unknown,
): value is Partial<StoredResumeContent> {
  return typeof value === "object" && value !== null;
}

export function normalizeTextareaList(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/\r?\n/)
        .map((item) => sanitizeText(item))
        .filter((item): item is string => item !== null),
    ),
  );
}

export function joinTextareaList(items: string[]): string {
  return items.join("\n");
}

export function parseResumeContent(rawBio: string | null | undefined): ResumeContent {
  const normalizedBio = sanitizeText(rawBio);

  if (!normalizedBio) {
    return {
      summary: null,
      currentFocus: null,
      strengths: [],
      highlights: [],
    };
  }

  try {
    const parsed = JSON.parse(normalizedBio) as unknown;

    if (!isStoredResumeContent(parsed)) {
      throw new Error("Invalid resume content");
    }

    return {
      summary: sanitizeText(parsed.summary),
      currentFocus: sanitizeText(parsed.currentFocus),
      strengths: sanitizeStringList(parsed.strengths),
      highlights: sanitizeStringList(parsed.highlights),
    };
  } catch {
    return {
      summary: normalizedBio,
      currentFocus: null,
      strengths: [],
      highlights: [],
    };
  }
}

export function serializeResumeContent(content: ResumeContent): string | null {
  const normalizedContent: StoredResumeContent = {
    version: RESUME_CONTENT_VERSION,
    summary: sanitizeText(content.summary),
    currentFocus: sanitizeText(content.currentFocus),
    strengths: sanitizeStringList(content.strengths),
    highlights: sanitizeStringList(content.highlights),
  };

  const hasContent =
    normalizedContent.summary ||
    normalizedContent.currentFocus ||
    normalizedContent.strengths.length > 0 ||
    normalizedContent.highlights.length > 0;

  if (!hasContent) {
    return null;
  }

  return JSON.stringify(normalizedContent);
}

export function splitParagraphs(value: string | null | undefined): string[] {
  const normalizedValue = sanitizeText(value);

  if (!normalizedValue) {
    return [];
  }

  return normalizedValue
    .split(/\r?\n\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
