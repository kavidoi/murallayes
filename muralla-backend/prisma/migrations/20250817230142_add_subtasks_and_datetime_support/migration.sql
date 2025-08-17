-- CreateEnum
CREATE TYPE "public"."ProjectKind" AS ENUM ('DEADLINE', 'CORE');

-- AlterTable
ALTER TABLE "public"."projects" ADD COLUMN     "deadline" TIMESTAMP(3),
ADD COLUMN     "kind" "public"."ProjectKind" NOT NULL DEFAULT 'DEADLINE';

-- AlterTable
ALTER TABLE "public"."tasks" ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "dueTime" TEXT,
ADD COLUMN     "orderIndex" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "parentTaskId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "public"."tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
