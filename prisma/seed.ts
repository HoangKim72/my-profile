// prisma/seed.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: {
      name: "admin",
      description: "Administrator with full access",
    },
  });

  const viewerRole = await prisma.role.upsert({
    where: { name: "viewer" },
    update: {},
    create: {
      name: "viewer",
      description: "Can view shared projects",
    },
  });

  console.log("✓ Roles created");

  // Create sample tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { slug: "react" },
      update: {},
      create: { name: "React", slug: "react" },
    }),
    prisma.tag.upsert({
      where: { slug: "nextjs" },
      update: {},
      create: { name: "Next.js", slug: "nextjs" },
    }),
    prisma.tag.upsert({
      where: { slug: "tailwind" },
      update: {},
      create: { name: "Tailwind CSS", slug: "tailwind" },
    }),
    prisma.tag.upsert({
      where: { slug: "typescript" },
      update: {},
      create: { name: "TypeScript", slug: "typescript" },
    }),
    prisma.tag.upsert({
      where: { slug: "nodejs" },
      update: {},
      create: { name: "Node.js", slug: "nodejs" },
    }),
    prisma.tag.upsert({
      where: { slug: "postgresql" },
      update: {},
      create: { name: "PostgreSQL", slug: "postgresql" },
    }),
  ]);

  console.log("✓ Tags created");

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
