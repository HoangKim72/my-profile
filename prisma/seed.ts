// prisma/seed.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Create roles
  await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: {
      name: "admin",
      description: "Administrator with full access",
    },
  });

  await prisma.role.upsert({
    where: { name: "viewer" },
    update: {},
    create: {
      name: "viewer",
      description: "Can view shared projects",
    },
  });

  console.log("✓ Roles created");

  // Create sample user (you would normally do this via Supabase Auth)
  // In production, create users through your auth flow
  // const sampleUser = await prisma.user.upsert({
  //   where: { email: 'admin@example.com' },
  //   update: {},
  //   create: {
  //     email: 'admin@example.com',
  //     profile: {
  //       create: {
  //         fullName: 'John Doe',
  //         headline: 'Full Stack Developer',
  //         bio: 'Passionate about building amazing web applications',
  //       },
  //     },
  //   },
  // })

  // console.log('✓ Sample user created')

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
