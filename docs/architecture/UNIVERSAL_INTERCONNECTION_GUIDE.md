# 🔗 Universal Interconnection & SKU System - Complete Implementation Guide

## 📋 **Project Overview**

Transform Muralla from isolated modules into a truly interconnected business management platform where any entity can link to any other entity, with intelligent SKU generation, @ mention linking, and relationship-driven business intelligence.

**Vision**: Create a system where linking a product with a distributor automatically links the distributor with the product, staff can be easily connected to products/contacts/shifts/budgets/tasks, and everything is interconnected based on actual business relationships.

---

## 🎯 **Core Features**

### **1. Universal Entity Relationship System**
- **Any-to-Any Linking**: Any entity can link to any other entity with rich metadata
- **@ Mention System**: Organic relationship creation by typing "@" and selecting entities
- **Relationship Intelligence**: Auto-suggest and auto-detect relationships from business patterns
- **Bidirectional Links**: When A links to B, B automatically knows about A
- **Relationship Metadata**: Store context, strength, validity periods, business rules
- **Relationship History**: Track when relationships were created, modified, ended

### **2. Universal SKU Generation System**
- **Entity-Agnostic**: Any entity (Product, WorkOrder, Contact, Task, Shift, etc.) can have SKUs
- **Template-Based**: Customizable SKU templates with placeholders
- **Relationship-Driven**: SKUs can dynamically pull data from entity relationships
- **Manual Override**: Users can edit any part of generated SKUs
- **Integration**: Seamlessly works with existing Product SKU system
- **Versioning**: Track SKU changes and history

### **3. Smart Business Intelligence**
- **Pattern Recognition**: Auto-detect relationships from existing data patterns
- **Relationship Analytics**: Measure relationship strength, frequency, impact
- **Predictive Insights**: Suggest optimal relationships based on historical data
- **Performance Tracking**: Monitor relationship effectiveness over time
- **Anomaly Detection**: Identify unusual relationship patterns

### **4. Relationship-Centric Dashboards**
- **Project Hub**: See all entities connected to projects in one view
- **Budget Intelligence**: Understand financial flows through relationships
- **Visual Mapping**: Graph views of entity connections and networks
- **Quick Actions**: Easy relationship creation and management

---

## 🏗️ **Database Architecture**

### **Core Models to Implement**

#### **1. EntityRelationship Model** 
The heart of the interconnection system - enables any entity to link to any other entity.

```sql
model EntityRelationship {
  id              String   @id @default(cuid())
  relationshipType String  // "supplier", "assigned_to", "mentioned_in", "team_member", etc.
  
  // Polymorphic source entity (what entity is creating the relationship)
  sourceType      String   // "Product", "Contact", "User", "WorkOrder", "Task", "Project", etc.
  sourceId        String   // The ID of the source entity
  
  // Polymorphic target entity (what entity is being linked to)
  targetType      String   // "Contact", "Product", "User", "Project", "Budget", etc.
  targetId        String   // The ID of the target entity
  
  // Rich metadata for different relationship types - stored as flexible JSON
  metadata        Json? {
    // === For supplier relationships ===
    leadTime?: number              // Days to deliver
    minimumOrder?: number          // Minimum order quantity
    qualityRating?: number         // 1-5 stars rating
    paymentTerms?: string          // "NET30", "COD", "NET15"
    reliability?: number           // % on-time delivery (0-100)
    territoryExclusive?: boolean   // Exclusive supplier for territory
    certifications?: string[]      // ["organic", "fair_trade", "iso9001"]
    contactPerson?: string         // Primary contact name
    
    // === For production relationships ===
    allocatedHours?: number        // Hours allocated to this relationship
    priority?: "low" | "medium" | "high" | "urgent"
    skillRequirements?: string[]   // Required skills: ["pastry", "coffee_roasting"]
    equipmentNeeded?: string[]     // Required equipment: ["oven_1", "mixer_large"]
    estimatedOutput?: number       // Expected production quantity
    actualOutput?: number          // Actual production achieved
    efficiency?: number            // Actual vs estimated ratio
    
    // === For budget relationships ===
    allocatedAmount?: number       // Budget amount allocated
    spentAmount?: number           // Amount already spent
    remainingAmount?: number       // Remaining budget
    purpose?: "marketing" | "development" | "production" | "inventory"
    expectedROI?: number           // Expected return on investment
    actualROI?: number             // Actual ROI achieved
    quarter?: string               // "Q1-2024", "Q2-2024"
    campaignType?: string          // "digital", "print", "events", "social"
    
    // === For mention relationships ===
    context?: "task_description" | "comment" | "note" | "document"
    mentionText?: string           // The original text that was mentioned
    documentSection?: string       // Which part of document mentioned it
    
    // === For assignment relationships ===
    role?: string                  // "project_manager", "developer", "reviewer"
    permissions?: string[]         // ["budget_view", "edit_tasks", "approve_orders"]
    hoursPerWeek?: number          // Time commitment
    startDate?: string             // When assignment starts
    endDate?: string               // When assignment ends
    
    // === For expertise relationships ===
    expertiseLevel?: "beginner" | "intermediate" | "advanced" | "expert"
    certificationDate?: string     // When expertise was certified
    trainingRequired?: boolean     // Does this relationship require training?
    
    // === Universal metadata ===
    autoAssigned?: boolean         // Was this relationship auto-created?
    confidence?: "high" | "medium" | "low" // System confidence in relationship
    createdVia?: "mention" | "manual" | "auto_detected" | "import"
    notes?: string                 // Free-form notes about the relationship
    tags?: string[]                // Searchable tags
    businessImpact?: "critical" | "important" | "helpful" | "nice_to_have"
  }
  
  // Relationship properties
  strength        Int      @default(1) // 1-5 relationship strength (auto-calculated)
  isActive        Boolean  @default(true)  // Can be deactivated without deletion
  isBidirectional Boolean  @default(false) // Should reverse relationship be auto-created?
  
  // Temporal properties
  validFrom       DateTime? // When relationship becomes valid
  validUntil      DateTime? // When relationship expires
  
  // Standard audit fields
  tenantId        String?   // Multi-tenancy support
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  createdBy       String?   // Who created this relationship
  lastModifiedBy  String?   // Who last modified it
  
  // Performance indexes
  @@unique([sourceType, sourceId, targetType, targetId, relationshipType])
  @@index([sourceType, sourceId])    // Find all relationships from an entity
  @@index([targetType, targetId])    // Find all relationships to an entity
  @@index([relationshipType])        // Find all relationships of specific type
  @@index([strength])                // Query by relationship strength
  @@index([isActive])                // Filter active relationships
  @@index([validFrom, validUntil])   // Temporal queries
  
  @@map("entity_relationships")
}
```

#### **2. RelationshipType Model**
Defines and validates the types of relationships that can exist between entities.

```sql
model RelationshipType {
  id            String   @id @default(cuid())
  name          String   @unique // Technical name: "preferred_supplier", "team_member"
  displayName   String   // Human-friendly name: "Preferred Supplier", "Team Member"
  description   String?  // Detailed explanation of what this relationship means
  
  // Entity compatibility - which entity types can participate
  sourceTypes   String[] // ["Product", "Contact"] - what can be the source
  targetTypes   String[] // ["Contact", "User"] - what can be the target
  
  // Relationship behavior properties
  isSymmetric   Boolean  @default(false) // If A->B implies B->A automatically
  allowMultiple Boolean  @default(true)  // Can multiple relationships of this type exist?
  isSystem      Boolean  @default(false) // System-managed vs user-created
  isRequired    Boolean  @default(false) // Is this relationship mandatory?
  
  // Metadata schema definition (JSON Schema for validation)
  metadataSchema Json? {
    // Example schema for supplier relationships:
    // {
    //   "type": "object",
    //   "properties": {
    //     "leadTime": {"type": "number", "minimum": 1, "maximum": 365},
    //     "qualityRating": {"type": "number", "minimum": 1, "maximum": 5},
    //     "paymentTerms": {"type": "string", "enum": ["NET30", "NET15", "COD"]}
    //   },
    //   "required": ["leadTime"]
    // }
  }
  
  // UI/UX Configuration
  icon          String?  // Icon class for UI display: "supplier", "user", "product"
  color         String?  // Hex color for visual representation: "#3B82F6"
  category      String?  // Grouping category: "business", "operational", "social"
  
  // Business rules
  autoCreationRules Json? // Rules for when to auto-create this relationship type
  validationRules   Json? // Additional validation beyond metadata schema
  
  // Standard fields
  tenantId      String?  // Multi-tenancy support
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdBy     String?
  
  @@index([isActive])
  @@index([category])
  @@index([isSystem])
  @@map("relationship_types")
}
```

#### **3. EntitySKU Model**
Enables any entity to have customizable, relationship-driven SKUs.

```sql
model EntitySKU {
  id            String   @id @default(cuid())
  
  // Entity identification
  entityType    String   // "Product", "WorkOrder", "Contact", "Task", "Shift", etc.
  entityId      String   // The ID of the entity this SKU belongs to
  sku           String   @unique // The actual SKU string
  
  // SKU Generation Configuration
  templateId    String?  // Reference to SKUTemplate used
  template      String   // Template string with placeholders: "{format}-{brand}-{date}"
  
  // Component values used to generate this SKU
  components    Json {
    // Example for product SKU:
    // {
    //   "format": "100",           // Static value
    //   "brand": "SMT",            // From relationship to Contact
    //   "category": "CAF",         // From entity field
    //   "date": "241215",          // Generated date
    //   "extras": "56"             // Calculated from array
    // }
  }
  
  // Generation metadata
  generationRules Json? {
    // Rules used to generate components:
    // {
    //   "format": {"type": "static", "options": ["100", "200", "300"]},
    //   "brand": {"type": "relationship", "targetType": "Contact", "field": "skuAbbreviation"},
    //   "category": {"type": "field", "path": "category.code"},
    //   "date": {"type": "date", "format": "YYMMDD"},
    //   "extras": {"type": "calculated", "calculation": "extras_codes"}
    // }
  }
  
  // Editing and versioning
  isEditable      Boolean  @default(true)   // Can users manually edit this SKU?
  isAutoGenerated Boolean  @default(false)  // Was this auto-generated?
  originalSKU     String?  // Original generated SKU before manual edits
  
  // History tracking
  generatedAt   DateTime @default(now())
  lastEditedAt  DateTime? // When manually edited
  lastEditedBy  String?   // Who made the edit
  version       Int      @default(1) // Version number for changes
  
  // Regeneration tracking
  lastRegeneratedAt DateTime? // When SKU was last regenerated
  regenerationTrigger String? // What triggered regeneration: "relationship_change", "manual"
  
  tenantId      String?
  
  @@unique([entityType, entityId]) // One SKU per entity
  @@index([entityType])           // Query SKUs by entity type
  @@index([sku])                 // Fast SKU lookups
  @@index([templateId])          // Group by template
  @@index([isAutoGenerated])     // Filter by generation type
  @@map("entity_skus")
}
```

#### **4. SKUTemplate Model**
Defines reusable templates for generating SKUs for different entity types.

