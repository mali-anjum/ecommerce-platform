-- CreateTable
CREATE TABLE "AiConversationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "query" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "convertedToOrder" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiConversationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiConversationLog_userId_createdAt_idx" ON "AiConversationLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AiConversationLog_intent_createdAt_idx" ON "AiConversationLog"("intent", "createdAt");

-- CreateIndex
CREATE INDEX "AiConversationLog_convertedToOrder_createdAt_idx" ON "AiConversationLog"("convertedToOrder", "createdAt");

-- CreateIndex
CREATE INDEX "AiConversationLog_createdAt_idx" ON "AiConversationLog"("createdAt");
