import { headers } from "next/headers";
import type { NextRequest } from "next/server";

export async function getClientIp() {
  const headerStore = await headers();

  return getClientIpFromHeaderStore(headerStore);
}

export function getClientIpFromRequest(request: NextRequest) {
  return getClientIpFromHeaderStore(request.headers);
}

function getClientIpFromHeaderStore(headerStore: Headers) {
  const forwardedFor = headerStore.get("x-forwarded-for");

  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(",");

    if (firstIp?.trim()) {
      return firstIp.trim();
    }
  }

  const realIp =
    headerStore.get("x-real-ip") ??
    headerStore.get("cf-connecting-ip") ??
    headerStore.get("x-client-ip");

  return realIp?.trim() || "unknown";
}
