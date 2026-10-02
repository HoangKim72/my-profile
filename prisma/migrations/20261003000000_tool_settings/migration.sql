-- CreateTable
CREATE TABLE "tool_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tool_settings_pkey" PRIMARY KEY ("key")
);

