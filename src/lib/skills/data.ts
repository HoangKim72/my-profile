import "server-only";

import type {
  GitHubProjectSpotlight,
  SkillEvidenceProject,
  SkillCategory,
  SkillTechCard,
  SkillsActivityInsight,
  SkillsLanguageItem,
  SkillsOverviewStat,
  SkillsPageData,
  SkillsSoftSkill,
  SkillsSourceState,
  SkillsToolItem,
} from "@/lib/skills/types";
import { prisma } from "@/lib/db/prisma";
import type { ResumeProfileSource } from "@/lib/profile/resume-view";

const GITHUB_REVALIDATE_SECONDS = 60 * 60 * 6;
const WAKATIME_REVALIDATE_SECONDS = 60 * 60;

const DEFAULT_SOFT_SKILLS: SkillsSoftSkill[] = [
  {
    name: "Giải quyết vấn đề",
    description:
      "Tách bài toán thành phần nhỏ, ưu tiên đúng điểm nghẽn và đi tới lời giải dùng được.",
  },
  {
    name: "Giao tiếp",
    description:
      "Trao đổi rõ ràng về tiến độ, rủi ro và cách phối hợp để công việc không bị nghẽn.",
  },
  {
    name: "Làm việc nhóm",
    description:
      "Làm việc theo tinh thần đồng đội, giữ code dễ bàn giao và dễ mở rộng cho người khác.",
  },
  {
    name: "Quản lý thời gian",
    description:
      "Biết chia nhỏ việc, giữ nhịp triển khai và cân bằng giữa chất lượng với tốc độ giao hàng.",
  },
];

const TECH_DEFINITIONS = [
  {
    label: "TypeScript",
    category: "core",
    group: "language",
    summary: "Nền tảng có kiểu dữ liệu cho logic ứng dụng và kiểu dữ liệu của component.",
    tokens: ["typescript", "ts"],
  },
  {
    label: "JavaScript",
    category: "core",
    group: "language",
    summary: "Ngôn ngữ nền cho scripting, hành vi trình duyệt và luồng ứng dụng.",
    tokens: ["javascript", "js"],
  },
  {
    label: "React",
    category: "core",
    group: "frontend",
    summary: "Xây dựng giao diện tương tác theo hướng component.",
    tokens: ["react"],
  },
  {
    label: "Next.js",
    category: "core",
    group: "frontend",
    summary: "Framework React full-stack cho routing, tải dữ liệu và triển khai.",
    tokens: ["next", "nextjs"],
  },
  {
    label: "Node.js",
    category: "core",
    group: "backend",
    summary: "Môi trường chạy cho API, script và logic phía máy chủ.",
    tokens: ["node", "nodejs"],
  },
  {
    label: "Tailwind CSS",
    category: "core",
    group: "frontend",
    summary: "Styling utility-first cho hệ thống giao diện responsive.",
    tokens: ["tailwind", "tailwindcss"],
  },
  {
    label: "HTML",
    category: "core",
    group: "frontend",
    summary: "Cấu trúc ngữ nghĩa và khung nội dung cho giao diện.",
    tokens: ["html"],
  },
  {
    label: "CSS",
    category: "core",
    group: "frontend",
    summary: "Bố cục, chuyển động và trình bày trực quan cho giao diện.",
    tokens: ["css"],
  },
  {
    label: "PostgreSQL",
    category: "core",
    group: "database",
    summary: "Mô hình hoá dữ liệu quan hệ, truy vấn và lưu trữ có cấu trúc.",
    tokens: ["postgres", "postgresql", "pg"],
  },
  {
    label: "Prisma",
    category: "core",
    group: "database",
    summary: "ORM có kiểu dữ liệu và quy trình làm việc với database theo schema.",
    tokens: ["prisma"],
  },
  {
    label: "Supabase",
    category: "core",
    group: "backend",
    summary: "Dịch vụ backend cho xác thực, lưu trữ và ứng dụng dựa trên Postgres.",
    tokens: ["supabase"],
  },
  {
    label: "Express",
    category: "core",
    group: "backend",
    summary: "HTTP API gọn nhẹ và máy chủ dựa trên middleware.",
    tokens: ["express"],
  },
  {
    label: "NestJS",
    category: "core",
    group: "backend",
    summary: "Module backend có cấu trúc, DI và tầng service dễ mở rộng.",
    tokens: ["nest", "nestjs"],
  },
  {
    label: "REST API",
    category: "core",
    group: "backend",
    summary: "API theo tài nguyên, dùng để kết nối ứng dụng và dịch vụ.",
    tokens: ["rest", "restapi"],
  },
  {
    label: "GraphQL",
    category: "core",
    group: "backend",
    summary: "Truy vấn dạng graph có kiểu, giúp client lấy dữ liệu linh hoạt.",
    tokens: ["graphql", "apollo"],
  },
  {
    label: "Python",
    category: "core",
    group: "language",
    summary: "Scripting đa dụng, tự động hoá và logic backend.",
    tokens: ["python", "py"],
  },
  {
    label: "PHP",
    category: "core",
    group: "backend",
    summary: "Xử lý web phía máy chủ và backend ứng dụng truyền thống.",
    tokens: ["php"],
  },
  {
    label: "FastAPI",
    category: "core",
    group: "backend",
    summary: "API Python hiệu năng cao với schema có kiểu.",
    tokens: ["fastapi"],
  },
  {
    label: "Django",
    category: "core",
    group: "backend",
    summary: "Framework Python đầy đủ cho ứng dụng dựa trên database.",
    tokens: ["django"],
  },
  {
    label: "MongoDB",
    category: "core",
    group: "database",
    summary: "Database dạng document cho schema linh hoạt và dữ liệu nhiều nội dung.",
    tokens: ["mongodb", "mongoose"],
  },
  {
    label: "Docker",
    category: "tool",
    group: "platform",
    summary: "Đóng gói container và môi trường chạy tái lập được.",
    tokens: ["docker", "dockerfile", "dockercompose"],
  },
  {
    label: "Vercel",
    category: "tool",
    group: "platform",
    summary: "Nền tảng triển khai cho ứng dụng web frontend và full-stack.",
    tokens: ["vercel"],
  },
  {
    label: "Git",
    category: "tool",
    group: "tooling",
    summary: "Quản lý phiên bản để theo dõi thay đổi và phối hợp code.",
    tokens: ["git"],
  },
  {
    label: "GitHub Actions",
    category: "tool",
    group: "platform",
    summary: "Pipeline CI/CD cho tự động hoá, kiểm tra và phát hành.",
    tokens: ["githubactions", "actions"],
  },
  {
    label: "VS Code",
    category: "tool",
    group: "tooling",
    summary: "Trình soạn thảo cho viết code, gỡ lỗi và làm việc hằng ngày.",
    tokens: ["vscode", "visualstudiocode"],
  },
  {
    label: "Windows",
    category: "tool",
    group: "platform",
    summary: "Môi trường phát triển trên desktop và kiểm thử cục bộ.",
    tokens: ["windows", "windown"],
  },
  {
    label: "macOS",
    category: "tool",
    group: "platform",
    summary: "Môi trường cục bộ dựa trên Unix cho phát triển sản phẩm.",
    tokens: ["macos", "macosx", "osx"],
  },
  {
    label: "Linux",
    category: "tool",
    group: "platform",
    summary: "Môi trường thân thiện máy chủ cho triển khai và công cụ.",
    tokens: ["linux", "ubuntu"],
  },
] as const;

