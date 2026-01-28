/*
  Warnings:

  - You are about to drop the column `clientKey` on the `SupportMessage` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `SupportMessage` table. All the data in the column will be lost.
  - You are about to drop the column `threadId` on the `SupportMessage` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."SupportMessage_threadId_createdAt_idx";

-- AlterTable
ALTER TABLE "public"."SupportMessage" DROP COLUMN "clientKey",
DROP COLUMN "role",
DROP COLUMN "threadId";

-- DropEnum
DROP TYPE "public"."SupportRole";