```sql
model SKUTemplate {
  id                  String   @id @default(cuid())
  name                String   // "Product Standard", "Work Order", "Contact Supplier"
  entityType          String   // Which entity this template applies to
  template            String   // Template with placeholders: "{format}-{supplier}-{date}"
  description         String?  // What this template is for
  
  // Component definitions - how to resolve each placeholder
  availableComponents Json {
    // Static options:
    // "format": ["100", "200", "300"]
    
    // Entity field references:
    // "name": {"type": "field", "path": "name"}
    // "categoryCode": {"type": "field", "path": "category.code"}
    
    // Relationship data:
    // "supplier": {"type": "relationship", "targetType": "Contact", "field": "skuAbbreviation"}
    // "assignee": {"type": "relationship", "targetType": "User", "field": "initials"}
    
    // Date formatting:
    // "date": {"type": "date", "format": "YYMMDD"}
    // "timestamp": {"type": "date", "format": "YYMMDDHHmm"}
    
    // Calculated values:
    // "extras": {"type": "calculated", "calculation": "extras_codes"}
    // "sequence": {"type": "calculated", "calculation": "entity_sequence"}
    
    // Conditional logic:
    // "prefix": {"type": "conditional", "conditions": [
    //   {"if": {"field": "type", "equals": "TERMINADO"}, "then": "MFG"},
    //   {"if": {"field": "type", "equals": "INSUMO"}, "then": "PUR"},
    //   {"default": "GEN"}
    // ]}
  }
  
  // Template configuration
  isDefault           Boolean  @default(false) // Default template for this entity type
  isSystem            Boolean  @default(false) // System template vs user-created
  allowCustomization  Boolean  @default(true)  // Can users modify this template?
  
  // Validation rules
  validationRules     Json? {
    // Example rules:
    // {
    //   "maxLength": 20,
    //   "allowedCharacters": "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-",
    //   "requiredComponents": ["format", "date"],
    //   "uniqueComponents": ["sequence"]
    // }
  }
  
  // Usage statistics
  usageCount         Int      @default(0) // How many times this template was used
  lastUsedAt         DateTime? // When last used
  
  // Examples and documentation
  exampleSKUs        String[] // Example SKUs generated by this template
  usageNotes         String?  // How and when to use this template
  
  tenantId           String?
  isActive           Boolean  @default(true)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  createdBy          String?
  
  @@unique([entityType, name, tenantId]) // Unique template names per entity type
  @@index([entityType])                  // Query templates by entity
  @@index([isDefault])                   // Find default templates
  @@index([isActive])                    // Filter active templates
  @@map("sku_templates")
}
```

---

## 🎯 **Priority Relationship Types & Use Cases**

### **P1 - Critical Business Relationships**

#### **1. Contacts ↔ Products (Supplier Intelligence)**
**Business Problem**: Currently, we don't systematically track which suppliers provide which products, their performance, pricing, or reliability.

**Relationship Types**:
- `"preferred_supplier"` - Primary supplier for a product
- `"backup_supplier"` - Secondary/backup supplier option  
- `"exclusive_supplier"` - Only supplier for specific products
- `"seasonal_supplier"` - Supplier available only certain times
- `"trial_supplier"` - New supplier being evaluated

**Use Cases**:
- **Smart Purchasing**: Automatically suggest best supplier for each product based on price, quality, delivery time
- **Supplier Scorecards**: Track performance metrics across all products
- **Risk Management**: Identify products with only one supplier (single points of failure)
- **Cost Optimization**: Compare supplier pricing across products
- **Quality Tracking**: Monitor which suppliers deliver best quality for each product
- **Relationship Management**: See complete supplier-product portfolio

**Metadata Schema**:
```json
{
  "leadTime": "number",              // Days from order to delivery
  "minimumOrder": "number",          // Minimum order quantity
  "qualityRating": "number",         // 1-5 stars based on received quality
  "lastOrderDate": "string",         // ISO date of last purchase
  "avgUnitCost": "number",          // Average cost per unit
  "reliability": "number",           // % of orders delivered on time
  "paymentTerms": "string",          // "NET30", "NET15", "COD", "Prepaid"
  "territoryExclusive": "boolean",   // Exclusive supplier for region
  "certifications": "array",         // ["organic", "fair_trade", "iso9001"]
  "contactPerson": "string",         // Primary contact name
  "preferredOrderDays": "array",     // ["monday", "wednesday"] - best days to order
  "shippingCost": "number",         // Additional shipping cost
  "bulkDiscounts": "object",         // Volume discount tiers
  "seasonalAvailability": "string"   // "year_round", "summer_only", etc.
}
```

**Auto-Detection Logic**:
```typescript
// Analyze purchase history to identify supplier relationships
async function detectSupplierRelationships() {
  // Look at last 12 months of purchase data
  const purchaseHistory = await prisma.costLine.groupBy({
    by: ['productId', 'cost.vendorId'],
    _avg: { unitCost: true },
    _count: { id: true },
    _sum: { totalCost: true },
    where: { 
      createdAt: { gte: twelveMonthsAgo },
      isInventory: true 
    }
  });
  
  for (const purchase of purchaseHistory) {
    if (purchase._count.id >= 3) { // 3+ orders = established relationship
      const reliability = await calculateOnTimeDeliveryRate(purchase.vendorId, purchase.productId);
      const avgLeadTime = await calculateAverageLeadTime(purchase.vendorId, purchase.productId);
      
      // Determine relationship type based on purchase frequency and volume
      let relationshipType = "preferred_supplier";
      if (purchase._count.id >= 10 && purchase._sum.totalCost > 100000) {
        relationshipType = "preferred_supplier";
      } else if (purchase._count.id >= 2) {
        relationshipType = "backup_supplier";
      }
      
      await createRelationship({
        sourceType: "Contact", sourceId: purchase.vendorId,
        targetType: "Product", targetId: purchase.productId,
        relationshipType,
        metadata: {
          avgUnitCost: purchase._avg.unitCost,
          orderFrequency: purchase._count.id,
          totalSpent: purchase._sum.totalCost,
          reliability,
          leadTime: avgLeadTime,
          autoDetected: true,
          detectionDate: new Date().toISOString()
        }
      });
    }
  }
}
```

#### **2. Shifts ↔ Production Orders (Smart Scheduling)**
**Business Problem**: Production planning is manual and doesn't optimize staff skills, shift capacity, or equipment availability.

**Relationship Types**:
- `"planned_production"` - Production scheduled for this shift
- `"in_progress_production"` - Production currently happening
- `"completed_production"` - Production finished in this shift
- `"paused_production"` - Production paused/delayed
- `"emergency_production"` - Urgent/rush production

**Use Cases**:
- **Capacity Planning**: See total production capacity vs demand
- **Skill Matching**: Assign complex products to skilled staff shifts
- **Equipment Scheduling**: Avoid equipment conflicts across shifts
- **Efficiency Tracking**: Monitor production efficiency by shift
- **Bottleneck Identification**: Find production constraints
- **Resource Optimization**: Balance workload across shifts

**Metadata Schema**:
```json
{
  "allocatedHours": "number",        // Hours assigned to this production
  "estimatedOutput": "number",       // Expected quantity to produce
  "actualOutput": "number",          // Actual quantity produced
  "efficiency": "number",            // Actual vs estimated ratio (%)
  "skillsRequired": "array",         // ["pastry", "coffee_roasting", "packaging"]
  "equipmentNeeded": "array",        // ["oven_1", "mixer_large", "packaging_station"]
  "priority": "enum",                // "low", "medium", "high", "urgent"
  "complexity": "enum",              // "simple", "moderate", "complex", "expert_only"
  "qualityScore": "number",          // 1-5 quality rating of output
  "setupTime": "number",             // Minutes needed for setup
  "cleanupTime": "number",           // Minutes needed for cleanup
  "batchSize": "number",             // Optimal batch size for efficiency
  "temperatureRequired": "number",   // If temperature-sensitive production
  "specialInstructions": "string"   // Special notes for this production
}
```

**Smart Scheduling Algorithm**:
```typescript
async function optimizeShiftProduction() {
  const upcomingShifts = await getShiftsNext7Days();
  const pendingOrders = await getPendingWorkOrders();
  const staffSkills = await getStaffSkillMatrix();
  const equipmentSchedule = await getEquipmentAvailability();
  
  // Multi-constraint optimization algorithm
  const assignments = [];
  
  for (const shift of upcomingShifts) {
    const availableHours = shift.duration - shift.breakTime;
    const staffCapabilities = staffSkills[shift.userId];
    
    // Find best matching work orders for this shift
    const compatibleOrders = pendingOrders.filter(order => {
      const requiredSkills = getRequiredSkills(order.productId);
      const hasRequiredSkills = requiredSkills.every(skill => 
        staffCapabilities.includes(skill)
      );
      
      const requiredEquipment = getRequiredEquipment(order.productId);
      const equipmentAvailable = requiredEquipment.every(equipment =>
        isEquipmentAvailable(equipment, shift.date, shift.startTime)
      );
      
      return hasRequiredSkills && equipmentAvailable;
    });
    
    // Optimize assignment using priority, efficiency, and capacity
    const optimizedAssignment = await findOptimalAssignment(
      shift, compatibleOrders, availableHours
    );
    
    assignments.push(...optimizedAssignment);
  }
  
  // Create relationship records for assignments
  for (const assignment of assignments) {
    await createRelationship({
      sourceType: "StaffShift", sourceId: assignment.shiftId,
      targetType: "WorkOrder", targetId: assignment.workOrderId,
      relationshipType: "planned_production",
      metadata: {
        allocatedHours: assignment.hours,
        estimatedOutput: assignment.expectedQuantity,
        skillMatch: assignment.skillCompatibility,
        priority: assignment.priority,
        confidence: assignment.optimizationScore
      }
    });
  }
}
```

#### **3. Products ↔ Budgets (Financial Product Planning)**
**Business Problem**: We don't track how much we spend on each product for marketing, development, or inventory, making ROI analysis impossible.

**Relationship Types**:
- `"marketing_budget"` - Budget allocated for product marketing
- `"development_budget"` - R&D and product development budget
- `"inventory_budget"` - Budget for inventory purchases
- `"promotion_budget"` - Special promotions and campaigns
- `"packaging_budget"` - Product packaging development

**Use Cases**:
- **ROI Analysis**: Calculate return on investment per product
- **Budget Optimization**: Reallocate budget based on product performance
- **Profitability Tracking**: Full cost accounting including marketing/development
- **Campaign Effectiveness**: Measure marketing campaign impact
- **Resource Planning**: Plan future budgets based on product success
- **Cost Center Analysis**: Understand true cost of each product

**Metadata Schema**:
```json
{
  "allocatedAmount": "number",       // Total budget allocated
  "spentAmount": "number",          // Amount already spent
  "remainingAmount": "number",       // Budget remaining
  "purpose": "enum",                // "marketing", "development", "inventory", "promotion"
  "quarter": "string",              // "Q1-2024", "Q2-2024"
  "expectedROI": "number",          // Expected return percentage
  "actualROI": "number",            // Actual return achieved
  "campaignType": "string",         // "digital", "print", "events", "social", "influencer"
  "targetMetrics": "object",        // {"sales_increase": 20, "brand_awareness": 15}
  "actualMetrics": "object",        // Achieved metrics
  "campaignStartDate": "string",    // When campaign/initiative started
  "campaignEndDate": "string",      // When it ended
  "geographicScope": "string",      // "local", "national", "regional"
  "targetAudience": "string",       // Demographics or customer segment
  "competitorAnalysis": "object"    // Competitive landscape data
}
```

### **P2 - Optional Enhancement Relationships**

#### **4. Staff ↔ Contacts (Account Management)**
**Relationship Types**: `"account_manager"`, `"primary_contact"`, `"backup_contact"`, `"relationship_owner"`