const TECH_TOKEN_MAP = buildTechTokenMap();
const CORE_TECH_PRIORITY = [
  "React",
  "Next.js",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "PostgreSQL",
  "Prisma",
  "Supabase",
  "Tailwind CSS",
  "Python",
  "PHP",
  "Express",
  "NestJS",
  "GraphQL",
  "REST API",
  "Docker",
] as const;

const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  frontend: "Frontend",
  backend: "Backend",
  database: "Cơ sở dữ liệu",
  language: "Ngôn ngữ",
  platform: "Nền tảng",
  tooling: "Công cụ",
  workflow: "Quy trình",
  other: "Khác",
};

interface GitHubRepoResponse {
  name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  archived: boolean;
  language: string | null;
  topics?: string[];
  default_branch: string;
  updated_at: string;
  homepage: string | null;
}

interface GitHubPackageJsonResponse {
  content?: string;
  encoding?: string;
}

interface GitHubSkillSnapshot {
  username: string;
  scannedRepoCount: number;
  coreTechStack: SkillTechCard[];
  toolMap: Map<string, SkillsToolItem>;
  projects: GitHubProjectSpotlight[];
}

interface ProjectArchiveRow {
  slug: string;
  title: string;
  shortDescription: string;
  subjectName: string;
  techStack: string;
  githubUrl: string | null;
  demoUrl: string | null;
  createdAt: Date;
}

interface ProjectArchiveSkillSnapshot {
  scannedProjectCount: number;
  coreTechStack: SkillTechCard[];
}

interface WakaTimeSummaryItem {
  name: string;
  total_seconds: number;
  text: string;
}

interface WakaTimeDaySummary {
  grand_total?: {
    total_seconds?: number;
    text?: string;
  };
  languages?: WakaTimeSummaryItem[];
  editors?: WakaTimeSummaryItem[];
  operating_systems?: WakaTimeSummaryItem[];
  dependencies?: WakaTimeSummaryItem[];
  projects?: WakaTimeSummaryItem[];
}

interface WakaTimeSummariesResponse {
  data?: WakaTimeDaySummary[];
}

interface WakaTimeAggregateItem {
  name: string;
  totalSeconds: number;
  percent: number;
  usageText: string;
}

interface WakaTimeAggregateRange {
  totalSeconds: number;
  totalText: string;
  activeDays: number;
  languages: WakaTimeAggregateItem[];
  editors: WakaTimeAggregateItem[];
  operatingSystems: WakaTimeAggregateItem[];
  dependencies: WakaTimeAggregateItem[];
  projects: WakaTimeAggregateItem[];
}

interface WakaTimeSkillSnapshot {
  lastThirtyDays: WakaTimeAggregateRange;
  lastSevenDays: WakaTimeAggregateRange;
}

