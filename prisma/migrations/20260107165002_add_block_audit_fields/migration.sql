-- AlterTable
ALTER TABLE "advantage"."Customer" ADD COLUMN     "blockedAt" TIMESTAMP(3),
ADD COLUMN     "blockedBy" TEXT;
