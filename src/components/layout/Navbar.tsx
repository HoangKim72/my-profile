import { getCurrentUser } from "@/lib/auth/check-auth";
import { NavbarClient } from "@/components/layout/NavbarClient";

export async function Navbar() {
  const user = await getCurrentUser();

  return <NavbarClient user={user} />;
}
