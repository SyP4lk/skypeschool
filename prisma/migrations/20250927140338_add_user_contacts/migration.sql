/*
  Warnings:

  - You are about to drop the `PopularLesson` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."TxType" AS ENUM ('deposit', 'lesson_charge', 'lesson_income', 'withdraw_request', 'withdraw_paid', 'admin_adjustment');

-- CreateEnum
CREATE TYPE "public"."WithdrawStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "public"."InboxStatus" AS ENUM ('new', 'processed');

-- AlterTable
ALTER TABLE "public"."BalanceChange" ADD COLUMN     "meta" JSONB,
ADD COLUMN     "type" "public"."TxType";

-- AlterTable
ALTER TABLE "public"."Lesson" ADD COLUMN     "price" INTEGER,
ADD COLUMN     "publicPriceAtCharge" INTEGER;

-- AlterTable
ALTER TABLE "public"."StudentProfile" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "contactDiscord" TEXT,
ADD COLUMN     "contactGoogle" TEXT,
ADD COLUMN     "contactMax" TEXT,
ADD COLUMN     "contactSkype" TEXT,
ADD COLUMN     "contactVk" TEXT,
ADD COLUMN     "contactWhatsapp" TEXT;

-- AlterTable
ALTER TABLE "public"."TeacherProfile" ADD COLUMN     "contactDiscord" TEXT,
ADD COLUMN     "contactMax" TEXT,
ADD COLUMN     "contactTeams" TEXT,
ADD COLUMN     "contactTelegram" TEXT,
ADD COLUMN     "contactVk" TEXT,
ADD COLUMN     "contactWhatsapp" TEXT,
ADD COLUMN     "contactZoom" TEXT;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT;

-- DropTable
DROP TABLE "public"."PopularLesson";

-- CreateTable
CREATE TABLE "public"."TrialRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "subjectId" TEXT,
    "message" TEXT,
    "status" "public"."InboxStatus" NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrialRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SupportMessage" (
    "id" TEXT NOT NULL,
    "fromLogin" TEXT,
    "contact" TEXT,
    "message" TEXT NOT NULL,
    "status" "public"."InboxStatus" NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Withdrawal" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "notes" TEXT,
    "status" "public"."WithdrawStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Withdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "public"."Pricing" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherPrice" INTEGER NOT NULL,
    "publicPrice" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrialRequest_status_createdAt_idx" ON "public"."TrialRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SupportMessage_status_createdAt_idx" ON "public"."SupportMessage"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Withdrawal_status_createdAt_idx" ON "public"."Withdrawal"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Pricing_teacherId_subjectId_key" ON "public"."Pricing"("teacherId", "subjectId");

-- CreateIndex
CREATE INDEX "BalanceChange_type_idx" ON "public"."BalanceChange"("type");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "public"."User"("phone");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role");

-- AddForeignKey
ALTER TABLE "public"."TrialRequest" ADD CONSTRAINT "TrialRequest_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Withdrawal" ADD CONSTRAINT "Withdrawal_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
