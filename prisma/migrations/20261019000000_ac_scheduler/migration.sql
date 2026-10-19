-- CreateEnum
CREATE TYPE "AcScheduleStatus" AS ENUM ('ACTIVE', 'SUPERSEDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AcAction" AS ENUM ('ON', 'OFF');

-- CreateEnum
CREATE TYPE "AcJobStatus" AS ENUM ('PENDING', 'RUNNING', 'DONE', 'SKIPPED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AcEventLevel" AS ENUM ('INFO', 'WARN', 'ERROR');

-- CreateTable
CREATE TABLE "ac_units" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "itmIp" TEXT NOT NULL,
    "floorName" TEXT NOT NULL,
    "unitIndex" INTEGER NOT NULL,
    "roomCodes" TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "isRunning" BOOLEAN,
    "stateAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ac_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ac_schedules" (
    "id" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "status" "AcScheduleStatus" NOT NULL DEFAULT 'ACTIVE',
    "fileName" TEXT NOT NULL,
    "summary" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdByEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "ac_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ac_jobs" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "action" "AcAction" NOT NULL,
    "runAt" TIMESTAMP(3) NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "roomCodes" TEXT[],
    "status" "AcJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "result" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ac_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ac_events" (
    "id" TEXT NOT NULL,
    "level" "AcEventLevel" NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "unitName" TEXT,
    "jobId" TEXT,
    "actor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ac_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ac_agents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3),
    "lastIp" TEXT,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ac_agents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ac_units_itmIp_floorName_unitIndex_key" ON "ac_units"("itmIp", "floorName", "unitIndex");

-- CreateIndex
CREATE INDEX "ac_schedules_dateKey_status_idx" ON "ac_schedules"("dateKey", "status");

-- CreateIndex
CREATE INDEX "ac_jobs_scheduleId_idx" ON "ac_jobs"("scheduleId");

-- CreateIndex
CREATE INDEX "ac_jobs_status_runAt_idx" ON "ac_jobs"("status", "runAt");

-- CreateIndex
CREATE INDEX "ac_events_createdAt_idx" ON "ac_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ac_agents_tokenHash_key" ON "ac_agents"("tokenHash");

-- AddForeignKey
ALTER TABLE "ac_jobs" ADD CONSTRAINT "ac_jobs_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ac_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ac_jobs" ADD CONSTRAINT "ac_jobs_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "ac_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Supabase: keep the AC tables away from the public anon key, let signed-in
-- users read the live state, and publish changes to Realtime. Prisma
-- connects as the table owner, so RLS does not affect the app itself.
ALTER TABLE "ac_units" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ac_schedules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ac_jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ac_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ac_agents" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE POLICY "ac_units_read" ON "ac_units" FOR SELECT TO authenticated USING (true);
    CREATE POLICY "ac_jobs_read" ON "ac_jobs" FOR SELECT TO authenticated USING (true);
    CREATE POLICY "ac_events_read" ON "ac_events" FOR SELECT TO authenticated USING (true);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "ac_units", "ac_jobs", "ac_events";
  END IF;
END
$$;
