-- CreateTable
CREATE TABLE "public"."Contract" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "envelopeId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contract_customerId_key" ON "public"."Contract"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_envelopeId_key" ON "public"."Contract"("envelopeId");

-- CreateIndex
CREATE INDEX "Contract_customerId_idx" ON "public"."Contract"("customerId");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "public"."Contract"("status");

-- AddForeignKey
ALTER TABLE "public"."Contract" ADD CONSTRAINT "Contract_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
