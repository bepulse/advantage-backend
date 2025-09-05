/*
  Warnings:

  - The primary key for the `Address` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Address` table. All the data in the column will be lost.
  - Made the column `number` on table `Address` required. This step will fail if there are existing NULL values in that column.
  - Made the column `district` on table `Address` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cpf` on table `Customer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `Customer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone` on table `Customer` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Address" DROP CONSTRAINT "Address_customerId_fkey";

-- DropIndex
DROP INDEX "public"."Address_customerId_isDefault_idx";

-- AlterTable
ALTER TABLE "public"."Address" DROP CONSTRAINT "Address_pkey",
DROP COLUMN "id",
ALTER COLUMN "number" SET NOT NULL,
ALTER COLUMN "district" SET NOT NULL,
ALTER COLUMN "isDefault" SET DEFAULT true,
ADD CONSTRAINT "Address_pkey" PRIMARY KEY ("customerId");

-- AlterTable
ALTER TABLE "public"."Customer" ALTER COLUMN "cpf" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "phone" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Address" ADD CONSTRAINT "Address_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
