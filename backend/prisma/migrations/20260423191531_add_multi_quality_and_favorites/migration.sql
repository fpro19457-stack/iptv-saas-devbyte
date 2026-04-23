-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "defaultQuality" "Quality" NOT NULL DEFAULT 'HD',
ADD COLUMN     "streamUrlFHD" TEXT,
ADD COLUMN     "streamUrlHD" TEXT,
ADD COLUMN     "streamUrlSD" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastChannelId" TEXT,
ADD COLUMN     "lastCinemaMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastUpdated" TIMESTAMP(3),
ADD COLUMN     "lastVolume" INTEGER NOT NULL DEFAULT 100;

-- CreateTable
CREATE TABLE "UserFavorite" (
    "userId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFavorite_pkey" PRIMARY KEY ("userId","channelId")
);

-- AddForeignKey
ALTER TABLE "UserFavorite" ADD CONSTRAINT "UserFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFavorite" ADD CONSTRAINT "UserFavorite_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