**Use Cases** (Optional Implementation):
- Assign account managers to key customers/suppliers
- Track staff-customer relationship strength  
- Customer satisfaction by account manager
- Territory and relationship management

#### **5. Staff ↔ Products (Expertise Tracking)**
**Relationship Types**: `"product_specialist"`, `"certified_expert"`, `"trainer"`, `"training_needed"`

**Use Cases** (Optional Implementation):
- Track staff product expertise and certifications
- Optimize task assignments based on skills
- Identify training needs and skill gaps
- Customer service optimization

---

## 🎯 **@ Mention System**

### **Universal Mention Component Design**

The @ mention system allows users to organically create relationships while working by simply typing "@" in any text field and selecting relevant entities.

#### **Core Functionality**:

**Trigger**: User types "@" in any text input (task descriptions, comments, notes, etc.)

**Dropdown Structure**:
```typescript
interface MentionableEntities {
  "👥 Staff": {
    entities: User[],
    icon: "👥",
    searchFields: ["firstName", "lastName", "email", "username"],
    displayFormat: "{firstName} {lastName} ({role})"
  },
  "📞 Contacts": {
    entities: Contact[],
    icon: "📞", 
    searchFields: ["name", "company", "email", "skuAbbreviation"],
    displayFormat: "{name} - {company}"
  },
  "📦 Products": {
    entities: Product[],
    icon: "📦",
    searchFields: ["name", "sku", "description"],
    displayFormat: "{name} ({sku})"
  },
  "⏰ Shifts": {
    entities: StaffShift[],
    icon: "⏰",
    searchFields: ["date", "position", "user.firstName"],
    displayFormat: "{date} {startTime}-{endTime} ({user.firstName})"
  },
  "💰 Budgets": {
    entities: Budget[],
    icon: "💰",
    searchFields: ["name", "description"],
    displayFormat: "{name} - {currency} {totalPlanned}"
  },
  "📋 Projects": {
    entities: Project[],
    icon: "📋",
    searchFields: ["name", "description"],
    displayFormat: "{name}"
  },
  "✅ Tasks": {
    entities: Task[],
    icon: "✅",
    searchFields: ["title", "description"],
    displayFormat: "{title} (#{id})"
  },
  "🏭 Work Orders": {
    entities: WorkOrder[],
    icon: "🏭",
    searchFields: ["id", "product.name"],
    displayFormat: "WO-{id} ({product.name})"
  }
}
```

#### **Smart Search Features**:

**Fuzzy Search Implementation**:
- Match partial names, SKUs, abbreviations
- Handle typos and approximate matches
- Support multiple languages/character sets

**Context Awareness**:
```typescript
// When user is in a task related to "Coffee Production"
// Prioritize showing:
// - Products with "coffee" in name
// - Contacts tagged as "coffee suppliers" 
// - Staff with coffee-related skills
// - Equipment/resources related to coffee

function getContextualSuggestions(currentContext: EntityContext): MentionSuggestion[] {
  const suggestions = [];
  
  // If we're in a task, show related entities first
  if (currentContext.entityType === "Task") {
    const taskKeywords = extractKeywords(currentContext.title + " " + currentContext.description);
    
    // Find products matching keywords
    const relatedProducts = products.filter(p => 
      taskKeywords.some(keyword => p.name.toLowerCase().includes(keyword.toLowerCase()))
    );
    
    suggestions.push(...relatedProducts);
  }
  
  return suggestions;
}
```

**Recent History Priority**:
```typescript
// Show recently mentioned entities first
interface RecentMentions {
  entityType: string;
  entityId: string;
  lastMentioned: Date;
  mentionCount: number;
}

// User's recent mentions get priority in dropdown
```

**Relationship Suggestions**:
```typescript
// When user mentions a supplier, also suggest their products
function getRelationshipSuggestions(mentionedEntity: Entity): Entity[] {
  if (mentionedEntity.type === "Contact" && mentionedEntity.type === "supplier") {
    // Show products this supplier provides
    return getRelatedEntities(mentionedEntity.id, "Product", "preferred_supplier");
  }
  
  if (mentionedEntity.type === "Product") {
    // Show suppliers for this product
    return getRelatedEntities(mentionedEntity.id, "Contact", "preferred_supplier");
  }
  
  return [];
}
```

**Bulk Mention Syntax**:
```typescript
// Special syntax for bulk mentions
const bulkMentionPatterns = {
  "@staff:all": () => getAllActiveStaff(),
  "@products:category:coffee": () => getProductsByCategory("coffee"),
  "@contacts:type:supplier": () => getContactsByType("supplier"),
  "@team:project:renovation": () => getProjectTeamMembers("renovation")
};
```

#### **Mention-Triggered Relationship Creation**:

When a user mentions an entity, the system automatically creates a relationship:

```typescript
interface MentionContext {
  sourceEntity: {
    type: string,      // "Task", "Comment", "Note", "Document"
    id: string
  },
  mentionLocation: {
    field: string,     // "description", "comment", "notes"
    position: number,  // Character position in text
    context: string    // Surrounding text for context
  },
  mentionedEntity: {
    type: string,      // "User", "Product", "Contact", etc.
    id: string,
    displayText: string // How it appeared in the mention
  }
}

async function onMentionCreated(context: MentionContext) {
  await createRelationship({
    sourceType: context.sourceEntity.type,
    sourceId: context.sourceEntity.id,
    targetType: context.mentionedEntity.type,
    targetId: context.mentionedEntity.id,
    relationshipType: "mentioned_in",
    metadata: {
      context: context.mentionLocation.field,
      mentionText: context.mentionedEntity.displayText,
      position: context.mentionLocation.position,
      surroundingContext: context.mentionLocation.context,
      createdVia: "mention",
      timestamp: new Date().toISOString()
    }
  });
}
```

#### **Advanced Mention Features**:

**Smart Auto-Assignment**:
```typescript
// Mentioning staff in task automatically creates assignment
if (sourceEntity.type === "Task" && mentionedEntity.type === "User") {
  await createRelationship({
    sourceType: "Task", sourceId: sourceEntity.id,
    targetType: "User", targetId: mentionedEntity.id,
    relationshipType: "assigned_to",
    metadata: {
      assignmentType: "mentioned",
      assignedAt: new Date().toISOString(),
      assignedBy: currentUser.id
    }
  });
}
```

**Smart Notifications**:
```typescript
// Send appropriate notifications when entities are mentioned
async function sendMentionNotifications(context: MentionContext) {
  if (context.mentionedEntity.type === "User") {
    await notificationService.send({
      recipientId: context.mentionedEntity.id,
      type: "mention",
      subject: "You were mentioned in a task",
      content: `You were mentioned in ${context.sourceEntity.type}: ${context.mentionLocation.context}`,
      actionUrl: `/tasks/${context.sourceEntity.id}`
    });
  }
}
```

**Relationship Strength Updates**:
```typescript
// Frequent mentions increase relationship strength
async function updateRelationshipStrength(sourceId: string, targetId: string) {
  const existing = await findRelationship(sourceId, targetId, "mentioned_in");
  if (existing) {
    const mentionCount = existing.metadata.mentionCount || 0;
    const newStrength = Math.min(5, Math.floor(mentionCount / 10) + 1); // Max strength of 5
    
    await updateRelationship(existing.id, {
      strength: newStrength,
      metadata: {
        ...existing.metadata,
        mentionCount: mentionCount + 1,
        lastMentioned: new Date().toISOString()
      }
    });
  }
}
```

---

## 🏷️ **Universal SKU System**

### **Core Concept**
Any entity in the system can have a customizable SKU that dynamically pulls data from the entity's properties and relationships. This creates meaningful, readable identifiers that reflect actual business connections.

### **SKU Template Examples**

#### **1. Product SKU (Enhanced Current System)**
```json
{
  "id": "template_product_enhanced",
  "name": "Product Enhanced",
  "entityType": "Product",
  "template": "{format}-{supplier}-{category}-{extras}",
  "description": "Enhanced product SKUs including supplier relationship data",
  "availableComponents": {
    "format": {
      "type": "static",
      "options": ["100", "200", "300"],
      "description": "Product format: 100=Envasados, 200=Congelados, 300=Frescos"
    },
    "supplier": {
      "type": "relationship",
      "targetType": "Contact",
      "relationshipType": "preferred_supplier",
      "field": "skuAbbreviation",
      "fallback": "GEN",
      "description": "Primary supplier's SKU abbreviation"
    },
    "category": {
      "type": "field",
      "path": "category.code",
      "fallback": "CAT",
      "transform": "uppercase",
      "maxLength": 3,
      "description": "Product category code"
    },
    "extras": {
      "type": "calculated",
      "calculation": "extras_codes",
      "description": "Calculated codes from product extras array"
    }
  }
}
```

**Example Output**: `100-SMT-CAF-56`
- `100` = Envasados (packaged products)
- `SMT` = Smutter (primary supplier)
- `CAF` = Coffee category  
- `56` = Vegan (5) + Sin Gluten (6)

#### **2. Work Order SKU**
```json
{
  "id": "template_work_order",
  "name": "Production Order",
  "entityType": "WorkOrder", 
  "template": "WO-{staff}-{product}-{date}",
  "description": "Work order tracking with staff and product identification",
  "availableComponents": {
    "staff": {
      "type": "relationship",
      "targetType": "User",
      "relationshipType": "assigned_to",
      "field": "initials",
      "fallback": "UNK",
      "description": "Initials of assigned staff member"
    },
    "product": {
      "type": "relationship",
      "targetType": "Product", 
      "relationshipType": "produces",
      "field": "sku",
      "fallback": "PROD",
      "maxLength": 6,
      "description": "SKU of product being produced"
    },
    "date": {
      "type": "date",
      "format": "YYMMDD",
      "description": "Production date in YYMMDD format"
    }
  }
}
```

**Example Output**: `WO-JDO-100SMT-241215`
- `WO` = Work Order prefix
- `JDO` = Juan Doe (assigned staff)
- `100SMT` = Product SKU (truncated to 6 chars)
- `241215` = December 15, 2024

#### **3. Contact SKU**
```json
{
  "id": "template_contact_business",
  "name": "Business Contact",
  "entityType": "Contact",
  "template": "{type}-{brand}-{country}",
  "description": "Business contact identification with relationship context",
  "availableComponents": {
    "type": {
      "type": "field",
      "path": "type",
      "transform": "uppercase",
      "mapping": {
        "supplier": "SUP",
        "customer": "CUS", 
        "brand": "BRD",
        "important": "IMP"
      },
      "fallback": "CON",
      "description": "Contact type abbreviation"
    },
    "brand": {
      "type": "relationship",
      "targetType": "Brand",
      "relationshipType": "represents",
      "field": "abbreviation",
      "fallback": "field:skuAbbreviation",
      "description": "Brand abbreviation or contact's own abbreviation"
    },
    "country": {
      "type": "calculated",
      "calculation": "country_from_address",
      "fallback": "XX",
      "description": "Country code extracted from address"
    }
  }
}
```

**Example Output**: `SUP-SMT-CL`
- `SUP` = Supplier
- `SMT` = Smutter brand
- `CL` = Chile

