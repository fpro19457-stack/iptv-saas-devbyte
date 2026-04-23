-- CreateEnum
CREATE TYPE "CheckStatus" AS ENUM ('UP', 'DOWN', 'TIMEOUT');

-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "failCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isDown" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastCheck" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "MonitorConfig" (
    "id" TEXT NOT NULL,
    "intervalMinutes" INTEGER NOT NULL DEFAULT 5,
    "failThreshold" INTEGER NOT NULL DEFAULT 3,
    "emailAlerts" TEXT[],
    "telegramToken" TEXT,
    "telegramChatId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonitorConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelCheck" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "status" "CheckStatus" NOT NULL,
    "responseCode" INTEGER,
    "responseTimeMs" INTEGER,
    "errorMessage" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChannelCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelIncident" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "notified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ChannelIncident_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ChannelCheck" ADD CONSTRAINT "ChannelCheck_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelIncident" ADD CONSTRAINT "ChannelIncident_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
