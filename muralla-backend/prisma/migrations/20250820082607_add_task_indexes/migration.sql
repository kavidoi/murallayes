-- CreateIndex
CREATE INDEX "tasks_projectId_idx" ON "public"."tasks"("projectId");

-- CreateIndex
CREATE INDEX "tasks_assigneeId_idx" ON "public"."tasks"("assigneeId");

-- CreateIndex
CREATE INDEX "tasks_parentTaskId_idx" ON "public"."tasks"("parentTaskId");

-- CreateIndex
CREATE INDEX "tasks_orderIndex_idx" ON "public"."tasks"("orderIndex");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "public"."tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_dueDate_idx" ON "public"."tasks"("dueDate");
