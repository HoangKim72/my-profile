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
    name: "Problem Solving",
    description:
      "Tách bài toán thành phần nhỏ, ưu tiên đúng bottleneck và đi tới lời giải dùng được.",
  },
  {
    name: "Communication",
    description:
      "Trao đổi rõ ràng về tiến độ, rủi ro và cách phối hợp để công việc không bị nghẽn.",
  },
  {
    name: "Teamwork",
    description:
      "Làm việc theo tinh thần đồng đội, giữ code dễ bàn giao và dễ mở rộng cho người khác.",
  },
  {
    name: "Time Management",
    description:
      "Biết chia nhỏ việc, giữ nhịp triển khai và cân bằng giữa chất lượng với tốc độ giao hàng.",
  },
];

const TECH_DEFINITIONS = [
  {
    label: "TypeScript",
    category: "core",
    group: "language",
    summary: "Typed foundation cho app logic va component contracts.",
    tokens: ["typescript", "ts"],
  },
  {
    label: "JavaScript",
    category: "core",
    group: "language",
    summary: "Ngon ngu nen cho scripting, browser behavior va app flows.",
    tokens: ["javascript", "js"],
  },
  {
    label: "React",
    category: "core",
    group: "frontend",
    summary: "Build giao dien tuong tac voi component-based UI.",
    tokens: ["react"],
  },
  {
    label: "Next.js",
    category: "core",
    group: "frontend",
    summary: "Full-stack React framework cho routing, data loading va delivery.",
    tokens: ["next", "nextjs"],
  },
  {
    label: "Node.js",
    category: "core",
    group: "backend",
    summary: "Runtime cho API, scripts va server-side application logic.",
    tokens: ["node", "nodejs"],
  },
  {
    label: "Tailwind CSS",
    category: "core",
    group: "frontend",
    summary: "Utility-first styling cho responsive UI systems.",
    tokens: ["tailwind", "tailwindcss"],
  },
  {
    label: "HTML",
    category: "core",
    group: "frontend",
    summary: "Semantic structure va content scaffolding cho giao dien.",
    tokens: ["html"],
  },
  {
    label: "CSS",
    category: "core",
    group: "frontend",
    summary: "Layout, motion va visual presentation cho interfaces.",
    tokens: ["css"],
  },
  {
    label: "PostgreSQL",
    category: "core",
    group: "database",
    summary: "Relational data modeling, queries va persistence co cau truc.",
    tokens: ["postgres", "postgresql", "pg"],
  },
  {
    label: "Prisma",
    category: "core",
    group: "database",
    summary: "Typed ORM va schema-driven database workflows.",
    tokens: ["prisma"],
  },
  {
    label: "Supabase",
    category: "core",
    group: "backend",
    summary: "Backend services cho auth, storage va Postgres-powered apps.",
    tokens: ["supabase"],
  },
  {
    label: "Express",
    category: "core",
    group: "backend",
    summary: "Lightweight HTTP APIs va middleware-based servers.",
    tokens: ["express"],
  },
  {
    label: "NestJS",
    category: "core",
    group: "backend",
    summary: "Structured backend modules, DI va scalable service layers.",
    tokens: ["nest", "nestjs"],
  },
  {
    label: "REST API",
    category: "core",
    group: "backend",
    summary: "Resource-based APIs dung de ket noi app va services.",
    tokens: ["rest", "restapi"],
  },
  {
    label: "GraphQL",
    category: "core",
    group: "backend",
    summary: "Typed graph queries cho flexible client data access.",
    tokens: ["graphql", "apollo"],
  },
  {
    label: "Python",
    category: "core",
    group: "language",
    summary: "General-purpose scripting, automation va backend logic.",
    tokens: ["python", "py"],
  },
  {
    label: "PHP",
    category: "core",
    group: "backend",
    summary: "Server-side web workflows va traditional application backends.",
    tokens: ["php"],
  },
  {
    label: "FastAPI",
    category: "core",
    group: "backend",
    summary: "High-performance Python APIs voi typed schemas.",
    tokens: ["fastapi"],
  },
  {
    label: "Django",
    category: "core",
    group: "backend",
    summary: "Opinionated Python framework cho database-backed applications.",
    tokens: ["django"],
  },
  {
    label: "MongoDB",
    category: "core",
    group: "database",
    summary: "Document database cho flexible schemas va content-heavy data.",
    tokens: ["mongodb", "mongoose"],
  },
  {
    label: "Docker",
    category: "tool",
    group: "platform",
    summary: "Containerized delivery va reproducible runtime environments.",
    tokens: ["docker", "dockerfile", "dockercompose"],
  },
  {
    label: "Vercel",
    category: "tool",
    group: "platform",
    summary: "Deployment platform cho frontend va full-stack web apps.",
    tokens: ["vercel"],
  },
  {
    label: "Git",
    category: "tool",
    group: "tooling",
    summary: "Version control de track thay doi va phoi hop code.",
    tokens: ["git"],
  },
  {
    label: "GitHub Actions",
    category: "tool",
    group: "platform",
    summary: "CI/CD pipelines cho automation, checks va releases.",
    tokens: ["githubactions", "actions"],
  },
  {
    label: "VS Code",
    category: "tool",
    group: "tooling",
    summary: "Editor workflow cho coding, debugging va daily iteration.",
    tokens: ["vscode", "visualstudiocode"],
  },
  {
    label: "Windows",
    category: "tool",
    group: "platform",
    summary: "Desktop development environment va local testing platform.",
    tokens: ["windows", "windown"],
  },
  {
    label: "macOS",
    category: "tool",
    group: "platform",
    summary: "Unix-based local environment cho product development.",
    tokens: ["macos", "macosx", "osx"],
  },
  {
    label: "Linux",
    category: "tool",
    group: "platform",
    summary: "Server-friendly environment cho deployment va tooling.",
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
  database: "Database",
  language: "Language",
  platform: "Platform",
  tooling: "Tooling",
  workflow: "Workflow",
  other: "Other",
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
        description:
          repo.description ||
          `Project evidence tu GitHub cho ${techName.toLowerCase()}.`,
        kindLabel: repo.homepageUrl ? "Production project" : "GitHub repo",
        isExternal: true,
        badges: buildGitHubEvidenceBadges(repo),
        supportingText: repo.homepageUrl
          ? "Co deploy production hoac preview de xem nhanh."
          : "Mo repo de xem implementation chi tiet.",
        updatedAt: repo.updatedAtValue,
        updatedAtLabel: repo.updatedAtLabel,
      });
      techEvidence.set(techName, existingEvidence);

      if (getTechCategory(techName) === "tool") {
        const evidenceProjects = Array.from(existingEvidence.values());
        toolMap.set(techName, {
          name: techName,
          category: "GitHub signal",
          usagePercent: null,
          usageText: null,
          projectCount: evidenceProjects.length,
          detail: `${evidenceProjects.length} project signal co ${techName}`,
        });
      }
    });
  });

  if (repoAnalyses.length > 0) {
    toolMap.set("Git", {
      name: "Git",
      category: "Source control",
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
        description: project.shortDescription,
        kindLabel: "Shared folder",
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
      category: "Editor",
      usagePercent: editor.percent,
      usageText: editor.usageText,
      projectCount: 0,
      detail: `${editor.percent}% thời gian tracked trong 30 ngày gần nhất`,
    });
  });

  wakaRange?.operatingSystems.slice(0, 2).forEach((operatingSystem) => {
    merged.set(operatingSystem.name, {
      name: operatingSystem.name,
      category: "Operating system",
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
      label: "Coding trung bình",
      value: formatSeconds(averagePerDaySeconds),
      description: "Mức trung bình mỗi ngày trong 7 ngày gần nhất.",
    },
    {
      label: "Ngày có hoạt động",
      value: `${wakaRange.activeDays}/7`,
      description: "Số ngày có ghi nhận coding trong tuần gần nhất.",
    },
    {
      label: "Top project tuần này",
      value: topProject?.name ?? "Chưa có dữ liệu",
      description: topProject
        ? `${topProject.usageText} tracked trong 7 ngày qua.`
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
      label: "Core stack hợp nhất",
      value: String(coreTechCount),
      description: "Số tech đang được tổng hợp từ GitHub, project evidence va WakaTime.",
    },
    {
      label: "Soft skills thủ công",
      value: String(softSkillsCount),
      description: "Nhóm kỹ năng làm việc vẫn được giữ ở chế độ manual.",
    },
  ];

  if (githubSnapshot) {
    stats.unshift({
      label: "Repo GitHub đã phân tích",
      value: String(githubSnapshot.scannedRepoCount),
      description: `Đang đọc các owner repo gần đây của ${githubSnapshot.username}.`,
    });
  }

  if (wakatimeSnapshot) {
    stats.splice(1, 0, {
      label: "Tracked time 30 ngày",
      value: wakatimeSnapshot.lastThirtyDays.totalText,
      description: "Tổng thời gian coding WakaTime ghi nhận trong 30 ngày gần nhất.",
    });
  }

  if (projectSnapshot) {
    stats.push({
      label: "Project archive mapped",
      value: String(projectSnapshot.scannedProjectCount),
      description: "So project cong khai dang duoc link lai lam evidence trong Skills.",
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
        "Thêm GITHUB_USERNAME hoặc cập nhật githubUrl trong profile admin để section này tự kéo repo.",
    };
  }

  if (error) {
    return {
      label: "GitHub đang lỗi",
      status: "error",
      description: truncateText(error, 140),
    };
  }

  if (!snapshot) {
    return {
      label: "GitHub chưa có repo phù hợp",
      status: "empty",
      description: `Không tìm thấy owner repo public nào để phân tích cho ${username}.`,
    };
  }

  return {
    label: `GitHub: ${username}`,
    status: "ready",
    description: `Đã phân tích ${snapshot.scannedRepoCount} repo gần đây để dựng core stack và project evidence.`,
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
        "Thêm WAKATIME_API_KEY ở server để mở dữ liệu usage, tools và activity insight.",
    };
  }

  if (error) {
    return {
      label: "WakaTime đang lỗi",
      status: "error",
      description: truncateText(error, 140),
    };
  }

  if (!snapshot) {
    return {
      label: "WakaTime chưa có dữ liệu",
      status: "empty",
      description: "Chưa nhận được coding summaries từ WakaTime.",
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
    return {
      label: "Project archive dang loi",
      status: "error",
      description: truncateText(error, 140),
    };
  }

  if (!snapshot) {
    return {
      label: "Project archive trong",
      status: "empty",
      description: "Chua co project cong khai nao de gan vao skill evidence.",
    };
  }

  return {
    label: "Project archive san sang",
    status: "ready",
    description: `Da map ${snapshot.scannedProjectCount} project cong khai de giu duong dan vao archive du khong con o navbar.`,
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
    badges.add("Production");
  }

  if (isRecentDate(repo.updatedAtValue)) {
    badges.add("Recent");
  }

  if (repo.primaryLanguage) {
    badges.add(repo.primaryLanguage);
  }

  return Array.from(badges).slice(0, 3);
}

function buildProjectArchiveBadges(project: ProjectArchiveRow) {
  const badges = new Set<string>(["Archive"]);

  if (project.demoUrl?.trim()) {
    badges.add("Live demo");
  }

  if (project.githubUrl?.trim()) {
    badges.add("GitHub");
  }

  if (isRecentDate(project.createdAt)) {
    badges.add("Recent");
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
    "Project-backed skill signal duoc tong hop tu code, telemetry va archive."
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
  return error instanceof Error ? error.message : "Unknown error";
}

function truncateText(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}...`;
}
