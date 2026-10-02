// Fill `project_files.entries` for archives uploaded before ZIP previews existed.
//
//   npm run archives:backfill            # write changes
//   npm run archives:backfill -- --dry-run

import { Prisma, PrismaClient } from "@prisma/client";
import { buildArchiveManifest } from "@/lib/projects/archive-manifest";
import { downloadStoredProjectArchive } from "@/lib/storage/project-archives";

const prisma = new PrismaClient();
const isDryRun = process.argv.includes("--dry-run");

async function main() {
  const files = await prisma.projectFile.findMany({
    where: { entries: { equals: Prisma.DbNull } },
    select: { id: true, fileName: true, filePath: true },
  });

  console.log(
    `${files.length} archive chưa có manifest${isDryRun ? " (dry run)" : ""}.`,
  );

  let failed = 0;

  for (const file of files) {
    try {
      const blob = await downloadStoredProjectArchive(file.filePath);
      const manifest = await buildArchiveManifest(await blob.arrayBuffer());

      if (!isDryRun) {
        await prisma.projectFile.update({
          where: { id: file.id },
          data: { entries: manifest as unknown as Prisma.InputJsonValue },
        });
      }

      console.log(`✓ ${file.fileName}: ${manifest.totalFiles} file`);
    } catch (error) {
      failed += 1;
      console.error(`✗ ${file.fileName}:`, error instanceof Error ? error.message : error);
    }
  }

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().finally(() => prisma.$disconnect());
