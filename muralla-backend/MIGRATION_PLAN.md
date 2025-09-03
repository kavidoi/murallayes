# Universal Relationship System Migration Plan

## Objective
Consolidate all existing relationship systems into the Universal EntityRelationship system to eliminate duplication and create a single, powerful relationship engine.

## Migration Strategy: Progressive Replacement

### Phase 1: Remove Redundant Tables & FKs
1. **TaskAssignee table** → EntityRelationship
2. **Product.categoryId FK** → EntityRelationship  
3. **Budget.projectId FK** → EntityRelationship
4. **Cost.vendorId FK** → EntityRelationship
5. **WorkOrder.productId FK** → EntityRelationship

### Phase 2: Update All Services
- TasksService: Use EntityRelationshipService for assignments
- ProductsService: Use EntityRelationshipService for categories
- BudgetsService: Use EntityRelationshipService for projects
- CostsService: Use EntityRelationshipService for vendors
- WorkOrdersService: Use EntityRelationshipService for products

### Phase 3: Create Relationship Types
```sql
-- Standard relationship types
INSERT INTO relationship_types VALUES
('assigned_to', 'Assigned To', ['Task'], ['User'], true, 'assigns'),
('belongs_to_category', 'Belongs To Category', ['Product'], ['ProductCategory'], false, null),
('budgets_for', 'Budgets For', ['Budget'], ['Project'], true, 'funded_by'),
('supplied_by', 'Supplied By', ['Product'], ['Contact'], true, 'supplies'),
('manufactures', 'Manufactures', ['WorkOrder'], ['Product'], false, null);
```

### Phase 4: Data Migration Script
```typescript
// Migrate existing relationships to new system
async function migrateRelationships() {
  // TaskAssignee → EntityRelationship
  const taskAssignees = await prisma.taskAssignee.findMany();
  for (const assignment of taskAssignees) {
    await prisma.entityRelationship.create({
      data: {
        relationshipType: 'assigned_to',
        sourceType: 'Task',
        sourceId: assignment.taskId,
        targetType: 'User', 
        targetId: assignment.userId,
        strength: 5,
        metadata: { role: assignment.role, migratedFrom: 'TaskAssignee' }
      }
    });
  }
  
  // Product.categoryId → EntityRelationship
  const products = await prisma.product.findMany({ where: { categoryId: { not: null }}});
  // ... migrate each relationship type
}
```

## Benefits of Consolidation
1. **Single Source of Truth**: All relationships in one place
2. **Rich Metadata**: Strength, tags, priority for every relationship
3. **Bidirectional**: Automatic reverse relationships
4. **Analytics Ready**: Built-in relationship intelligence
5. **@ Mention Integration**: Organic relationship creation
6. **Simpler Codebase**: One relationship API instead of many

## Breaking Changes
- Services will need to use EntityRelationshipService instead of direct FKs
- Some queries will change from simple JOINs to relationship lookups
- Migration required for existing data

## Timeline
- **Phase 1-2**: Schema changes and service updates (2-3 hours)  
- **Phase 3-4**: Data migration and testing (1-2 hours)
- **Total**: ~4-5 hours for complete consolidation