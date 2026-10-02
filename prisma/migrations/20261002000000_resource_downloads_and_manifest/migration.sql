-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "downloadCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "project_files" ADD COLUMN     "entries" JSONB;