#### **4. Task SKU**
```json
{
  "id": "template_task_project",
  "name": "Project Task",
  "entityType": "Task",
  "template": "TSK-{assignee}-{project}-{sequence}",
  "description": "Task tracking within projects",
  "availableComponents": {
    "assignee": {
      "type": "relationship",
      "targetType": "User",
      "relationshipType": "assigned_to",
      "field": "initials",
      "fallback": "UNA",
      "description": "Primary assignee initials"
    },
    "project": {
      "type": "field",
      "path": "project.code",
      "fallback": "calculated:project_code_from_name",
      "maxLength": 3,
      "description": "Project code or abbreviated name"
    },
    "sequence": {
      "type": "calculated",
      "calculation": "project_task_sequence",
      "format": "000",
      "description": "Sequential task number within project"
    }
  }
}
```

**Example Output**: `TSK-JDO-REN-003`
- `TSK` = Task prefix
- `JDO` = Juan Doe (assignee)
- `REN` = Renovation project
- `003` = Third task in project

#### **5. Shift SKU**
```json
{
  "id": "template_shift_staff",
  "name": "Staff Shift",
  "entityType": "StaffShift",
  "template": "SHF-{period}-{staff}-{day}",
  "description": "Staff shift identification",
  "availableComponents": {
    "period": {
      "type": "calculated",
      "calculation": "shift_period_from_time",
      "description": "Time period: AM, PM, EVE, NGT"
    },
    "staff": {
      "type": "field",
      "path": "user.initials",
      "fallback": "calculated:initials_from_name",
      "description": "Staff member initials"
    },
    "day": {
      "type": "date",
      "dateField": "date",
      "format": "ddd",
      "transform": "uppercase",
      "description": "Day of week: MON, TUE, WED"
    }
  }
}
```

**Example Output**: `SHF-AM-JDO-MON`
- `SHF` = Shift prefix
- `AM` = Morning shift
- `JDO` = Juan Doe
- `MON` = Monday

### **Component Resolution System**

The SKU system needs to resolve different types of components:

#### **Static Components**
```typescript
interface StaticComponent {
  type: "static";
  options: string[];           // ["100", "200", "300"]
  description: string;
}

// Resolution: Pick first option or let user choose
```

#### **Field Components**
```typescript
interface FieldComponent {
  type: "field";
  path: string;               // "category.code", "user.firstName"
  transform?: "uppercase" | "lowercase" | "titlecase";
  maxLength?: number;
  fallback?: string;
  mapping?: Record<string, string>; // Transform values
}

// Resolution: Extract value from entity using path notation
```

#### **Relationship Components**
```typescript
interface RelationshipComponent {
  type: "relationship";
  targetType: string;         // "Contact", "User", "Product"
  relationshipType: string;   // "preferred_supplier", "assigned_to"
  field: string;             // Field from related entity
  fallback?: string;         // If no relationship exists
  priority?: "strength" | "recent" | "first"; // Which relationship to use
}

// Resolution: Find relationship, get related entity, extract field
```

#### **Date Components**
```typescript
interface DateComponent {
  type: "date";
  format: string;            // "YYMMDD", "MMYY", "ddd"
  dateField?: string;        // Which date field to use (default: now)
  timezone?: string;         // Timezone for formatting
}

// Resolution: Format date according to specification
```

#### **Calculated Components**
```typescript
interface CalculatedComponent {
  type: "calculated";
  calculation: string;       // "extras_codes", "sequence_number"
  format?: string;          // Formatting for numbers (e.g., "000")
  parameters?: Record<string, any>; // Parameters for calculation
}

// Resolution: Run custom calculation function
```

#### **Conditional Components**
```typescript
interface ConditionalComponent {
  type: "conditional";
  conditions: Array<{
    if: { field: string; operator: string; value: any };
    then: string;
  }>;
  default: string;
}

// Resolution: Evaluate conditions and return appropriate value
```

### **Dynamic SKU Generation Service**

```typescript
class UniversalSKUService {
  
  async generateSKU(
    entityType: string, 
    entityId: string, 
    templateId?: string
  ): Promise<string> {
    
    // 1. Get entity data with all relationships
    const entityData = await this.getEntityWithRelationships(entityType, entityId);
    
    // 2. Get appropriate template
    const template = templateId 
      ? await this.getTemplate(templateId)
      : await this.getDefaultTemplate(entityType);
    
    // 3. Resolve all components
    const components = await this.resolveComponents(entityData, template);
    
    // 4. Generate SKU from template
    const sku = this.processTemplate(template.template, components);
    
    // 5. Validate and ensure uniqueness
    const finalSKU = await this.ensureUniqueSKU(sku, entityType, entityId);
    
    // 6. Save SKU record
    await this.saveEntitySKU(entityType, entityId, finalSKU, template, components);
    
    return finalSKU;
  }
  
  private async getEntityWithRelationships(entityType: string, entityId: string) {
    // Get base entity
    const entity = await this.prisma[entityType.toLowerCase()].findUnique({
      where: { id: entityId },
      include: this.getEntityIncludes(entityType)
    });
    
    // Get all relationships for this entity
    const relationships = await this.prisma.entityRelationship.findMany({
      where: {
        OR: [
          { sourceType: entityType, sourceId: entityId },
          { targetType: entityType, targetId: entityId }
        ],
        isActive: true
      }
    });
    
    return { ...entity, relationships };
  }
  
  private async resolveComponents(entityData: any, template: SKUTemplate) {
    const components = {};
    
    for (const [key, componentDef] of Object.entries(template.availableComponents)) {
      try {
        components[key] = await this.resolveComponent(entityData, componentDef);
      } catch (error) {
        console.warn(`Failed to resolve component ${key}:`, error);
        components[key] = componentDef.fallback || 'UNK';
      }
    }
    
    return components;
  }
  
  private async resolveComponent(entityData: any, componentDef: any): Promise<string> {
    switch (componentDef.type) {
      case 'static':
        return componentDef.options[0]; // Default to first option
        
      case 'field':
        return this.resolveFieldComponent(entityData, componentDef);
        
      case 'relationship':
        return await this.resolveRelationshipComponent(entityData, componentDef);
        
      case 'date':
        return this.resolveDateComponent(entityData, componentDef);
        
      case 'calculated':
        return await this.resolveCalculatedComponent(entityData, componentDef);
        
      case 'conditional':
        return this.resolveConditionalComponent(entityData, componentDef);
        
      default:
        throw new Error(`Unknown component type: ${componentDef.type}`);
    }
  }
  
  private resolveFieldComponent(entityData: any, componentDef: any): string {
    const value = this.getNestedValue(entityData, componentDef.path);
    
    if (!value && componentDef.fallback) {
      return componentDef.fallback;
    }
    
    let result = String(value || '');
    
    // Apply transformations
    if (componentDef.transform === 'uppercase') {
      result = result.toUpperCase();
    } else if (componentDef.transform === 'lowercase') {
      result = result.toLowerCase();
    }
    
    // Apply mapping
    if (componentDef.mapping && componentDef.mapping[result]) {
      result = componentDef.mapping[result];
    }
    
    // Apply length limit
    if (componentDef.maxLength) {
      result = result.substring(0, componentDef.maxLength);
    }
    
    return result;
  }
  
  private async resolveRelationshipComponent(entityData: any, componentDef: any): Promise<string> {
    // Find the appropriate relationship
    const relationship = entityData.relationships.find(rel => 
      rel.targetType === componentDef.targetType && 
      rel.relationshipType === componentDef.relationshipType
    );
    
    if (!relationship) {
      return componentDef.fallback || 'UNK';
    }
    
    // Get the related entity
    const relatedEntity = await this.prisma[componentDef.targetType.toLowerCase()].findUnique({
      where: { id: relationship.targetId }
    });
    
    if (!relatedEntity) {
      return componentDef.fallback || 'UNK';
    }
    
    // Extract the requested field
    const value = this.getNestedValue(relatedEntity, componentDef.field);
    return String(value || componentDef.fallback || 'UNK');
  }
  
  private resolveDateComponent(entityData: any, componentDef: any): string {
    const date = componentDef.dateField 
      ? new Date(entityData[componentDef.dateField])
      : new Date();
    
    return this.formatDate(date, componentDef.format);
  }
  
  private async resolveCalculatedComponent(entityData: any, componentDef: any): Promise<string> {
    // Custom calculation functions
    const calculations = {
      'extras_codes': () => this.calculateExtrasCodes(entityData),
      'project_task_sequence': () => this.calculateTaskSequence(entityData),
      'shift_period_from_time': () => this.calculateShiftPeriod(entityData),
      'country_from_address': () => this.extractCountryFromAddress(entityData),
      'initials_from_name': () => this.calculateInitials(entityData)
    };
    
    const calculator = calculations[componentDef.calculation];
    if (!calculator) {
      throw new Error(`Unknown calculation: ${componentDef.calculation}`);
    }
    
    const result = await calculator();
    
    // Apply formatting if specified
    if (componentDef.format && typeof result === 'number') {
      return result.toString().padStart(componentDef.format.length, '0');
    }
    
    return String(result);
  }
  
  private processTemplate(template: string, components: Record<string, string>): string {
    let result = template;
    
    for (const [key, value] of Object.entries(components)) {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value);
    }
    
    return result;
  }
  
  private async ensureUniqueSKU(sku: string, entityType: string, entityId: string): Promise<string> {
    let uniqueSKU = sku;
    let counter = 1;
    
    while (await this.skuExists(uniqueSKU, entityType, entityId)) {
      uniqueSKU = `${sku}-${counter.toString().padStart(2, '0')}`;
      counter++;
      
      if (counter > 99) {
        throw new Error(`Could not generate unique SKU for ${entityType}:${entityId}`);
      }
    }
    
    return uniqueSKU;
  }
}
```

### **SKU Management UI Components**

#### **SKU Editor Component**
```typescript
interface SKUEditorProps {
  entityType: string;
  entityId: string;
  onSKUChange?: (sku: string) => void;
}

function SKUEditor({ entityType, entityId, onSKUChange }: SKUEditorProps) {
  const [currentSKU, setCurrentSKU] = useState<string>('');
  const [template, setTemplate] = useState<SKUTemplate | null>(null);
  const [components, setComponents] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState<boolean>(false);
  
  return (
    <div className="sku-editor">
      {/* Current SKU Display */}
      <div className="current-sku">
        <label>Current SKU:</label>
        <div className="sku-display">
          {isEditing ? (
            <input 
              value={currentSKU} 
              onChange={(e) => setCurrentSKU(e.target.value)}
              className="sku-input"
            />
          ) : (
            <span className="sku-value">{currentSKU}</span>
          )}
        </div>
      </div>
      
      {/* Template Selection */}
      <div className="template-selector">
        <label>SKU Template:</label>
        <select 
          value={template?.id || ''}
          onChange={handleTemplateChange}
        >
          <option value="">Select template...</option>
          {availableTemplates.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>
      
      {/* Component Editor */}
      {template && (
        <div className="component-editor">
          <h4>SKU Components:</h4>
          <div className="components-grid">
            {Object.entries(template.availableComponents).map(([key, def]) => (
              <div key={key} className="component-row">
                <label>{key}:</label>
                <ComponentInput 
                  component={def}
                  value={components[key]}
                  onChange={(value) => setComponents(prev => ({...prev, [key]: value}))}
                />
                <span className="component-preview">{components[key]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* SKU Preview */}
      <div className="sku-preview">
        <label>Preview:</label>
        <div className="preview-breakdown">
          {template && (
            <div className="template-visualization">
              {template.template.split(/(\{[^}]+\})/).map((part, index) => (
                <span 
                  key={index}
                  className={part.startsWith('{') ? 'component' : 'separator'}
                >
                  {part.startsWith('{') 
                    ? components[part.slice(1, -1)] || part
                    : part
                  }
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className="sku-actions">
        <button onClick={regenerateSKU}>🔄 Regenerate</button>
        <button onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? '💾 Save' : '✏️ Edit'}
        </button>
        <button onClick={resetToGenerated}>↩️ Reset</button>
      </div>
    </div>
  );
}
```

