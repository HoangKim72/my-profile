// Helpers for "resources": the study-material archives stored in the
// `projects` table (see docs/TECHNICAL.md §1).

// Placeholder the old form wrote into every row; treat it as "no tags".
export const LEGACY_TECH_STACK = "ZIP archive, Downloadable resources";

export const RESOURCE_TAG_MAX_COUNT = 20;
export const RESOURCE_TAG_MAX_LENGTH = 40;

export function parseResourceTags(raw: string | null | undefined): string[] {
  if (!raw || raw.trim() === LEGACY_TECH_STACK) {
    return [];
  }

  const seen = new Set<string>();
  const tags: string[] = [];

  for (const part of raw.split(/[,\n;]/)) {
    const tag = part.trim().replace(/\s+/g, " ").slice(0, RESOURCE_TAG_MAX_LENGTH);
    const key = tag.toLocaleLowerCase("vi-VN");

    if (!tag || seen.has(key)) {
      continue;
    }

    seen.add(key);
    tags.push(tag);

    if (tags.length >= RESOURCE_TAG_MAX_COUNT) {
      break;
    }
  }

  return tags;
}

export function serializeResourceTags(raw: string | null | undefined): string {
  return parseResourceTags(raw).join(", ");
}

export const RESOURCE_SORT_OPTIONS = {
  newest: "Mới nhất",
  downloads: "Tải nhiều nhất",
  title: "Tên A → Z",
} as const;

export type ResourceSort = keyof typeof RESOURCE_SORT_OPTIONS;

export interface ResourceFilters {
  q: string;
  subject: string;
  semester: string;
  sort: ResourceSort;
}

const FILTER_MAX_LENGTH = 120;

function readParam(value: string | string[] | undefined) {
  const first = Array.isArray(value) ? value[0] : value;

  return (first ?? "").trim().slice(0, FILTER_MAX_LENGTH);
}

export function parseResourceFilters(
  searchParams: Record<string, string | string[] | undefined>,
): ResourceFilters {
  const sort = readParam(searchParams.sort);

  return {
    q: readParam(searchParams.q),
    subject: readParam(searchParams.subject),
    semester: readParam(searchParams.semester),
    sort: sort in RESOURCE_SORT_OPTIONS ? (sort as ResourceSort) : "newest",
  };
}
