-- AlterTable
ALTER TABLE "public"."Document" ADD COLUMN     "isApproved" BOOLEAN;

-- CreateIndex
CREATE INDEX "Document_isApproved_idx" ON "public"."Document"("isApproved");