export async function getSkillsPageData(
  profile: ResumeProfileSource | null | undefined,
): Promise<SkillsPageData> {
  const githubUsername = resolveGitHubUsername(profile?.githubUrl);
  const [githubResult, projectResult, wakatimeResult] = await Promise.allSettled([
    githubUsername ? getGitHubSkillSnapshot(githubUsername) : Promise.resolve(null),
    getProjectArchiveSkillSnapshot(),
    getWakaTimeSkillSnapshot(),
  ]);

  const githubSnapshot =
    githubResult.status === "fulfilled" ? githubResult.value : null;
  const projectSnapshot =
    projectResult.status === "fulfilled" ? projectResult.value : null;
  const wakatimeSnapshot =
    wakatimeResult.status === "fulfilled" ? wakatimeResult.value : null;

  const githubState = buildGitHubState({
    username: githubUsername,
    snapshot: githubSnapshot,
    error:
      githubResult.status === "rejected" ? getErrorMessage(githubResult.reason) : null,
  });
  const projectState = buildProjectState({
    snapshot: projectSnapshot,
    error:
      projectResult.status === "rejected"
        ? getErrorMessage(projectResult.reason)
        : null,
  });
  const wakatimeState = buildWakaTimeState({
    snapshot: wakatimeSnapshot,
    error:
      wakatimeResult.status === "rejected"
        ? getErrorMessage(wakatimeResult.reason)
        : null,
  });

  const coreTechStack = mergeCoreTechStack({
    githubTechStack: githubSnapshot?.coreTechStack ?? [],
    projectTechStack: projectSnapshot?.coreTechStack ?? [],
    wakaRange: wakatimeSnapshot?.lastThirtyDays ?? null,
  });
  const toolsAndEnvironment = buildToolsAndEnvironment({
    githubTools: githubSnapshot?.toolMap ?? new Map(),
    wakaRange: wakatimeSnapshot?.lastThirtyDays ?? null,
  });
  const activityInsights = buildActivityInsights(wakatimeSnapshot?.lastSevenDays ?? null);
  const softSkills = buildSoftSkills();
  const mostUsedLanguages = buildMostUsedLanguages(
    wakatimeSnapshot?.lastThirtyDays ?? null,
  );
  const overviewStats = buildOverviewStats({
    githubSnapshot,
    projectSnapshot,
    wakatimeSnapshot,
    softSkillsCount: softSkills.length,
    coreTechCount: coreTechStack.length,
  });

  return {
    githubState,
    projectState,
    wakatimeState,
    overviewStats,
    coreTechStack,
    githubTechStack: githubSnapshot?.coreTechStack ?? [],
    mostUsedLanguages,
    toolsAndEnvironment,
    activityInsights,
    softSkills,
    githubProjects: githubSnapshot?.projects ?? [],
  };
}

async function getGitHubSkillSnapshot(
  username: string,
): Promise<GitHubSkillSnapshot | null> {
  const repoLimit = resolveGitHubRepoLimit(Boolean(process.env.GITHUB_TOKEN));
  const repos = await fetchGitHubJson<GitHubRepoResponse[]>(
    `/users/${username}/repos?sort=updated&per_page=${repoLimit}&type=owner`,
  );

  const ownerRepos = repos.filter((repo) => !repo.fork && !repo.archived);

  if (ownerRepos.length === 0) {
    return null;
  }

  const repoAnalyses = await Promise.all(
    ownerRepos.map(async (repo) => {
      const [languagesResult, packageJsonResult] = await Promise.allSettled([
        fetchGitHubJson<Record<string, number>>(
          `/repos/${username}/${repo.name}/languages`,
        ),
        shouldReadPackageJson(repo)
          ? fetchGitHubJson<GitHubPackageJsonResponse>(
              `/repos/${username}/${repo.name}/contents/package.json?ref=${repo.default_branch}`,
            )
          : Promise.resolve(null),
      ]);

      const languages =
        languagesResult.status === "fulfilled" ? languagesResult.value : {};
      const packageJson =
        packageJsonResult.status === "fulfilled" && packageJsonResult.value
          ? decodePackageJson(packageJsonResult.value)
          : null;
      const techNames = Array.from(
        collectGitHubTechNames({
          repo,
          languages,
          packageJson,
        }),
      );

      return {
        name: repo.name,
        url: repo.html_url,
        description: repo.description,
        updatedAtLabel: formatDateLabel(repo.updated_at),
        updatedAtValue: repo.updated_at,
        primaryLanguage: repo.language,
        techNames,
        homepageUrl: repo.homepage || null,
      };
    }),
  );

  const techEvidence = new Map<string, Map<string, SkillEvidenceProject>>();
  const toolMap = new Map<string, SkillsToolItem>();

  repoAnalyses.forEach((repo) => {
    repo.techNames.forEach((techName) => {
      const existingEvidence = techEvidence.get(techName) ?? new Map();
      existingEvidence.set(`github:${repo.name}`, {
        name: repo.name,
        href: repo.homepageUrl || repo.url,
        githubHref: repo.url,
        description:
          repo.description ||
          `Minh chứng từ GitHub cho ${techName.toLowerCase()}.`,
        kindLabel: repo.homepageUrl ? "Dự án đã triển khai" : "Repo GitHub",
        isExternal: true,
        badges: buildGitHubEvidenceBadges(repo),
        supportingText: repo.homepageUrl
          ? "Có bản triển khai hoặc preview để xem nhanh."
          : "Mở repo để xem chi tiết cách triển khai.",
        updatedAt: repo.updatedAtValue,
        updatedAtLabel: repo.updatedAtLabel,
      });
      techEvidence.set(techName, existingEvidence);

      if (getTechCategory(techName) === "tool") {
        const evidenceProjects = Array.from(existingEvidence.values());
        toolMap.set(techName, {
          name: techName,
          category: "Tín hiệu GitHub",
          usagePercent: null,
          usageText: null,
          projectCount: evidenceProjects.length,
          detail: `${evidenceProjects.length} dự án có dùng ${techName}`,
        });
      }
    });
  });

  if (repoAnalyses.length > 0) {
    toolMap.set("Git", {
      name: "Git",
      category: "Quản lý mã nguồn",
      usagePercent: null,
      usageText: null,
      projectCount: repoAnalyses.length,
      detail: `${repoAnalyses.length} repo đang được quản lý bằng Git trên GitHub`,
    });
  }

  const coreTechStack = Array.from(techEvidence.entries())
    .filter(([techName]) => getTechCategory(techName) === "core")
    .map(([techName, evidenceMap]) =>
      createSkillCard({
        name: techName,
        usagePercent: null,
        usageText: null,
        sourceLabels: ["GitHub"],
        evidenceProjects: Array.from(evidenceMap.values()),
      }),
    )
    .sort(compareTechCards)
    .slice(0, 12);

  const projects = repoAnalyses
    .sort((left, right) => right.updatedAtValue.localeCompare(left.updatedAtValue))
    .map((project) => ({
      name: project.name,
      url: project.url,
      description: project.description,
      updatedAtLabel: project.updatedAtLabel,
      primaryLanguage: project.primaryLanguage,
      techNames: project.techNames,
      homepageUrl: project.homepageUrl,
    }))
    .slice(0, 8);

  return {
    username,
    scannedRepoCount: repoAnalyses.length,
    coreTechStack,
    toolMap,
    projects,
  };
}

