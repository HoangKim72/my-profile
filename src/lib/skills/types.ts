export type SkillsSourceStatus = "ready" | "needs-config" | "empty" | "error";

export interface SkillsSourceState {
  label: string;
  status: SkillsSourceStatus;
  description: string;
}

export interface SkillsOverviewStat {
  label: string;
  value: string;
  description: string;
}

export type SkillCategory =
  | "frontend"
  | "backend"
  | "database"
  | "language"
  | "platform"
  | "tooling"
  | "workflow"
  | "other";

export interface SkillEvidenceProject {
  name: string;
  href: string;
  description: string | null;
  kindLabel: string;
  isExternal: boolean;
  badges: string[];
  supportingText: string | null;
  updatedAt: string | null;
  updatedAtLabel: string | null;
}

export interface SkillTechCard {
  name: string;
  summary: string;
  category: SkillCategory;
  categoryLabel: string;
  projectCount: number;
  usagePercent: number | null;
  usageText: string | null;
  sourceLabels: string[];
  evidenceProjects: SkillEvidenceProject[];
  latestActivityAt: string | null;
  latestActivityLabel: string | null;
}

export interface SkillsLanguageItem {
  name: string;
  percent: number;
  usageText: string;
}

export interface SkillsToolItem {
  name: string;
  category: string;
  usagePercent: number | null;
  usageText: string | null;
  projectCount: number;
  detail: string;
}

export interface SkillsActivityInsight {
  label: string;
  value: string;
  description: string;
}

export interface SkillsSoftSkill {
  name: string;
  description: string;
}

export interface GitHubProjectSpotlight {
  name: string;
  url: string;
  description: string | null;
  updatedAtLabel: string;
  primaryLanguage: string | null;
  techNames: string[];
  homepageUrl: string | null;
}

export interface SkillsPageData {
  githubState: SkillsSourceState;
  projectState: SkillsSourceState;
  wakatimeState: SkillsSourceState;
  overviewStats: SkillsOverviewStat[];
  coreTechStack: SkillTechCard[];
  githubTechStack: SkillTechCard[];
  mostUsedLanguages: SkillsLanguageItem[];
  toolsAndEnvironment: SkillsToolItem[];
  activityInsights: SkillsActivityInsight[];
  softSkills: SkillsSoftSkill[];
  githubProjects: GitHubProjectSpotlight[];
}
