-- AlterTable
ALTER TABLE "advantage"."Contract" ADD COLUMN  IF NOT EXISTS  "comments" TEXT;

-- AlterTable
ALTER TABLE "advantage"."Customer" ADD COLUMN  IF NOT EXISTS  "comments" TEXT;
