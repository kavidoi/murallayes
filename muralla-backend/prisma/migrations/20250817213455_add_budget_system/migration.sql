-- CreateEnum
CREATE TYPE "public"."BudgetStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'LOCKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."BudgetCategory" AS ENUM ('OPEX', 'CAPEX', 'REVENUE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."CommentType" AS ENUM ('BUDGET', 'BUDGET_LINE', 'TASK', 'PROJECT');

-- AlterTable
ALTER TABLE "public"."tasks" ADD COLUMN     "actualCost" DECIMAL(10,4),
ADD COLUMN     "budgetLineId" TEXT;

-- CreateTable
CREATE TABLE "public"."budgets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "projectId" TEXT NOT NULL,
    "status" "public"."BudgetStatus" NOT NULL DEFAULT 'DRAFT',
    "category" "public"."BudgetCategory" NOT NULL DEFAULT 'OPEX',
    "totalPlanned" DECIMAL(12,4) NOT NULL,
    "totalCommitted" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "totalActual" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'CLP',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "baseline" JSONB,
    "tenantId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."budget_lines" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "vendor" TEXT,
    "plannedAmount" DECIMAL(10,4) NOT NULL,
    "committedAmount" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "actualAmount" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL(10,4),
    "quantity" DECIMAL(10,4),
    "dueDate" TIMESTAMP(3),
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringFrequency" TEXT,
    "autoCreateTasks" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "public"."CommentType" NOT NULL,
    "budgetId" TEXT,
    "budgetLineId" TEXT,
    "taskId" TEXT,
    "authorId" TEXT NOT NULL,
    "mentions" TEXT[],
    "attachments" JSONB,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "tenantId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "public"."budget_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."budgets" ADD CONSTRAINT "budgets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."budget_lines" ADD CONSTRAINT "budget_lines_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "public"."budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "public"."budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "public"."budget_lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
