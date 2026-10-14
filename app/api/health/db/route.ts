// Temporary diagnostic: why the Vercel preview cannot reach the database.
// Returns only presence flags, host and error class/code — never credentials.
// Remove once the preview database connection is fixed.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

function describeUrl(name: string) {
  const value = process.env[name];

  if (!value) {
    return { set: false };
  }

  try {
    const url = new URL(value);
    return { set: true, host: url.hostname, port: url.port };
  } catch {
    return { set: true, parseable: false };
  }
}

function redact(message: string) {
  return message
    .replace(/\/\/[^@\s]*@/g, "//***@")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-3)
    .join(" | ")
    .slice(0, 400);
}

export async function GET() {
  const env = {
    DATABASE_URL: describeUrl("DATABASE_URL"),
    DIRECT_URL: describeUrl("DIRECT_URL"),
    VERCEL_ENV: process.env.VERCEL_ENV ?? null,
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, env });
  } catch (error) {
    const err = error as { name?: string; errorCode?: string; code?: string; message?: string };

    return NextResponse.json(
      {
        ok: false,
        env,
        error: {
          name: err.name ?? null,
          code: err.errorCode ?? err.code ?? null,
          message: redact(err.message ?? String(error)),
        },
      },
      { status: 500 },
    );
  }
}
