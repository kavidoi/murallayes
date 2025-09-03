import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const skuTemplates = [
  // Product SKU Templates
  {
    name: 'Standard Product SKU',
    description: 'Standard format for finished products with category, supplier, and sequence',
    entityType: 'Product',
    template: '{category}-{supplier}-{format}-{sequence}',
    components: {
      category: {
        type: 'category_code',
        length: 3,
        description: 'Product category abbreviation',
        default: 'GEN',
      },
      supplier: {
        type: 'supplier_code',
        length: 3,
        description: 'Primary supplier abbreviation',
        default: 'GEN',
      },
      format: {
        type: 'entity_field',
        field: 'format',
        description: 'Product format (100=Envasados, 200=Congelados, 300=Frescos)',
        default: '100',
        transform: {
          'ENVASADOS': '100',
          'CONGELADOS': '200',
          'FRESCOS': '300',
        },
      },
      sequence: {
        type: 'sequence',
        length: 3,
        scope: 'category',
        description: 'Sequential number within category',
      },
    },
    isActive: true,
    isDefault: true,
    exampleOutput: 'CAF-SMT-100-001',
    validationRules: {
      minLength: 10,
      maxLength: 15,
      pattern: '^[A-Z]{3}-[A-Z]{3}-[0-9]{3}-[0-9]{3}$',
    },
  },
  {
    name: 'Simple Product SKU',
    description: 'Simplified format for internal products',
    entityType: 'Product',
    template: '{type_prefix}{sequence}',
    components: {
      type_prefix: {
        type: 'entity_field',
        field: 'type',
        description: 'Product type prefix',
        default: 'P',
        transform: {
          'TERMINADO': 'T',
          'INSUMO': 'I',
          'SERVICIO': 'S',
        },
      },
      sequence: {
        type: 'sequence',
        length: 5,
        scope: 'global',
        description: 'Global sequential number',
      },
    },
    isActive: true,
    isDefault: false,
    exampleOutput: 'T00001',
    validationRules: {
      minLength: 6,
      maxLength: 6,
      pattern: '^[TIS][0-9]{5}$',
    },
  },
  {
    name: 'Brand-Supplier Product SKU',
    description: 'Format including brand and supplier information',
    entityType: 'Product',
    template: '{brand}-{supplier}-{category}-{extras}-{sequence}',
    components: {
      brand: {
        type: 'relationship',
        relationshipType: 'brand_of',
        field: 'name',
        length: 3,
        description: 'Brand abbreviation',
        default: 'OWN',
      },
      supplier: {
        type: 'relationship',
        relationshipType: 'supplier',
        field: 'skuAbbreviation',
        length: 3,
        description: 'Supplier code',
        default: 'GEN',
      },
      category: {
        type: 'category_code',
        length: 3,
        description: 'Category code',
        default: 'GEN',
      },
      extras: {
        type: 'entity_field',
        field: 'extras',
        description: 'Product extras (Vegano=8, Sin Azucar=9, etc.)',
        default: '0',
        transform: 'array_to_codes',
      },
      sequence: {
        type: 'sequence',
        length: 2,
        scope: 'brand_category',
        description: 'Sequential within brand-category',
      },
    },
    isActive: true,
    isDefault: false,
    exampleOutput: 'SMT-LUZ-CAF-89-01',
  },

  // Work Order SKU Templates
  {
    name: 'Standard Work Order SKU',
    description: 'Work order identification with date and product',
    entityType: 'WorkOrder',
    template: 'WO-{date}-{product}-{sequence}',
    components: {
      date: {
        type: 'date',
        format: 'YYMMDD',
        description: 'Work order date',
      },
      product: {
        type: 'relationship',
        relationshipType: 'produces',
        field: 'sku',
        length: 8,
        description: 'Product SKU being produced',
        default: 'UNKNOWN',
      },
      sequence: {
        type: 'sequence',
        length: 3,
        scope: 'daily',
        description: 'Daily sequence number',
      },
    },
    isActive: true,
    isDefault: true,
    exampleOutput: 'WO-241201-CAF-SMT-001',
  },

  // Task SKU Templates
  {
    name: 'Project Task SKU',
    description: 'Task identification within projects',
    entityType: 'Task',
    template: '{project_code}-T{sequence}',
    components: {
      project_code: {
        type: 'relationship',
        relationshipType: 'belongs_to',
        field: 'name',
        length: 6,
        description: 'Project code/abbreviation',
        default: 'PROJ',
        transform: 'abbreviate',
      },
      sequence: {
        type: 'sequence',
        length: 4,
        scope: 'project',
        description: 'Sequential within project',
      },
    },
    isActive: true,
    isDefault: true,
    exampleOutput: 'MURALL-T0001',
  },

  // Contact SKU Templates
  {
    name: 'Contact Reference Code',
    description: 'Reference codes for contacts and suppliers',
    entityType: 'Contact',
    template: '{type_prefix}-{sequence}',
    components: {
      type_prefix: {
        type: 'entity_field',
        field: 'type',
        description: 'Contact type prefix',
        default: 'CNT',
        transform: {
          'supplier': 'SUP',
          'customer': 'CUS',
          'brand': 'BRD',
          'important': 'VIP',
        },
      },
      sequence: {
        type: 'sequence',
        length: 4,
        scope: 'type',
        description: 'Sequential within contact type',
      },
    },
    isActive: true,
    isDefault: true,
    exampleOutput: 'SUP-0001',
  },

  // Budget SKU Templates
  {
    name: 'Budget Reference Code',
    description: 'Budget identification with project and period',
    entityType: 'Budget',
    template: 'BGT-{project}-{period}-{category}',
    components: {
      project: {
        type: 'relationship',
        relationshipType: 'belongs_to',
        field: 'name',
        length: 4,
        description: 'Project abbreviation',
        default: 'GEN',
        transform: 'abbreviate',
      },
      period: {
        type: 'date',
        format: 'YYYY',
        description: 'Budget year',
      },
      category: {
        type: 'entity_field',
        field: 'category',
        description: 'Budget category',
        default: 'OPX',
        transform: {
          'OPEX': 'OPX',
          'CAPEX': 'CPX',
          'REVENUE': 'REV',
          'OTHER': 'OTH',
        },
      },
    },
    isActive: true,
    isDefault: true,
    exampleOutput: 'BGT-MUR-2024-OPX',
  },

  // User/Employee SKU Templates
  {
    name: 'Employee Code',
    description: 'Employee identification code',
    entityType: 'User',
    template: 'EMP-{department}-{sequence}',
    components: {
      department: {
        type: 'entity_field',
        field: 'role.name',
        length: 3,
        description: 'Department/Role code',
        default: 'GEN',
        transform: 'abbreviate',
      },
      sequence: {
        type: 'sequence',
        length: 3,
        scope: 'department',
        description: 'Sequential within department',
      },
    },
    isActive: true,
    isDefault: true,
    exampleOutput: 'EMP-ADM-001',
  },
];

export async function seedSKUTemplates() {
  console.log('🏷️  Seeding SKU templates...');

  for (const template of skuTemplates) {
    try {
      await prisma.sKUTemplate.upsert({
        where: { name: template.name },
        update: template,
        create: template,
      });
      console.log(`✅ Created/Updated SKU template: ${template.name}`);
    } catch (error) {
      console.error(`❌ Error seeding SKU template ${template.name}:`, error);
    }
  }

  console.log('🎉 SKU templates seeding completed!');
}

// Run if called directly
if (require.main === module) {
  seedSKUTemplates()
    .then(() => {
      console.log('✨ Seeding finished successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}