---

## 📊 **Relationship-Centric Dashboards**

### **Project Dashboard - Complete Relationship Hub**

The Project dashboard becomes a central command center showing all entities connected to a project and their relationships.

#### **Dashboard Layout**:

```typescript
interface ProjectRelationshipDashboard {
  projectId: string;
  sections: {
    relationshipGraph: RelationshipGraphSection;
    connectedEntities: ConnectedEntitiesSection;
    relationshipAnalytics: RelationshipAnalyticsSection;
    quickActions: QuickActionsSection;
    relationshipHistory: RelationshipHistorySection;
  };
}
```

#### **Relationship Graph Section**:
Visual representation of all project connections:

```typescript
interface RelationshipGraphSection {
  centerNode: {
    type: "Project",
    id: string,
    name: string
  };
  connectedNodes: Array<{
    type: string;           // "User", "Product", "Budget", etc.
    id: string;
    name: string;
    relationshipType: string;
    relationshipStrength: number; // 1-5
    metadata: any;
    position: { x: number, y: number }; // For graph layout
  }>;
  edges: Array<{
    from: string;          // Node ID
    to: string;           // Node ID
    relationshipType: string;
    strength: number;
    isActive: boolean;
    metadata: any;
  }>;
  graphSettings: {
    layout: "force" | "hierarchical" | "circular";
    showLabels: boolean;
    colorByType: boolean;
    sizeByStrength: boolean;
  };
}

// Visual Graph Component
function RelationshipGraph({ projectId, settings }: RelationshipGraphProps) {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  
  // Graph interaction handlers
  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
    // Show detailed information about this entity
  };
  
  const handleEdgeClick = (edge: GraphEdge) => {
    // Show relationship details
    showRelationshipDetails(edge.from, edge.to, edge.relationshipType);
  };
  
  return (
    <div className="relationship-graph">
      <div className="graph-controls">
        <button onClick={() => changeLayout('force')}>Force Layout</button>
        <button onClick={() => changeLayout('hierarchical')}>Hierarchy</button>
        <button onClick={() => changeLayout('circular')}>Circular</button>
        <button onClick={toggleLabels}>Toggle Labels</button>
      </div>
      
      <div className="graph-container">
        <ForceGraph2D
          graphData={graphData}
          nodeLabel="name"
          nodeColor={getNodeColor}
          nodeSize={getNodeSize}
          linkColor={getLinkColor}
          linkWidth={getLinkWidth}
          onNodeClick={handleNodeClick}
          onLinkClick={handleEdgeClick}
        />
      </div>
      
      {selectedNode && (
        <div className="node-details">
          <NodeDetailPanel nodeId={selectedNode} />
        </div>
      )}
    </div>
  );
}
```

#### **Connected Entities Section**:
Organized view of all related entities by type:

```typescript
function ConnectedEntitiesSection({ projectId }: ConnectedEntitiesSectionProps) {
  const [entities, setEntities] = useState<GroupedEntities>({});
  
  interface GroupedEntities {
    "👥 Team Members": Array<{
      entity: User;
      relationship: EntityRelationship;
      role: string;
      timeCommitment: number;
      permissions: string[];
    }>;
    "💰 Budget Allocations": Array<{
      entity: Budget;
      relationship: EntityRelationship;
      allocatedAmount: number;
      spentAmount: number;
      purpose: string;
    }>;
    "📦 Related Products": Array<{
      entity: Product;
      relationship: EntityRelationship;
      developmentStage: string;
      businessImpact: string;
    }>;
    "✅ Project Tasks": Array<{
      entity: Task;
      relationship: EntityRelationship;
      status: string;
      assignee: User;
      priority: string;
    }>;
    "🏭 Work Orders": Array<{
      entity: WorkOrder;
      relationship: EntityRelationship;
      status: string;
      estimatedCompletion: Date;
    }>;
    "📞 Stakeholder Contacts": Array<{
      entity: Contact;
      relationship: EntityRelationship;
      contactType: string;
      lastContact: Date;
    }>;
  }
  
  return (
    <div className="connected-entities">
      {Object.entries(entities).map(([entityType, entityList]) => (
        <div key={entityType} className="entity-group">
          <h3 className="entity-group-title">
            {entityType} ({entityList.length})
          </h3>
          
          <div className="entity-list">
            {entityList.map((item, index) => (
              <EntityCard 
                key={index}
                entity={item.entity}
                relationship={item.relationship}
                additionalData={item}
                onEdit={() => editRelationship(item.relationship.id)}
                onRemove={() => removeRelationship(item.relationship.id)}
              />
            ))}
          </div>
          
          <button 
            className="add-entity-btn"
            onClick={() => addEntityToProject(projectId, entityType)}
          >
            + Add {entityType}
          </button>
        </div>
      ))}
    </div>
  );
}
```

#### **Relationship Analytics Section**:
Business intelligence about project relationships:

```typescript
interface RelationshipAnalytics {
  totalConnections: number;
  strongestRelationships: Array<{
    entityA: string;
    entityB: string;
    relationshipType: string;
    strength: number;
    businessImpact: string;
  }>;
  relationshipHealth: {
    healthy: number;    // Active, strong relationships
    warning: number;    // Weak or outdated relationships  
    critical: number;   // Missing critical relationships
  };
  activityMetrics: {
    recentlyCreated: number;    // Relationships created in last 30 days
    frequentlyUpdated: number;  // High-activity relationships
    stagnant: number;          // No recent activity
  };
  networkMetrics: {
    density: number;           // How interconnected the project is
    centralityScores: Array<{  // Most important entities
      entityId: string;
      entityType: string;
      centralityScore: number;
    }>;
  };
}

function RelationshipAnalyticsSection({ projectId }: RelationshipAnalyticsSectionProps) {
  const [analytics, setAnalytics] = useState<RelationshipAnalytics | null>(null);
  
  return (
    <div className="relationship-analytics">
      <div className="analytics-grid">
        <div className="metric-card">
          <h4>Network Health</h4>
          <div className="health-indicators">
            <div className="health-item healthy">
              <span className="count">{analytics?.relationshipHealth.healthy}</span>
              <span className="label">Healthy</span>
            </div>
            <div className="health-item warning">
              <span className="count">{analytics?.relationshipHealth.warning}</span>
              <span className="label">Needs Attention</span>
            </div>
            <div className="health-item critical">
              <span className="count">{analytics?.relationshipHealth.critical}</span>
              <span className="label">Critical Issues</span>
            </div>
          </div>
        </div>
        
        <div className="metric-card">
          <h4>Key Connections</h4>
          <div className="top-relationships">
            {analytics?.strongestRelationships.map((rel, index) => (
              <div key={index} className="relationship-item">
                <span className="entities">{rel.entityA} ↔ {rel.entityB}</span>
                <span className="strength">Strength: {rel.strength}/5</span>
                <span className="impact">{rel.businessImpact}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="metric-card">
          <h4>Network Density</h4>
          <div className="density-visualization">
            <div className="density-score">
              {(analytics?.networkMetrics.density * 100).toFixed(1)}%
            </div>
            <div className="density-description">
              {analytics?.networkMetrics.density > 0.7 ? "Highly Connected" :
               analytics?.networkMetrics.density > 0.4 ? "Well Connected" :
               "Loosely Connected"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### **Quick Actions Section**:
Fast relationship management tools:

```typescript
function QuickActionsSection({ projectId }: QuickActionsSectionProps) {
  const [actionType, setActionType] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  
  const quickActions = [
    {
      id: 'assign_team_member',
      label: '👥 Assign Team Member',
      description: 'Add staff member to project with role and permissions',
      action: () => openAssignmentModal('User')
    },
    {
      id: 'allocate_budget', 
      label: '💰 Allocate Budget',
      description: 'Connect budget line items to this project',
      action: () => openAllocationModal('Budget')
    },
    {
      id: 'link_product',
      label: '📦 Link Product',
      description: 'Connect products being developed or used in project',
      action: () => openLinkingModal('Product')
    },
    {
      id: 'create_task',
      label: '✅ Create Related Task', 
      description: 'Create new task automatically linked to project',
      action: () => createLinkedTask()
    },
    {
      id: 'plan_production',
      label: '🏭 Plan Production',
      description: 'Create work orders for project deliverables',
      action: () => openProductionModal()
    },
    {
      id: 'bulk_link',
      label: '🔗 Bulk Link Entities',
      description: 'Link multiple entities at once',
      action: () => openBulkLinkModal()
    }
  ];
  
  return (
    <div className="quick-actions">
      <h3>Quick Actions</h3>
      <div className="actions-grid">
        {quickActions.map(action => (
          <div key={action.id} className="action-card" onClick={action.action}>
            <div className="action-label">{action.label}</div>
            <div className="action-description">{action.description}</div>
          </div>
        ))}
      </div>
      
      {/* Smart Suggestions */}
      <div className="smart-suggestions">
        <h4>💡 Suggested Connections</h4>
        <div className="suggestions-list">
          <SuggestedRelationships projectId={projectId} />
        </div>
      </div>
    </div>
  );
}
```

### **Budget Dashboard - Financial Connection Intelligence**

The Budget dashboard shows how financial resources connect to all aspects of the business.

#### **Budget Allocation Map**:
Visual representation of where budget money goes:

```typescript
interface BudgetAllocationMap {
  totalBudget: number;
  allocations: Array<{
    category: "Products" | "Staff" | "Suppliers" | "Equipment" | "Marketing";
    amount: number;
    percentage: number;
    entities: Array<{
      id: string;
      name: string;
      type: string;
      amount: number;
      roi?: number;
      performance?: "excellent" | "good" | "average" | "poor";
    }>;
  }>;
}

