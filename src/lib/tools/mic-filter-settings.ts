import "server-only";

import { prisma } from "@/lib/db/prisma";
import {
  DEFAULT_MIC_FILTER_CONFIG,
  MIC_FILTER_SETTINGS_KEY,
  micFilterConfigSchema,
  type MicFilterConfig,
} from "@/tools/mic-filter/config";

export interface LoadedMicFilterConfig {
  config: MicFilterConfig;
  source: "database" | "default";
  updatedAt: Date | null;
  // Set when a stored value exists but no longer validates
  warning: string | null;
}

// Never throws: the mic tool is used every shift and must keep working with
// the built-in defaults even if the database is unreachable.
export async function getMicFilterConfig(): Promise<LoadedMicFilterConfig> {
  try {
    const setting = await prisma.toolSetting.findUnique({
      where: { key: MIC_FILTER_SETTINGS_KEY },
    });

    if (!setting) {
      return defaultResult(null);
    }

    const parsed = micFilterConfigSchema.safeParse(setting.value);

    if (!parsed.success) {
      return defaultResult(
        "Cấu hình đã lưu không hợp lệ nên tool đang dùng cấu hình mặc định.",
      );
    }

    return {
      config: parsed.data,
      source: "database",
      updatedAt: setting.updatedAt,
      warning: null,
    };
  } catch (error) {
    console.error("Unable to load mic filter config:", error);
    return defaultResult(
      "Không đọc được cấu hình từ database nên tool đang dùng cấu hình mặc định.",
    );
  }
}

function defaultResult(warning: string | null): LoadedMicFilterConfig {
  return {
    config: DEFAULT_MIC_FILTER_CONFIG,
    source: "default",
    updatedAt: null,
    warning,
  };
}
