import { SITE_NAME } from "@/lib/utils/constants";
import { parseResumeContent, splitParagraphs } from "@/lib/profile/resume-content";

const DEFAULT_SUMMARY = [
  "Tôi xây dựng các ứng dụng web và công cụ thực dụng, ưu tiên trải nghiệm rõ ràng, dễ vận hành và dễ mở rộng.",
  "Website này đóng vai trò hồ sơ cá nhân, bảng điều khiển quản trị và nơi tổng hợp các công cụ có thể sử dụng trực tiếp trên web.",
];

const DEFAULT_CURRENT_FOCUS =
  "Hiện tại tôi đang tập trung hoàn thiện hồ sơ cá nhân, mở rộng bảng điều khiển quản trị và biến website thành bộ công cụ hữu ích cho công việc thực tế.";

const DEFAULT_STRENGTHS = [
  "Phát triển giao diện responsive bằng Next.js, React và Tailwind CSS.",
  "Xây dựng bảng điều khiển và luồng quản trị đơn giản, dễ duy trì trong thực tế.",
  "Kết nối xác thực, cơ sở dữ liệu và server actions cho các tính năng cần dữ liệu động.",
];

const DEFAULT_HIGHLIGHTS = [
  "Website đã có đăng nhập, phân quyền cơ bản và bảng điều khiển quản trị.",
  "Website đã được triển khai lên Vercel và tiếp tục hoàn thiện cho môi trường production.",
  "Đang phát triển thêm các công cụ nghiệp vụ như công cụ lọc mic ngay trên web.",
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
      "Lập trình viên xây dựng hồ sơ cá nhân, bảng điều khiển và công cụ web thực dụng.",
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
