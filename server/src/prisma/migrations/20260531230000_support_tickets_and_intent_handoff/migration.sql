-- AlterTable
ALTER TABLE "AiChatSession" ADD COLUMN "failureCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AiChatSession" ADD COLUMN "openTicketId" TEXT;

-- CreateIndex
CREATE INDEX "AiChatSession_openTicketId_idx" ON "AiChatSession"("openTicketId");

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "messages" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupportTicket_userId_status_idx" ON "SupportTicket"("userId", "status");

-- CreateIndex
CREATE INDEX "SupportTicket_sessionId_status_idx" ON "SupportTicket"("sessionId", "status");

-- CreateIndex
CREATE INDEX "SupportTicket_status_updatedAt_idx" ON "SupportTicket"("status", "updatedAt");
