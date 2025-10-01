-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "advantage";

-- CreateEnum
CREATE TYPE "advantage"."UserRole" AS ENUM ('ADMIN', 'CUSTOMER', 'OPERATOR');

-- CreateEnum
CREATE TYPE "advantage"."AddressType" AS ENUM ('HOME', 'BILLING', 'SHIPPING', 'OTHER');

-- CreateEnum
CREATE TYPE "advantage"."Relationship" AS ENUM ('SPOUSE', 'CHILD', 'PARTNER', 'PARENT', 'OTHER');

-- CreateEnum
CREATE TYPE "advantage"."DocumentKind" AS ENUM ('CPF', 'RG', 'CNH', 'PROOF_OF_ADDRESS', 'MARRIAGE_CERTIFICATE', 'OTHER');

-- CreateTable
CREATE TABLE "advantage"."Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advantage"."Address" (
    "customerId" TEXT NOT NULL,
    "type" "advantage"."AddressType" NOT NULL DEFAULT 'HOME',
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "district" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipcode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'BR',
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("customerId")
);

-- CreateTable
CREATE TABLE "advantage"."Dependent" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cpf" TEXT,
    "birthDate" TIMESTAMP(3),
    "eligible" BOOLEAN NOT NULL DEFAULT false,
    "relationship" "advantage"."Relationship" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "Dependent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advantage"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "advantage"."UserRole" NOT NULL,
    "customerId" TEXT,
    "subscriptionId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advantage"."Document" (
    "id" TEXT NOT NULL,
    "kind" "advantage"."DocumentKind" NOT NULL,
    "description" TEXT,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "checksum" TEXT,
    "isApproved" BOOLEAN,
    "uploadedById" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "customerId" TEXT,
    "dependentId" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advantage"."Contract" (
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
CREATE UNIQUE INDEX "Customer_cpf_key" ON "advantage"."Customer"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "advantage"."Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "advantage"."Customer"("name");

-- CreateIndex
CREATE INDEX "Customer_cpf_idx" ON "advantage"."Customer"("cpf");

-- CreateIndex
CREATE INDEX "Address_zipcode_idx" ON "advantage"."Address"("zipcode");

-- CreateIndex
CREATE INDEX "Address_city_state_idx" ON "advantage"."Address"("city", "state");

-- CreateIndex
CREATE UNIQUE INDEX "Dependent_cpf_key" ON "advantage"."Dependent"("cpf");

-- CreateIndex
CREATE INDEX "Dependent_customerId_idx" ON "advantage"."Dependent"("customerId");

-- CreateIndex
CREATE INDEX "Dependent_relationship_idx" ON "advantage"."Dependent"("relationship");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "advantage"."User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "advantage"."User"("role");

-- CreateIndex
CREATE INDEX "User_customerId_idx" ON "advantage"."User"("customerId");

-- CreateIndex
CREATE INDEX "Document_customerId_idx" ON "advantage"."Document"("customerId");

-- CreateIndex
CREATE INDEX "Document_dependentId_idx" ON "advantage"."Document"("dependentId");

-- CreateIndex
CREATE INDEX "Document_kind_idx" ON "advantage"."Document"("kind");

-- CreateIndex
CREATE INDEX "Document_uploadedAt_idx" ON "advantage"."Document"("uploadedAt");

-- CreateIndex
CREATE INDEX "Document_isApproved_idx" ON "advantage"."Document"("isApproved");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_customerId_key" ON "advantage"."Contract"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_envelopeId_key" ON "advantage"."Contract"("envelopeId");

-- CreateIndex
CREATE INDEX "Contract_customerId_idx" ON "advantage"."Contract"("customerId");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "advantage"."Contract"("status");

-- AddForeignKey
ALTER TABLE "advantage"."Address" ADD CONSTRAINT "Address_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "advantage"."Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advantage"."Dependent" ADD CONSTRAINT "Dependent_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "advantage"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advantage"."User" ADD CONSTRAINT "User_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "advantage"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advantage"."Document" ADD CONSTRAINT "Document_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "advantage"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advantage"."Document" ADD CONSTRAINT "Document_dependentId_fkey" FOREIGN KEY ("dependentId") REFERENCES "advantage"."Dependent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advantage"."Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "advantage"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advantage"."Contract" ADD CONSTRAINT "Contract_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "advantage"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
