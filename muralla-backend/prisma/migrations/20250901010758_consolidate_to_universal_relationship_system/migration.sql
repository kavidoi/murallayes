/*
  Warnings:

  - You are about to drop the column `projectId` on the `budgets` table. All the data in the column will be lost.
  - You are about to drop the column `vendorId` on the `costs` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `work_orders` table. All the data in the column will be lost.
  - You are about to drop the `task_assignees` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."budgets" DROP CONSTRAINT "budgets_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."costs" DROP CONSTRAINT "costs_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."products" DROP CONSTRAINT "products_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."task_assignees" DROP CONSTRAINT "task_assignees_taskId_fkey";

-- DropForeignKey
ALTER TABLE "public"."task_assignees" DROP CONSTRAINT "task_assignees_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."work_orders" DROP CONSTRAINT "work_orders_productId_fkey";

-- DropIndex
DROP INDEX "public"."costs_vendorId_idx";

-- DropIndex
DROP INDEX "public"."work_orders_productId_idx";

-- AlterTable
ALTER TABLE "public"."budgets" DROP COLUMN "projectId";

-- AlterTable
ALTER TABLE "public"."costs" DROP COLUMN "vendorId";

-- AlterTable
ALTER TABLE "public"."products" DROP COLUMN "categoryId";

-- AlterTable
ALTER TABLE "public"."work_orders" DROP COLUMN "productId";

-- DropTable
DROP TABLE "public"."task_assignees";
