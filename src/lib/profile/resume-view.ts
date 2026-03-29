import { SITE_NAME } from "@/lib/utils/constants";
import { parseResumeContent, splitParagraphs } from "@/lib/profile/resume-content";

const DEFAULT_SUMMARY = [
  "Toi xay dung cac ung dung web va cong cu thuc dung, uu tien trai nghiem ro rang, de van hanh va de mo rong.",
  "Website nay dong vai tro portfolio ca nhan, dashboard quan tri va noi tong hop cac cong cu co the su dung truc tiep tren web.",
];

const DEFAULT_CURRENT_FOCUS =
  "Hien tai toi dang tap trung vao viec hoan thien portfolio, mo rong dashboard quan tri, va bien website thanh bo cong cu huu ich cho cong viec thuc te.";

const DEFAULT_STRENGTHS = [
  "Phat trien giao dien responsive bang Next.js, React va Tailwind CSS.",
  "Xay dung dashboard va luong quan tri don gian, de duy tri trong thuc te.",
  "Ket noi auth, database va server actions cho cac tinh nang can du lieu dong.",
];

const DEFAULT_HIGHLIGHTS = [
  "Portfolio da co auth, role co ban va dashboard quan tri duoc.",
  "Website da duoc deploy len Vercel va tiep tuc hoan thien cho production.",
  "Dang phat trien them cac cong cu nghiep vu nhu Tool loc mic ngay tren web.",
];

export interface ResumeProfileSource {
  fullName: string | null;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  email: string | null;
  phone: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  facebookUrl: string | null;
  websiteUrl: string | null;
  user?: {
    email: string | null;
  } | null;
}

export interface ResumeViewModel {
  fullName: string;
  headline: string;
  avatarUrl: string | null;
  summaryParagraphs: string[];
  currentFocus: string;
  strengths: string[];
  highlights: string[];
  publicEmail: string | null;
  phone: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  facebookUrl: string | null;
  websiteUrl: string | null;
}

export function buildResumeViewModel(
  profile: ResumeProfileSource | null | undefined,
): ResumeViewModel {
  const resumeContent = parseResumeContent(profile?.bio);
  const summaryParagraphs = splitParagraphs(resumeContent.summary);

  return {
    fullName: profile?.fullName?.trim() || SITE_NAME,
    headline:
      profile?.headline?.trim() ||
      "Developer xay dung portfolio, dashboard va cong cu web thuc dung.",
    avatarUrl: profile?.avatarUrl?.trim() || null,
    summaryParagraphs:
      summaryParagraphs.length > 0 ? summaryParagraphs : DEFAULT_SUMMARY,
    currentFocus: resumeContent.currentFocus || DEFAULT_CURRENT_FOCUS,
    strengths:
      resumeContent.strengths.length > 0
        ? resumeContent.strengths
        : DEFAULT_STRENGTHS,
    highlights:
      resumeContent.highlights.length > 0
        ? resumeContent.highlights
        : DEFAULT_HIGHLIGHTS,
    publicEmail: profile?.email?.trim() || profile?.user?.email || null,
    phone: profile?.phone?.trim() || null,
    githubUrl: profile?.githubUrl?.trim() || null,
    linkedinUrl: profile?.linkedinUrl?.trim() || null,
    facebookUrl: profile?.facebookUrl?.trim() || null,
    websiteUrl: profile?.websiteUrl?.trim() || null,
  };
}