function BudgetAllocationMap({ budgetId }: BudgetAllocationMapProps) {
  return (
    <div className="budget-allocation-map">
      <div className="allocation-overview">
        <div className="total-budget">
          <h2>${totalBudget.toLocaleString()}</h2>
          <span>Total Budget</span>
        </div>
        
        <div className="allocation-pie-chart">
          <PieChart data={allocationData} />
        </div>
      </div>
      
      <div className="allocation-breakdown">
        {allocations.map(category => (
          <div key={category.category} className="category-section">
            <div className="category-header">
              <h3>{category.category}</h3>
              <div className="category-total">
                ${category.amount.toLocaleString()} ({category.percentage}%)
              </div>
            </div>
            
            <div className="entity-allocations">
              {category.entities.map(entity => (
                <div key={entity.id} className="entity-allocation">
                  <div className="entity-info">
                    <span className="entity-name">{entity.name}</span>
                    <span className="entity-type">{entity.type}</span>
                  </div>
                  <div className="allocation-amount">
                    ${entity.amount.toLocaleString()}
                  </div>
                  {entity.roi && (
                    <div className="roi-indicator">
                      ROI: {entity.roi}%
                    </div>
                  )}
                  <div className={`performance-badge ${entity.performance}`}>
                    {entity.performance}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### **ROI Analysis Section**:
Track return on investment across all connected entities:

```typescript
interface ROIAnalysis {
  overallROI: number;
  productROI: Array<{
    productId: string;
    productName: string;
    investment: number;
    returns: number;
    roi: number;
    timeframe: string;
    status: "growing" | "stable" | "declining";
  }>;
  projectROI: Array<{
    projectId: string;
    projectName: string;
    investment: number;
    expectedReturns: number;
    actualReturns?: number;
    roi: number;
    completionRate: number;
  }>;
  campaignROI: Array<{
    campaignId: string;
    campaignName: string;
    campaignType: string;
    investment: number;
    measuredReturns: number;
    roi: number;
    conversionMetrics: any;
  }>;
}
```

---

## 🤖 **Auto-Detection & Intelligence Systems**

### **1. Supplier Relationship Auto-Detection**

Automatically identify and create supplier relationships based on purchase patterns:

```typescript
class SupplierRelationshipDetector {
  
  async detectSupplierRelationships(): Promise<void> {
    // Analyze purchase history from last 18 months
    const purchaseAnalysis = await this.analyzePurchasePatterns();
    
    for (const pattern of purchaseAnalysis) {
      if (this.meetsSupplierThreshold(pattern)) {
        await this.createSupplierRelationship(pattern);
      }
    }
  }
  
  private async analyzePurchasePatterns() {
    return await this.prisma.costLine.groupBy({
      by: ['productId', 'cost.vendorId'],
      _count: { id: true },
      _sum: { totalCost: true, quantity: true },
      _avg: { unitCost: true },
      _min: { createdAt: true },
      _max: { createdAt: true },
      where: {
        createdAt: { gte: eighteenMonthsAgo },
        isInventory: true,
        cost: { vendor: { isNot: null } }
      },
      having: {
        id: { _count: { gte: 2 } } // At least 2 purchases
      }
    });
  }
  
  private meetsSupplierThreshold(pattern: PurchasePattern): boolean {
    const criteria = {
      minimumOrders: 2,           // At least 2 orders
      minimumTotalSpent: 10000,   // At least $10k total
      minimumTimeSpan: 30,        // Orders span at least 30 days
      consistencyThreshold: 0.7   // Price consistency
    };
    
    return (
      pattern._count.id >= criteria.minimumOrders &&
      pattern._sum.totalCost >= criteria.minimumTotalSpent &&
      this.calculateTimeSpan(pattern) >= criteria.minimumTimeSpan &&
      this.calculatePriceConsistency(pattern) >= criteria.consistencyThreshold
    );
  }
  
  private async createSupplierRelationship(pattern: PurchasePattern): Promise<void> {
    // Calculate relationship metrics
    const metrics = await this.calculateSupplierMetrics(
      pattern.vendorId, 
      pattern.productId
    );
    
    // Determine relationship type based on purchase volume and frequency
    const relationshipType = this.determineRelationshipType(pattern, metrics);
    
    await this.relationshipService.create({
      sourceType: "Contact",
      sourceId: pattern.vendorId,
      targetType: "Product", 
      targetId: pattern.productId,
      relationshipType,
      metadata: {
        // Purchase metrics
        totalOrders: pattern._count.id,
        totalSpent: pattern._sum.totalCost,
        avgUnitCost: pattern._avg.unitCost,
        
        // Performance metrics
        reliability: metrics.onTimeDeliveryRate,
        qualityRating: metrics.avgQualityScore,
        leadTime: metrics.avgLeadTime,
        
        // Detection metadata
        autoDetected: true,
        detectionDate: new Date().toISOString(),
        detectionConfidence: metrics.confidence,
        lastOrderDate: pattern._max.createdAt,
        firstOrderDate: pattern._min.createdAt
      }
    });
  }
  
  private async calculateSupplierMetrics(vendorId: string, productId: string) {
    // Calculate on-time delivery rate
    const deliveryPerformance = await this.calculateDeliveryPerformance(vendorId);
    
    // Calculate average quality scores from received goods
    const qualityHistory = await this.calculateQualityHistory(vendorId, productId);
    
    // Calculate average lead time
    const leadTimeAnalysis = await this.calculateLeadTimeAnalysis(vendorId);
    
    return {
      onTimeDeliveryRate: deliveryPerformance.onTimeRate,
      avgQualityScore: qualityHistory.avgScore,
      avgLeadTime: leadTimeAnalysis.avgDays,
      confidence: this.calculateDetectionConfidence(deliveryPerformance, qualityHistory)
    };
  }
  
  private determineRelationshipType(pattern: PurchasePattern, metrics: SupplierMetrics): string {
    // High volume, high frequency, high performance = preferred supplier
    if (pattern._sum.totalCost > 50000 && 
        pattern._count.id > 10 && 
        metrics.reliability > 0.9) {
      return "preferred_supplier";
    }
    
    // Medium volume or newer relationship = backup supplier  
    if (pattern._sum.totalCost > 20000 || pattern._count.id > 5) {
      return "backup_supplier";
    }
    
    // Low volume or trial period = trial supplier
    return "trial_supplier";
  }
}
```

### **2. Production Efficiency Optimization**

Automatically optimize shift-production assignments:

```typescript
class ProductionOptimizer {
  
  async optimizeShiftProduction(): Promise<void> {
    const upcomingShifts = await this.getUpcomingShifts(7); // Next 7 days
    const pendingOrders = await this.getPendingWorkOrders();
    const constraints = await this.gatherConstraints();
    
    // Run optimization algorithm
    const assignments = await this.calculateOptimalAssignments(
      upcomingShifts, 
      pendingOrders, 
      constraints
    );
    
    // Create relationship records for assignments
    await this.createProductionRelationships(assignments);
  }
  
  private async gatherConstraints(): Promise<ProductionConstraints> {
    return {
      staffSkills: await this.getStaffSkillMatrix(),
      equipmentSchedule: await this.getEquipmentAvailability(),
      productRequirements: await this.getProductRequirements(),
      priorityLevels: await this.getOrderPriorities(),
      qualityStandards: await this.getQualityRequirements(),
      capacityLimits: await this.getShiftCapacities()
    };
  }
  
  private async calculateOptimalAssignments(
    shifts: StaffShift[],
    orders: WorkOrder[], 
    constraints: ProductionConstraints
  ): Promise<Assignment[]> {
    
    const assignments: Assignment[] = [];
    
    // Multi-objective optimization considering:
    // 1. Skill matching
    // 2. Equipment availability  
    // 3. Order priority
    // 4. Capacity utilization
    // 5. Quality requirements
    // 6. Setup/changeover costs
    
    for (const shift of shifts) {
      const shiftCapacity = this.calculateShiftCapacity(shift);
      const availableEquipment = this.getAvailableEquipment(shift);
      const staffSkills = constraints.staffSkills[shift.userId];
      
      // Find compatible orders for this shift
      const compatibleOrders = orders.filter(order => 
        this.isCompatible(order, shift, staffSkills, availableEquipment)
      );
      
      // Sort by optimization score (priority, efficiency, setup cost)
      const scoredOrders = compatibleOrders.map(order => ({
        order,
        score: this.calculateAssignmentScore(order, shift, constraints)
      })).sort((a, b) => b.score - a.score);
      
      // Assign orders to shift within capacity limits
      let remainingCapacity = shiftCapacity;
      for (const { order, score } of scoredOrders) {
        const requiredCapacity = this.calculateRequiredCapacity(order, shift);
        
        if (requiredCapacity <= remainingCapacity) {
          assignments.push({
            shiftId: shift.id,
            workOrderId: order.id,
            estimatedHours: requiredCapacity,
            optimizationScore: score,
            confidence: this.calculateAssignmentConfidence(order, shift),
            expectedEfficiency: this.estimateEfficiency(order, shift, staffSkills)
          });
          
          remainingCapacity -= requiredCapacity;
          
          // Remove assigned order from available orders
          orders = orders.filter(o => o.id !== order.id);
        }
      }
    }
    
    return assignments;
  }
  
  private calculateAssignmentScore(
    order: WorkOrder, 
    shift: StaffShift, 
    constraints: ProductionConstraints
  ): number {
    let score = 0;
    
    // Priority weighting (0-40 points)
    const priorityWeights = { urgent: 40, high: 30, medium: 20, low: 10 };
    score += priorityWeights[order.priority] || 0;
    
    // Skill match weighting (0-30 points) 
    const skillMatch = this.calculateSkillMatch(order, shift, constraints.staffSkills);
    score += skillMatch * 30;
    
    // Equipment availability (0-20 points)
    const equipmentAvailability = this.calculateEquipmentScore(order, shift);
    score += equipmentAvailability * 20;
    
    // Setup cost penalty (0-10 points deducted)
    const setupCost = this.calculateSetupCost(order, shift);
    score -= setupCost * 10;
    
    return score;
  }
  
  private async createProductionRelationships(assignments: Assignment[]): Promise<void> {
    for (const assignment of assignments) {
      await this.relationshipService.create({
        sourceType: "StaffShift",
        sourceId: assignment.shiftId,
        targetType: "WorkOrder",
        targetId: assignment.workOrderId,
        relationshipType: "planned_production",
        metadata: {
          allocatedHours: assignment.estimatedHours,
          optimizationScore: assignment.optimizationScore,
          confidence: assignment.confidence,
          expectedEfficiency: assignment.expectedEfficiency,
          createdVia: "auto_optimization",
          optimizationDate: new Date().toISOString()
        }
      });
    }
  }
}
```

### **3. Mention Pattern Analysis**

Learn from @ mention patterns to suggest stronger relationships:

```typescript
class MentionPatternAnalyzer {
  
  async analyzeMentionPatterns(): Promise<void> {
    const mentionData = await this.gatherMentionData();
    const patterns = await this.identifyPatterns(mentionData);
    
    for (const pattern of patterns) {
      if (pattern.confidence > 0.7) {
        await this.suggestRelationshipUpgrade(pattern);
      }
    }
  }
  
  private async gatherMentionData() {
    // Get all mention relationships from last 6 months
    return await this.prisma.entityRelationship.findMany({
      where: {
        relationshipType: "mentioned_in",
        createdAt: { gte: sixMonthsAgo }
      },
      include: {
        // Include entity details for analysis
      }
    });
  }
  
  private async identifyPatterns(mentions: EntityRelationship[]): Promise<MentionPattern[]> {
    // Group mentions by entity pairs
    const entityPairs = this.groupByEntityPairs(mentions);
    
    const patterns: MentionPattern[] = [];
    
    for (const [pairKey, pairMentions] of entityPairs) {
      const pattern = await this.analyzeEntityPairPattern(pairKey, pairMentions);
      
      if (pattern.strength > 0.5) {
        patterns.push(pattern);
      }
    }
    
    return patterns;
  }
  
  private async analyzeEntityPairPattern(
    pairKey: string, 
    mentions: EntityRelationship[]
  ): Promise<MentionPattern> {
    
    const [sourceType, targetType] = pairKey.split(':');
    
    // Calculate pattern metrics
    const frequency = mentions.length;
    const timespan = this.calculateTimespan(mentions);
    const contexts = this.extractContexts(mentions);
    const mentionDensity = frequency / Math.max(timespan, 1);
    
    // Determine suggested relationship type based on context analysis
    const suggestedType = this.inferRelationshipType(
      sourceType, 
      targetType, 
      contexts, 
      frequency
    );
    
    return {
      sourceType,
      targetType,
      frequency,
      timespan,
      mentionDensity,
      contexts,
      suggestedRelationshipType: suggestedType,
      strength: this.calculatePatternStrength(frequency, timespan, contexts),
      confidence: this.calculatePatternConfidence(mentions)
    };
  }
  
  private inferRelationshipType(
    sourceType: string, 
    targetType: string, 
    contexts: string[], 
    frequency: number
  ): string {
    
    // Business logic to infer relationship types from mention patterns
    const relationshipRules = {
      "User:Product": {
        frequent_mentions: "product_specialist",    // Staff mentioned with products often
        task_contexts: "works_on"                  // Mentioned in task contexts
      },
      "Contact:Product": {
        supply_contexts: "preferred_supplier",     // Mentioned in supply contexts
        frequent_mentions: "primary_supplier"     // Very frequent mentions
      },
      "User:Contact": {
        communication_contexts: "account_manager", // Mentioned in communications
        frequent_mentions: "primary_contact"      // Regular interaction
      },
      "Product:Budget": {
        financial_contexts: "budget_allocation",   // Mentioned in budget contexts
        marketing_contexts: "marketing_budget"    // Marketing-related mentions
      }
    };
    
    const pairRules = relationshipRules[`${sourceType}:${targetType}`];
    if (!pairRules) return "related_to"; // Generic relationship
    
    // Apply contextual rules
    if (contexts.some(c => c.includes("supply") || c.includes("purchase"))) {
      return pairRules.supply_contexts || "supplier";
    }
    
    if (frequency > 20) {
      return pairRules.frequent_mentions || "closely_related";
    }
    
    if (contexts.some(c => c.includes("task") || c.includes("work"))) {
      return pairRules.task_contexts || "collaborates_on";
    }
    
    return "related_to";
  }
  
  private async suggestRelationshipUpgrade(pattern: MentionPattern): Promise<void> {
    // Check if a stronger relationship already exists
    const existingRelationship = await this.findExistingRelationship(
      pattern.sourceType, 
      pattern.targetType, 
      pattern.suggestedRelationshipType
    );
    
    if (existingRelationship) {
      // Upgrade existing relationship strength
      await this.updateRelationshipStrength(existingRelationship, pattern);
    } else {
      // Create suggestion for new relationship type
      await this.createRelationshipSuggestion(pattern);
    }
  }
}
```

### **4. Relationship Health Monitoring**

Continuously monitor relationship health and suggest improvements:

```typescript
class RelationshipHealthMonitor {
  
  async monitorRelationshipHealth(): Promise<void> {
    const allRelationships = await this.getAllActiveRelationships();
    
    for (const relationship of allRelationships) {
      const healthScore = await this.calculateHealthScore(relationship);
      
      if (healthScore < 0.6) {
        await this.flagUnhealthyRelationship(relationship, healthScore);
      }
      
      if (this.shouldSuggestActions(relationship, healthScore)) {
        await this.suggestImprovementActions(relationship);
      }
    }
  }
  
  private async calculateHealthScore(relationship: EntityRelationship): Promise<number> {
    let score = 1.0;
    
    // Age factor - relationships get stale over time without activity
    const daysSinceCreated = this.daysSince(relationship.createdAt);
    const daysSinceUpdated = this.daysSince(relationship.updatedAt);
    
    if (daysSinceUpdated > 90) {
      score *= 0.7; // Penalize old relationships
    }
    
    // Activity factor - relationships should have recent interactions
    const recentActivity = await this.getRelationshipActivity(relationship);
    if (recentActivity.interactions === 0) {
      score *= 0.5;
    }
    
    // Data completeness factor - relationships should have rich metadata
    const metadataCompleteness = this.calculateMetadataCompleteness(relationship);
    score *= metadataCompleteness;
    
    // Business relevance factor - some relationships are more critical
    const businessRelevance = this.calculateBusinessRelevance(relationship);
    score *= businessRelevance;
    
    // Performance factor - track if relationship delivers expected results
    const performanceScore = await this.calculatePerformanceScore(relationship);
    score *= performanceScore;
    
    return Math.max(0, Math.min(1, score));
  }
  
  private async suggestImprovementActions(relationship: EntityRelationship): Promise<void> {
    const suggestions: RelationshipSuggestion[] = [];
    
    // Analyze what's wrong and suggest fixes
    if (this.isDataIncomplete(relationship)) {
      suggestions.push({
        type: "update_metadata",
        description: "Add missing relationship information",
        priority: "medium",
        estimatedImpact: "Improve relationship tracking and decision making"
      });
    }
    
    if (await this.hasLowActivity(relationship)) {
      suggestions.push({
        type: "increase_interaction", 
        description: "Schedule regular check-ins or interactions",
        priority: "high",
        estimatedImpact: "Strengthen business relationship"
      });
    }
    
    if (await this.hasPerformanceIssues(relationship)) {
      suggestions.push({
        type: "address_performance",
        description: "Review and address performance concerns", 
        priority: "high",
        estimatedImpact: "Improve business outcomes"
      });
    }
    
    // Store suggestions for user review
    await this.storeRelationshipSuggestions(relationship.id, suggestions);
  }
}
```

---

## 🛠️ **Implementation Phases**

### **Phase 1: Foundation (Week 1) - Database & Core Services**

#### **Days 1-2: Database Models**
**Tasks:**
1. Add EntityRelationship model to Prisma schema
2. Add RelationshipType model to Prisma schema  
3. Add EntitySKU model to Prisma schema
4. Add SKUTemplate model to Prisma schema
5. Create database migration
6. Add indexes and foreign keys
7. Seed relationship types and SKU templates

**Files to Create/Modify:**
- `/prisma/schema.prisma` - Add new models
- `/prisma/migrations/` - New migration file
- `/prisma/seeds/` - Seed relationship types and templates

**Database Migration Script:**
```sql
-- Add these to the Prisma schema and generate migration
-- EntityRelationship model (see detailed schema above)
-- RelationshipType model  
-- EntitySKU model
-- SKUTemplate model
```

**Seed Data:**
```typescript
// Seed essential relationship types
const relationshipTypes = [
  {
    name: "preferred_supplier",
    displayName: "Preferred Supplier", 
    description: "Primary supplier for products",
    sourceTypes: ["Contact"],
    targetTypes: ["Product"],
    isSymmetric: false
  },
  {
    name: "planned_production",
    displayName: "Planned Production",
    description: "Production scheduled for shift",
    sourceTypes: ["StaffShift"], 
    targetTypes: ["WorkOrder"],
    isSymmetric: false
  }
  // ... more relationship types
];

// Seed SKU templates
const skuTemplates = [
  {
    name: "Product Enhanced",
    entityType: "Product",
    template: "{format}-{supplier}-{category}-{extras}",
    isDefault: true
  }
  // ... more templates
];
```

#### **Days 3-4: Core Backend Services**

**EntityRelationshipService** (`/src/relationships/entity-relationship.service.ts`):
```typescript
@Injectable()
export class EntityRelationshipService {
  constructor(private prisma: PrismaService) {}
  
  async createRelationship(data: CreateEntityRelationshipDto): Promise<EntityRelationship> {
    // Validate relationship type compatibility
    // Check for duplicates
    // Create bidirectional if needed
    // Return created relationship
  }
  
  async getEntityRelationships(
    entityType: string, 
    entityId: string,
    filters?: RelationshipFilters
  ): Promise<EntityRelationship[]> {
    // Get all relationships for an entity
    // Support filtering by type, strength, status
    // Include related entity data
  }
  
  async findRelatedEntities(
    entityType: string,
    entityId: string, 
    targetType?: string,
    relationshipType?: string
  ): Promise<RelatedEntity[]> {
    // Find entities related to the given entity
    // Support filtering by target type and relationship type
  }
  
  async updateRelationship(
    id: string, 
    data: UpdateEntityRelationshipDto
  ): Promise<EntityRelationship> {
    // Update relationship metadata, strength, etc.
  }
  
  async deleteRelationship(id: string): Promise<void> {
    // Soft delete relationship
  }
  
  async calculateRelationshipStrength(
    sourceId: string, 
    targetId: string
  ): Promise<number> {
    // Calculate strength based on interactions, mentions, etc.
  }
}
```

**UniversalSKUService** (`/src/sku/universal-sku.service.ts`):
```typescript
@Injectable() 
export class UniversalSKUService {
  constructor(
    private prisma: PrismaService,
    private relationshipService: EntityRelationshipService
  ) {}
  
  async generateSKU(
    entityType: string,
    entityId: string, 
    templateId?: string
  ): Promise<string> {
    // Get entity data with relationships
    // Get appropriate template
    // Resolve all components  
    // Generate and validate SKU
    // Save SKU record
  }
  
  async regenerateSKU(entityType: string, entityId: string): Promise<string> {
    // Regenerate SKU with current data
  }
  
  async updateSKU(
    entityType: string,
    entityId: string, 
    newSKU: string
  ): Promise<void> {
    // Manually update SKU
  }
  
  async getAvailableTemplates(entityType: string): Promise<SKUTemplate[]> {
    // Get templates for entity type
  }
  
  async createTemplate(data: CreateSKUTemplateDto): Promise<SKUTemplate> {
    // Create new SKU template
  }
}
```

#### **Days 5-7: API Endpoints**

**EntityRelationshipController** (`/src/relationships/entity-relationship.controller.ts`):
```typescript
@Controller('relationships')
export class EntityRelationshipController {
  
  @Post()
  async createRelationship(@Body() data: CreateEntityRelationshipDto) {
    // POST /relationships - Create new relationship
  }
  
  @Get('/entity/:entityType/:entityId')
  async getEntityRelationships(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query() filters: RelationshipFiltersDto
  ) {
    // GET /relationships/entity/Product/123 - Get all relationships for entity
  }
  
  @Get('/related/:entityType/:entityId')
  async getRelatedEntities(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query('targetType') targetType?: string
  ) {
    // GET /relationships/related/Product/123?targetType=Contact - Get related entities
  }
  
  @Put(':id')
  async updateRelationship(
    @Param('id') id: string,
    @Body() data: UpdateEntityRelationshipDto
  ) {
    // PUT /relationships/123 - Update relationship
  }
  
  @Delete(':id')
  async deleteRelationship(@Param('id') id: string) {
    // DELETE /relationships/123 - Delete relationship
  }
}
```

**SKUController** (`/src/sku/sku.controller.ts`):
```typescript
@Controller('sku')
export class SKUController {
  
  @Post('/generate/:entityType/:entityId')
  async generateSKU(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query('templateId') templateId?: string
  ) {
    // POST /sku/generate/Product/123 - Generate SKU
  }
  
  @Get('/templates/:entityType')
  async getTemplates(@Param('entityType') entityType: string) {
    // GET /sku/templates/Product - Get available templates
  }
  
  @Post('/templates')
  async createTemplate(@Body() data: CreateSKUTemplateDto) {
    // POST /sku/templates - Create SKU template
  }
}
```

### **Phase 2: Priority Relationships (Week 2) - Business Logic**

#### **Days 1-2: Contacts ↔ Products Relationships**

**Supplier Detection Service** (`/src/relationships/detectors/supplier-detector.service.ts`):
```typescript
@Injectable()
export class SupplierDetectorService {
  
  @Cron('0 2 * * 0') // Run weekly on Sunday at 2 AM
  async detectSupplierRelationships(): Promise<void> {
    // Analyze purchase history
    // Identify supplier patterns
    // Create supplier relationships
    // Generate performance reports
  }
  
  async analyzeSupplierPerformance(
    supplierId: string, 
    productId?: string
  ): Promise<SupplierPerformance> {
    // Calculate delivery reliability
    // Assess quality metrics
    // Compare pricing trends
    // Generate performance score
  }
}
```

**Files to Create:**
- `/src/relationships/detectors/` - Auto-detection services
- `/src/relationships/dto/` - DTOs for relationship operations
- `/src/relationships/types/` - TypeScript types and interfaces

#### **Days 3-4: Shifts ↔ Production Orders** 

**Production Optimizer Service** (`/src/relationships/optimizers/production-optimizer.service.ts`):
```typescript
@Injectable()
export class ProductionOptimizerService {
  
  @Cron('0 6 * * *') // Run daily at 6 AM  
  async optimizeShiftProduction(): Promise<void> {
    // Get upcoming shifts and pending orders
    // Run optimization algorithm
    // Create production relationships
    // Send notifications to staff
  }
  
  async calculateOptimalAssignments(
    shifts: StaffShift[],
    orders: WorkOrder[]
  ): Promise<Assignment[]> {
    // Multi-constraint optimization
    // Consider skills, equipment, priorities
    // Return optimal assignments
  }
}
```

#### **Days 5-7: Products ↔ Budgets**

**Budget Allocation Service** (`/src/relationships/allocators/budget-allocator.service.ts`):
```typescript
@Injectable()
export class BudgetAllocatorService {
  
  async allocateBudgetToProduct(
    budgetId: string,
    productId: string, 
    amount: number,
    purpose: string
  ): Promise<EntityRelationship> {
    // Create budget allocation relationship
    // Track spending against allocation
    // Calculate ROI metrics
  }
  
  async calculateProductROI(productId: string): Promise<ROIAnalysis> {
    // Sum all budget allocations for product
    // Calculate returns (sales, etc.)
    // Compute ROI percentage
    // Generate trend analysis
  }
}
```

### **Phase 3: Frontend Components (Week 3) - User Interface**

#### **Days 1-2: @ Mention System**

**Universal Mention Component** (`/src/components/common/UniversalMention.tsx`):
```typescript
interface UniversalMentionProps {
  value: string;
  onChange: (value: string) => void;
  onMention?: (entity: MentionedEntity) => void;
  placeholder?: string;
  entityTypes?: string[]; // Filter which entity types to show
}

export function UniversalMention({
  value,
  onChange, 
  onMention,
  placeholder = "Type @ to mention entities...",
  entityTypes = [] // Empty = all types
}: UniversalMentionProps) {
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionableEntities, setMentionableEntities] = useState<GroupedEntities>({});
  
  // Handle @ trigger and search
  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    
    // Detect @ mention trigger
    const mentionMatch = newValue.match(/@(\w*)$/);
    if (mentionMatch) {
      setSearchQuery(mentionMatch[1]);
      setShowDropdown(true);
      loadMentionableEntities(mentionMatch[1]);
    } else {
      setShowDropdown(false);
    }
  };
  
  const loadMentionableEntities = async (query: string) => {
    const entities = await mentionService.searchEntities(query, entityTypes);
    setMentionableEntities(entities);
  };
  
  const selectEntity = (entity: MentionedEntity) => {
    // Replace @query with @entity
    const newValue = value.replace(/@\w*$/, `@${entity.displayName} `);
    onChange(newValue);
    setShowDropdown(false);
    
    // Trigger mention callback
    onMention?.(entity);
  };
  
  return (
    <div className="universal-mention">
      <textarea
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={placeholder}
        className="mention-input"
        onKeyDown={handleKeyNavigation}
      />
      
      {showDropdown && (
        <MentionDropdown 
          entities={mentionableEntities}
          selectedIndex={selectedIndex}
          onSelect={selectEntity}
          onClose={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
```

**Mention Dropdown Component** (`/src/components/common/MentionDropdown.tsx`):
```typescript
interface MentionDropdownProps {
  entities: GroupedEntities;
  selectedIndex: number;
  onSelect: (entity: MentionedEntity) => void;
  onClose: () => void;
}

export function MentionDropdown({ 
  entities, 
  selectedIndex, 
  onSelect, 
  onClose 
}: MentionDropdownProps) {
  
  const flatEntities = useMemo(() => {
    const flat: MentionedEntity[] = [];
    Object.entries(entities).forEach(([type, entityList]) => {
      flat.push(...entityList);
    });
    return flat;
  }, [entities]);
  
  return (
    <div className="mention-dropdown">
      {Object.entries(entities).map(([entityType, entityList]) => (
        <div key={entityType} className="entity-group">
          <div className="entity-type-header">
            {entityType} ({entityList.length})
          </div>
          
          {entityList.map((entity, index) => (
            <div
              key={entity.id}
              className={`entity-item ${selectedIndex === index ? 'selected' : ''}`}
              onClick={() => onSelect(entity)}
            >
              <div className="entity-icon">{entity.icon}</div>
              <div className="entity-info">
                <div className="entity-name">{entity.displayName}</div>
                <div className="entity-details">{entity.details}</div>
              </div>
            </div>
          ))}
        </div>
      ))}
      
      {flatEntities.length === 0 && (
        <div className="no-results">
          No entities found. Try a different search term.
        </div>
      )}
    </div>
  );
}
```

#### **Days 3-4: Relationship Management UI**

**Entity Relationship Manager** (`/src/components/relationships/EntityRelationshipManager.tsx`):
```typescript
interface EntityRelationshipManagerProps {
  entityType: string;
  entityId: string;
  allowedRelationshipTypes?: string[];
  onRelationshipChange?: () => void;
}

export function EntityRelationshipManager({
  entityType,
  entityId, 
  allowedRelationshipTypes,
  onRelationshipChange
}: EntityRelationshipManagerProps) {
  
  const [relationships, setRelationships] = useState<EntityRelationship[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<EntityRelationship | null>(null);
  
  return (
    <div className="entity-relationship-manager">
      <div className="relationships-header">
        <h3>Connected Entities</h3>
        <button onClick={() => setShowCreateModal(true)}>
          + Add Relationship
        </button>
      </div>
      
      <div className="relationships-list">
        {relationships.map(relationship => (
          <RelationshipCard
            key={relationship.id}
            relationship={relationship}
            onEdit={() => setEditingRelationship(relationship)}
            onDelete={() => handleDeleteRelationship(relationship.id)}
          />
        ))}
      </div>
      
      {showCreateModal && (
        <CreateRelationshipModal
          sourceEntityType={entityType}
          sourceEntityId={entityId}
          allowedTypes={allowedRelationshipTypes}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleRelationshipCreated}
        />
      )}
      
      {editingRelationship && (
        <EditRelationshipModal
          relationship={editingRelationship}
          onClose={() => setEditingRelationship(null)}
          onSuccess={handleRelationshipUpdated}
        />
      )}
    </div>
  );
}
```

#### **Days 5-7: Dashboard Components**

**Project Relationship Dashboard** (`/src/components/dashboards/ProjectRelationshipDashboard.tsx`):
```typescript
interface ProjectRelationshipDashboardProps {
  projectId: string;
}

export function ProjectRelationshipDashboard({ projectId }: ProjectRelationshipDashboardProps) {
  const [relationshipData, setRelationshipData] = useState<ProjectRelationshipData | null>(null);
  
  return (
    <div className="project-relationship-dashboard">
      <div className="dashboard-header">
        <h1>Project Relationships</h1>
        <ProjectActions projectId={projectId} />
      </div>
      
      <div className="dashboard-grid">
        <div className="relationship-graph-section">
          <RelationshipGraph 
            centerEntity={{ type: "Project", id: projectId }}
            depth={2}
          />
        </div>
        
        <div className="connected-entities-section">
          <ConnectedEntitiesPanel projectId={projectId} />
        </div>
        
        <div className="analytics-section">
          <RelationshipAnalytics projectId={projectId} />
        </div>
        
        <div className="quick-actions-section">
          <QuickActions projectId={projectId} />
        </div>
      </div>
    </div>
  );
}
```

**Budget Connection Dashboard** (`/src/components/dashboards/BudgetConnectionDashboard.tsx`):
```typescript
export function BudgetConnectionDashboard({ budgetId }: BudgetConnectionDashboardProps) {
  return (
    <div className="budget-connection-dashboard">
      <div className="allocation-map-section">
        <BudgetAllocationMap budgetId={budgetId} />
      </div>
      
      <div className="roi-analysis-section">
        <ROIAnalysis budgetId={budgetId} />
      </div>
      
      <div className="financial-flow-section">
        <FinancialFlowDiagram budgetId={budgetId} />
      </div>
    </div>
  );
}
```

---

## 📈 **Success Metrics & KPIs**

### **Technical Metrics**
- **Relationship Creation Rate**: Target 50+ new relationships per week
- **@ Mention Usage**: Target 80% of text inputs use mentions
- **SKU Generation Success**: Target 95% successful auto-generation
- **Query Performance**: Relationship queries < 200ms average
- **System Reliability**: 99.9% uptime for relationship services

### **Business Metrics**
- **Supplier Performance**: 20% improvement in on-time delivery rates
- **Production Efficiency**: 15% increase in shift utilization
- **Budget Optimization**: 25% better ROI on product investments
- **Decision Making Speed**: 40% faster vendor/product selection
- **Data Connectivity**: 90% of entities have at least 3 relationships

### **User Adoption Metrics**
- **Feature Usage**: 75% of users actively use @ mentions
- **Relationship Management**: 60% of users create custom relationships
- **Dashboard Engagement**: Average 10+ minutes per session
- **Error Reduction**: 50% fewer manual data entry errors
- **User Satisfaction**: 4.5+ stars on relationship features

---

## 🔮 **Future Enhancement Roadmap**

### **Phase 4: Advanced Intelligence (Month 2)**
- **Relationship Prediction**: AI suggests likely future relationships
- **Anomaly Detection**: Identify unusual relationship patterns
- **Network Analysis**: Advanced graph analytics and centrality measures
- **Performance Forecasting**: Predict relationship outcomes

### **Phase 5: Integration Expansion (Month 3)**  
- **External System Integration**: Connect to accounting, CRM, ERP systems
- **API Ecosystem**: Public APIs for third-party integrations
- **Bulk Operations**: Import/export relationship data
- **Advanced Reporting**: Custom relationship reports and analytics

### **Phase 6: AI-Powered Features (Month 4)**
- **Natural Language Queries**: "Show me all suppliers for coffee products"
- **Smart Notifications**: Proactive alerts based on relationship health
- **Automated Optimization**: Continuous improvement of assignments
- **Predictive Analytics**: Forecast business outcomes from relationships

---

## 🚀 **Getting Started Checklist**

### **Before Implementation**
- [ ] Review current database structure and plan migration strategy
- [ ] Identify key stakeholders and gather requirements
- [ ] Set up development/testing environment
- [ ] Plan user training and change management

### **Phase 1 Kickoff**
- [ ] Create feature branch for relationship system
- [ ] Set up database models and run migrations
- [ ] Implement core backend services
- [ ] Create API endpoints and test with Postman
- [ ] Set up basic frontend components

### **Quality Assurance**
- [ ] Unit tests for all relationship services (target 90% coverage)
- [ ] Integration tests for API endpoints
- [ ] Performance tests for relationship queries
- [ ] User acceptance testing for @ mention system
- [ ] Security review of relationship permissions

### **Production Deployment**
- [ ] Database migration in production environment
- [ ] Feature flag deployment for gradual rollout
- [ ] Monitor system performance and error rates
- [ ] Gather user feedback and iterate
- [ ] Full feature activation after validation

---

This comprehensive guide provides everything needed to transform Muralla into a truly interconnected business management platform. The system will enable organic relationship creation through @ mentions, intelligent business insights through auto-detection, and powerful visualization through relationship-centric dashboards.