async function getProjectArchiveSkillSnapshot(): Promise<ProjectArchiveSkillSnapshot | null> {
  const projects = await prisma.project.findMany({
    where: {
      visibility: "PUBLIC",
      status: "PUBLISHED",
      files: {
        some: {},
      },
    },
    select: {
      slug: true,
      title: true,
      shortDescription: true,
      subjectName: true,
      techStack: true,
      githubUrl: true,
      demoUrl: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 24,
  });

  if (projects.length === 0) {
    return null;
  }

  const techEvidence = new Map<string, Map<string, SkillEvidenceProject>>();

  projects.forEach((project) => {
    const techNames = collectProjectArchiveTechNames(project);

    techNames.forEach((techName) => {
      if (getTechCategory(techName) !== "core") {
        return;
      }

      const existingEvidence = techEvidence.get(techName) ?? new Map();
      existingEvidence.set(`project:${project.slug}`, {
        name: project.title,
        href: `/projects/${project.slug}`,
        githubHref: project.githubUrl?.trim() || null,
        description: project.shortDescription,
        kindLabel: "Kho tài liệu",
        isExternal: false,
        badges: buildProjectArchiveBadges(project),
        supportingText: project.subjectName,
        updatedAt: project.createdAt.toISOString(),
        updatedAtLabel: formatDateLabel(project.createdAt),
      });
      techEvidence.set(techName, existingEvidence);
    });
  });

  const coreTechStack = Array.from(techEvidence.entries())
    .map(([techName, evidenceMap]) =>
      createSkillCard({
        name: techName,
        usagePercent: null,
        usageText: null,
        sourceLabels: ["Projects"],
        evidenceProjects: Array.from(evidenceMap.values()),
      }),
    )
    .sort(compareTechCards)
    .slice(0, 12);

  return {
    scannedProjectCount: projects.length,
    coreTechStack,
  };
}

async function getWakaTimeSkillSnapshot(): Promise<WakaTimeSkillSnapshot | null> {
  const apiKey = process.env.WAKATIME_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  const [lastThirtyDays, lastSevenDays] = await Promise.all([
    fetchWakaTimeSummaries(apiKey, "Last 30 Days"),
    fetchWakaTimeSummaries(apiKey, "Last 7 Days"),
  ]);

  return {
    lastThirtyDays,
    lastSevenDays,
  };
}

async function fetchGitHubJson<T>(path: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: buildGitHubHeaders(),
    next: {
      revalidate: GITHUB_REVALIDATE_SECONDS,
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${await response.text()}`);
  }

  return (await response.json()) as T;
}

async function fetchWakaTimeSummaries(
  apiKey: string,
  range: "Last 30 Days" | "Last 7 Days",
): Promise<WakaTimeAggregateRange> {
  const params = new URLSearchParams({ range });
  const response = await fetch(
    `https://wakatime.com/api/v1/users/current/summaries?${params.toString()}`,
    {
      headers: {
        Authorization: `Basic ${Buffer.from(apiKey).toString("base64")}`,
      },
      next: {
        revalidate: WAKATIME_REVALIDATE_SECONDS,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`WakaTime API ${response.status}: ${await response.text()}`);
  }

  const payload = (await response.json()) as WakaTimeSummariesResponse;
  return aggregateWakaTimeRange(payload.data ?? []);
}

function aggregateWakaTimeRange(days: WakaTimeDaySummary[]): WakaTimeAggregateRange {
  const totalSeconds = days.reduce((sum, day) => {
    return sum + (day.grand_total?.total_seconds ?? 0);
  }, 0);
  const activeDays = days.filter((day) => (day.grand_total?.total_seconds ?? 0) > 0)
    .length;

  return {
    totalSeconds,
    totalText: formatSeconds(totalSeconds),
    activeDays,
    languages: aggregateSummaryDimension(days, "languages", totalSeconds),
    editors: aggregateSummaryDimension(days, "editors", totalSeconds),
    operatingSystems: aggregateSummaryDimension(
      days,
      "operating_systems",
      totalSeconds,
    ),
    dependencies: aggregateSummaryDimension(days, "dependencies", totalSeconds),
    projects: aggregateSummaryDimension(days, "projects", totalSeconds),
  };
}

function aggregateSummaryDimension(
  days: WakaTimeDaySummary[],
  key:
    | "languages"
    | "editors"
    | "operating_systems"
    | "dependencies"
    | "projects",
  totalSeconds: number,
): WakaTimeAggregateItem[] {
  const totals = new Map<string, number>();

  days.forEach((day) => {
    const items = day[key] ?? [];

    items.forEach((item) => {
      totals.set(item.name, (totals.get(item.name) ?? 0) + item.total_seconds);
    });
  });

  return Array.from(totals.entries())
    .map(([name, seconds]) => ({
      name,
      totalSeconds: seconds,
      percent: totalSeconds > 0 ? Number(((seconds / totalSeconds) * 100).toFixed(1)) : 0,
      usageText: formatSeconds(seconds),
    }))
    .sort((left, right) => right.totalSeconds - left.totalSeconds);
}

function mergeCoreTechStack({
  githubTechStack,
  projectTechStack,
  wakaRange,
}: {
  githubTechStack: SkillTechCard[];
  projectTechStack: SkillTechCard[];
  wakaRange: WakaTimeAggregateRange | null;
}) {
  const merged = new Map<string, SkillTechCard>();

  mergeSkillCardCollection(merged, githubTechStack);
  mergeSkillCardCollection(merged, projectTechStack);

  const wakaUsage = new Map<
    string,
    {
      percent: number;
      usageText: string;
    }
  >();

  if (wakaRange) {
    [...wakaRange.languages, ...wakaRange.dependencies].forEach((item) => {
      const mappedTechName = resolveTechLabel(item.name);

      if (!mappedTechName || getTechCategory(mappedTechName) !== "core") {
        return;
      }

      const existing = wakaUsage.get(mappedTechName);

      if (!existing || item.percent > existing.percent) {
        wakaUsage.set(mappedTechName, {
          percent: item.percent,
          usageText: item.usageText,
        });
      }
    });
  }

  wakaUsage.forEach((usage, techName) => {
    const existing = merged.get(techName);

    if (existing) {
      existing.usagePercent = usage.percent;
      existing.usageText = usage.usageText;
      existing.sourceLabels = Array.from(new Set([...existing.sourceLabels, "WakaTime"]));
      return;
    }

    merged.set(techName, {
      ...createSkillCard({
        name: techName,
        evidenceProjects: [],
        sourceLabels: ["WakaTime"],
        usagePercent: usage.percent,
        usageText: usage.usageText,
      }),
      projectCount: 0,
      usagePercent: usage.percent,
      usageText: usage.usageText,
      sourceLabels: ["WakaTime"],
    });
  });

  return Array.from(merged.values())
    .sort(compareTechCards)
    .slice(0, 12);
}

function buildMostUsedLanguages(
  wakaRange: WakaTimeAggregateRange | null,
): SkillsLanguageItem[] {
  if (!wakaRange) {
    return [];
  }

  return wakaRange.languages.slice(0, 6).map((language) => ({
    name: language.name,
    percent: language.percent,
    usageText: language.usageText,
  }));
}

function buildToolsAndEnvironment({
  githubTools,
  wakaRange,
}: {
  githubTools: Map<string, SkillsToolItem>;
  wakaRange: WakaTimeAggregateRange | null;
}) {
  const merged = new Map<string, SkillsToolItem>();

  githubTools.forEach((tool) => {
    merged.set(tool.name, tool);
  });

  wakaRange?.editors.slice(0, 3).forEach((editor) => {
    merged.set(editor.name, {
      name: editor.name,
      category: "Trình soạn thảo",
      usagePercent: editor.percent,
      usageText: editor.usageText,
      projectCount: 0,
      detail: `${editor.percent}% thời gian được ghi nhận trong 30 ngày gần nhất`,
    });
  });

  wakaRange?.operatingSystems.slice(0, 2).forEach((operatingSystem) => {
    merged.set(operatingSystem.name, {
      name: operatingSystem.name,
      category: "Hệ điều hành",
      usagePercent: operatingSystem.percent,
      usageText: operatingSystem.usageText,
      projectCount: 0,
      detail: `${operatingSystem.percent}% thời gian coding diễn ra trên ${operatingSystem.name}`,
    });
  });

  return Array.from(merged.values())
    .sort((left, right) => {
      if (right.projectCount !== left.projectCount) {
        return right.projectCount - left.projectCount;
      }

      return (right.usagePercent ?? 0) - (left.usagePercent ?? 0);
    })
    .slice(0, 8);
}

function buildActivityInsights(
  wakaRange: WakaTimeAggregateRange | null,
): SkillsActivityInsight[] {
  if (!wakaRange) {
    return [];
  }

  const averagePerDaySeconds = wakaRange.totalSeconds / 7;
  const topProject = wakaRange.projects[0];

  return [
    {
      label: "Thời gian code trung bình",
      value: formatSeconds(averagePerDaySeconds),
      description: "Mức trung bình mỗi ngày trong 7 ngày gần nhất.",
    },
    {
      label: "Ngày có hoạt động",
      value: `${wakaRange.activeDays}/7`,
      description: "Số ngày có ghi nhận coding trong tuần gần nhất.",
    },
    {
      label: "Dự án nhiều nhất tuần này",
      value: topProject?.name ?? "Chưa có dữ liệu",
      description: topProject
        ? `${topProject.usageText} được ghi nhận trong 7 ngày qua.`
        : "WakaTime chưa trả về project nào trong tuần gần nhất.",
    },
  ];
}

function buildOverviewStats({
  githubSnapshot,
  projectSnapshot,
  wakatimeSnapshot,
  softSkillsCount,
  coreTechCount,
}: {
  githubSnapshot: GitHubSkillSnapshot | null;
  projectSnapshot: ProjectArchiveSkillSnapshot | null;
  wakatimeSnapshot: WakaTimeSkillSnapshot | null;
  softSkillsCount: number;
  coreTechCount: number;
}) {
  const stats: SkillsOverviewStat[] = [
    {
      label: "Công nghệ cốt lõi",
      value: String(coreTechCount),
      description: "Số công nghệ được tổng hợp từ GitHub, kho tài liệu và WakaTime.",
    },
    {
      label: "Kỹ năng mềm",
      value: String(softSkillsCount),
      description: "Nhóm kỹ năng làm việc được khai báo thủ công.",
    },
  ];

  if (githubSnapshot) {
    stats.unshift({
      label: "Repo GitHub đã phân tích",
      value: String(githubSnapshot.scannedRepoCount),
      description: `Đang đọc các repo gần đây của ${githubSnapshot.username}.`,
    });
  }

  if (wakatimeSnapshot) {
    stats.splice(1, 0, {
      label: "Thời gian code 30 ngày",
      value: wakatimeSnapshot.lastThirtyDays.totalText,
      description: "Tổng thời gian coding WakaTime ghi nhận trong 30 ngày gần nhất.",
    });
  }

  if (projectSnapshot) {
    stats.push({
      label: "Tài liệu được liên kết",
      value: String(projectSnapshot.scannedProjectCount),
      description: "Số tài liệu công khai đang được dùng làm minh chứng cho kỹ năng.",
    });
  }

  return stats;
}

function buildGitHubState({
  username,
  snapshot,
  error,
}: {
  username: string | null;
  snapshot: GitHubSkillSnapshot | null;
  error: string | null;
}): SkillsSourceState {
  if (!username) {
    return {
      label: "GitHub chưa kết nối",
      status: "needs-config",
      description:
        "Thêm GITHUB_USERNAME hoặc cập nhật link GitHub trong hồ sơ quản trị để phần này tự lấy repo.",
    };
  }

  if (error) {
    // Raw error stays in server logs; it can leak internals and break layout
    console.error("Skills source \"GitHub\" failed:", error);
    return {
      label: "GitHub đang lỗi",
      status: "error",
      description: "Chưa lấy được dữ liệu từ GitHub. Hệ thống sẽ thử lại ở lần tải sau.",
    };
  }

  if (!snapshot) {
    return {
      label: "GitHub chưa có repo phù hợp",
      status: "empty",
      description: `Không tìm thấy repo công khai nào để phân tích cho ${username}.`,
    };
  }

  return {
    label: `GitHub: ${username}`,
    status: "ready",
    description: `Đã phân tích ${snapshot.scannedRepoCount} repo gần đây để dựng danh sách công nghệ và minh chứng dự án.`,
  };
}

function buildWakaTimeState({
  snapshot,
  error,
}: {
  snapshot: WakaTimeSkillSnapshot | null;
  error: string | null;
}): SkillsSourceState {
  if (!process.env.WAKATIME_API_KEY?.trim()) {
    return {
      label: "WakaTime chưa kết nối",
      status: "needs-config",
      description:
        "Thêm WAKATIME_API_KEY ở máy chủ để mở dữ liệu thời gian sử dụng, công cụ và nhịp làm việc.",
    };
  }

  if (error) {
    // Raw error stays in server logs; it can leak internals and break layout
    console.error("Skills source \"WakaTime\" failed:", error);
    return {
      label: "WakaTime đang lỗi",
      status: "error",
      description: "Chưa lấy được dữ liệu từ WakaTime. Hệ thống sẽ thử lại ở lần tải sau.",
    };
  }

  if (!snapshot) {
    return {
      label: "WakaTime chưa có dữ liệu",
      status: "empty",
      description: "Chưa nhận được dữ liệu tổng hợp từ WakaTime.",
    };
  }

  return {
    label: "WakaTime đang hoạt động",
    status: "ready",
    description: `Đã tổng hợp ${snapshot.lastThirtyDays.totalText} trong 30 ngày và ${snapshot.lastSevenDays.totalText} trong 7 ngày gần nhất.`,
  };
}

function buildProjectState({
  snapshot,
  error,
}: {
  snapshot: ProjectArchiveSkillSnapshot | null;
  error: string | null;
}): SkillsSourceState {
  if (error) {
    // Raw error stays in server logs; it can leak internals and break layout
    console.error("Skills source \"Kho tài liệu\" failed:", error);
    return {
      label: "Kho tài liệu đang lỗi",
      status: "error",
      description: "Chưa đọc được dữ liệu kho tài liệu. Hệ thống sẽ thử lại ở lần tải sau.",
    };
  }

  if (!snapshot) {
    return {
      label: "Kho tài liệu trống",
      status: "empty",
      description: "Chưa có tài liệu công khai nào để làm minh chứng cho kỹ năng.",
    };
  }

  return {
    label: "Kho tài liệu sẵn sàng",
    status: "ready",
    description: `Đã liên kết ${snapshot.scannedProjectCount} tài liệu công khai làm minh chứng cho kỹ năng.`,
  };
}

function buildSoftSkills(): SkillsSoftSkill[] {
  return DEFAULT_SOFT_SKILLS;
}

function collectProjectArchiveTechNames(project: ProjectArchiveRow) {
  return collectTechNamesFromTokens(
    [
      project.title,
      project.subjectName,
      project.techStack,
      project.shortDescription,
    ].flatMap(tokenizeTechInput),
  );
}

function collectGitHubTechNames({
  repo,
  languages,
  packageJson,
}: {
  repo: GitHubRepoResponse;
  languages: Record<string, number>;
  packageJson: Record<string, unknown> | null;
}) {
  const techNames = new Set<string>();
  const rawTokens = [
    repo.language,
    ...(repo.topics ?? []),
    ...Object.keys(languages),
    ...extractPackageDependencies(packageJson),
  ].filter((token): token is string => Boolean(token));

  if (repo.homepage?.includes("vercel.app")) {
    rawTokens.push("vercel");
  }

  rawTokens.forEach((token) => {
    const techName = resolveTechLabel(token);

    if (techName) {
      techNames.add(techName);
    }
  });

  return techNames;
}

function collectTechNamesFromTokens(tokens: string[]) {
  const techNames = new Set<string>();

  tokens.forEach((token) => {
    const techName = resolveTechLabel(token);

    if (techName) {
      techNames.add(techName);
    }
  });

  return techNames;
}

function tokenizeTechInput(value: string) {
  return value
    .split(/[\s,;/(){}[\]|:_-]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildGitHubEvidenceBadges(repo: {
  homepageUrl: string | null;
  primaryLanguage: string | null;
  updatedAtValue: string;
}) {
  const badges = new Set<string>();

  if (repo.homepageUrl) {
    badges.add("Đã triển khai");
  }

  if (isRecentDate(repo.updatedAtValue)) {
    badges.add("Mới cập nhật");
  }

  if (repo.primaryLanguage) {
    badges.add(repo.primaryLanguage);
  }

  return Array.from(badges).slice(0, 3);
}

function buildProjectArchiveBadges(project: ProjectArchiveRow) {
  const badges = new Set<string>(["Kho tài liệu"]);

  if (project.demoUrl?.trim()) {
    badges.add("Có demo");
  }

  if (project.githubUrl?.trim()) {
    badges.add("GitHub");
  }

  if (isRecentDate(project.createdAt)) {
    badges.add("Mới cập nhật");
  }

  return Array.from(badges);
}

function createSkillCard({
  name,
  usagePercent,
  usageText,
  sourceLabels,
  evidenceProjects,
}: {
  name: string;
  usagePercent: number | null;
  usageText: string | null;
  sourceLabels: string[];
  evidenceProjects: SkillEvidenceProject[];
}): SkillTechCard {
  const dedupedEvidenceProjects = dedupeEvidenceProjects(evidenceProjects);
  const latestActivity = pickLatestActivityInfo(dedupedEvidenceProjects);
  const category = getSkillCategory(name);

  return {
    name,
    summary: getSkillSummary(name),
    category,
    categoryLabel: SKILL_CATEGORY_LABELS[category],
    projectCount: dedupedEvidenceProjects.length,
    usagePercent,
    usageText,
    sourceLabels: sortSourceLabels(sourceLabels),
    evidenceProjects: dedupedEvidenceProjects,
    primaryGithubHref: pickPrimaryGithubHref(dedupedEvidenceProjects),
    latestActivityAt: latestActivity.value,
    latestActivityLabel: latestActivity.label,
  };
}

function mergeSkillCardCollection(
  merged: Map<string, SkillTechCard>,
  items: SkillTechCard[],
) {
  items.forEach((item) => {
    const existing = merged.get(item.name);

    if (!existing) {
      merged.set(item.name, {
        ...item,
        sourceLabels: [...item.sourceLabels],
        evidenceProjects: [...item.evidenceProjects],
      });
      return;
    }

    merged.set(item.name, mergeSkillCards(existing, item));
  });
}

function mergeSkillCards(left: SkillTechCard, right: SkillTechCard): SkillTechCard {
  const evidenceProjects = dedupeEvidenceProjects([
    ...left.evidenceProjects,
    ...right.evidenceProjects,
  ]);
  const usage = pickUsageSignal(left, right);
  const latestActivity = pickLatestActivityInfo(evidenceProjects);

  return {
    ...left,
    summary: left.summary || right.summary,
    category: left.category,
    categoryLabel: left.categoryLabel,
    projectCount: evidenceProjects.length,
    usagePercent: usage.percent,
    usageText: usage.text,
    sourceLabels: sortSourceLabels([...left.sourceLabels, ...right.sourceLabels]),
    evidenceProjects,
    primaryGithubHref: pickPrimaryGithubHref(evidenceProjects),
    latestActivityAt: latestActivity.value,
    latestActivityLabel: latestActivity.label,
  };
}

function pickUsageSignal(left: SkillTechCard, right: SkillTechCard) {
  if (right.usagePercent === null && right.usageText === null) {
    return {
      percent: left.usagePercent,
      text: left.usageText,
    };
  }

  if (left.usagePercent === null && left.usageText === null) {
    return {
      percent: right.usagePercent,
      text: right.usageText,
    };
  }

  if ((right.usagePercent ?? 0) > (left.usagePercent ?? 0)) {
    return {
      percent: right.usagePercent,
      text: right.usageText,
    };
  }

  return {
    percent: left.usagePercent,
    text: left.usageText,
  };
}

function pickLatestActivityInfo(evidenceProjects: SkillEvidenceProject[]) {
  const latestProject = evidenceProjects
    .filter((project) => Boolean(project.updatedAt))
    .sort((left, right) => {
      return (right.updatedAt ?? "").localeCompare(left.updatedAt ?? "");
    })[0];

  return {
    value: latestProject?.updatedAt ?? null,
    label: latestProject?.updatedAtLabel ?? null,
  };
}

function dedupeEvidenceProjects(evidenceProjects: SkillEvidenceProject[]) {
  const deduped = new Map<string, SkillEvidenceProject>();

  evidenceProjects.forEach((project) => {
    const key = `${project.isExternal ? "external" : "internal"}:${project.href}`;
    deduped.set(key, project);
  });

  return Array.from(deduped.values()).sort((left, right) => {
    if ((right.updatedAt ?? "") !== (left.updatedAt ?? "")) {
      return (right.updatedAt ?? "").localeCompare(left.updatedAt ?? "");
    }

    return left.name.localeCompare(right.name);
  });
}

function pickPrimaryGithubHref(evidenceProjects: SkillEvidenceProject[]) {
  const githubProject = evidenceProjects.find((project) => project.githubHref);
  return githubProject?.githubHref ?? null;
}

function sortSourceLabels(sourceLabels: string[]) {
  const order = new Map(
    ["GitHub", "Projects", "WakaTime"].map((label, index) => [label, index]),
  );

  return Array.from(new Set(sourceLabels)).sort((left, right) => {
    return (order.get(left) ?? 99) - (order.get(right) ?? 99);
  });
}

function isRecentDate(value: string | Date, recentDays = 120) {
  const time = new Date(value).getTime();

  if (!Number.isFinite(time)) {
    return false;
  }

  return Date.now() - time <= recentDays * 24 * 60 * 60 * 1000;
}

function extractPackageDependencies(packageJson: Record<string, unknown> | null) {
  if (!packageJson) {
    return [];
  }

  return [
    ...Object.keys(readPackageSection(packageJson.dependencies)),
    ...Object.keys(readPackageSection(packageJson.devDependencies)),
    ...Object.keys(readPackageSection(packageJson.peerDependencies)),
  ];
}

function readPackageSection(value: unknown) {
  return typeof value === "object" && value !== null
    ? (value as Record<string, string>)
    : {};
}

function shouldReadPackageJson(repo: GitHubRepoResponse) {
  return ["TypeScript", "JavaScript", "HTML", "CSS"].includes(repo.language ?? "");
}

function decodePackageJson(
  payload: GitHubPackageJsonResponse,
): Record<string, unknown> | null {
  if (payload.encoding !== "base64" || !payload.content) {
    return null;
  }

  try {
    const content = Buffer.from(payload.content, "base64").toString("utf-8");
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function resolveGitHubUsername(githubUrl: string | null | undefined) {
  const fromEnv = process.env.GITHUB_USERNAME?.trim();

  if (fromEnv) {
    return fromEnv;
  }

  if (!githubUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(githubUrl);
    const username = parsedUrl.pathname.split("/").filter(Boolean)[0];
    return username || null;
  } catch {
    return null;
  }
}

function resolveGitHubRepoLimit(hasToken: boolean) {
  const fallback = hasToken ? 24 : 10;
  const parsedLimit = Number(process.env.SKILLS_GITHUB_REPO_LIMIT ?? fallback);

  if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
    return fallback;
  }

  return Math.min(100, Math.floor(parsedLimit));
}

function buildGitHubHeaders() {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN?.trim();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function buildTechTokenMap() {
  const tokenMap = new Map<string, (typeof TECH_DEFINITIONS)[number]>();

  TECH_DEFINITIONS.forEach((definition) => {
    definition.tokens.forEach((token) => {
      tokenMap.set(normalizeTechToken(token), definition);
    });
  });

  return tokenMap;
}

function resolveTechLabel(rawToken: string) {
  const candidates = expandRawToken(rawToken);

  for (const candidate of candidates) {
    const techDefinition = TECH_TOKEN_MAP.get(normalizeTechToken(candidate));

    if (techDefinition) {
      return techDefinition.label;
    }
  }

  return null;
}

function getTechCategory(techName: string) {
  return (
    TECH_DEFINITIONS.find((definition) => definition.label === techName)?.category ??
    "core"
  );
}

function getSkillCategory(techName: string): SkillCategory {
  return (
    TECH_DEFINITIONS.find((definition) => definition.label === techName)?.group ??
    "other"
  );
}

function getSkillSummary(techName: string) {
  return (
    TECH_DEFINITIONS.find((definition) => definition.label === techName)?.summary ??
    "Kỹ năng được tổng hợp từ mã nguồn, dữ liệu sử dụng và kho tài liệu."
  );
}

function expandRawToken(rawToken: string) {
  const trimmedToken = rawToken.trim().toLowerCase();
  const withoutVersion = trimmedToken.replace(/@[\^~]?\d.*$/, "");
  const baseParts = withoutVersion.split(/[\/\-. _]+/).filter(Boolean);

  return [trimmedToken, withoutVersion, ...baseParts];
}

function normalizeTechToken(value: string) {
  return value
    .toLowerCase()
    .replace(/\+\+/g, "pp")
    .replace(/#/g, "sharp")
    .replace(/\.js/g, "js")
    .replace(/[^a-z0-9]/g, "");
}

function compareTechCards(left: SkillTechCard, right: SkillTechCard) {
  const leftPriority = getCoreTechPriority(left.name);
  const rightPriority = getCoreTechPriority(right.name);

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  if (right.projectCount !== left.projectCount) {
    return right.projectCount - left.projectCount;
  }

  return (right.usagePercent ?? 0) - (left.usagePercent ?? 0);
}

function getCoreTechPriority(techName: string) {
  const index = CORE_TECH_PRIORITY.indexOf(
    techName as (typeof CORE_TECH_PRIORITY)[number],
  );

  return index === -1 ? CORE_TECH_PRIORITY.length + 1 : index;
}

function formatDateLabel(value: string | Date) {
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatSeconds(totalSeconds: number) {
  const roundedSeconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(roundedSeconds / 3600);
  const minutes = Math.floor((roundedSeconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Lỗi không xác định";
}

