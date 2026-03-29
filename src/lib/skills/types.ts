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

export interface SkillEvidenceRepo {
  name: string;
  url: string;
}

export interface SkillTechCard {
  name: string;
  projectCount: number;
  usagePercent: number | null;
  usageText: string | null;
  sourceLabels: string[];
  evidenceRepos: SkillEvidenceRepo[];
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
