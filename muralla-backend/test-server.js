const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data for our Universal Interconnection System
const mockRelationshipTypes = [
  { id: '1', name: 'assigned_to', displayName: 'Assigned To', color: '#059669' },
  { id: '2', name: 'supplier', displayName: 'Supplier', color: '#2563eb' },
  { id: '3', name: 'mentioned_in', displayName: 'Mentioned In', color: '#6b7280' },
  { id: '4', name: 'belongs_to', displayName: 'Belongs To', color: '#dc2626' },
];

const mockRelationships = [
  {
    id: '1',
    relationshipType: 'assigned_to',
    sourceType: 'Task',
    sourceId: 'task-1',
    targetType: 'User',
    targetId: 'user-1',
    strength: 4,
    metadata: { assignmentType: 'primary' },
    tags: ['assignment']
  },
  {
    id: '2',
    relationshipType: 'mentioned_in',
    sourceType: 'Product',
    sourceId: 'product-coffee',
    targetType: 'Task',
    targetId: 'task-1',
    strength: 1,
    metadata: { context: 'task_description' },
    tags: ['mention']
  }
];

const mockEntities = {
  User: [
    { id: 'user-1', name: 'John Doe', subtitle: '@johndoe • Admin' },
    { id: 'user-2', name: 'Jane Smith', subtitle: '@janesmith • Manager' },
  ],
  Product: [
    { id: 'product-coffee', name: 'Colombian Coffee', subtitle: 'Premium blend', sku: 'CAF-COL-100-001' },
    { id: 'product-sugar', name: 'Organic Sugar', subtitle: 'Fair trade', sku: 'SUG-ORG-100-002' },
  ],
  Task: [
    { id: 'task-1', name: 'Review Coffee Inventory', subtitle: 'Inventory Management • High Priority' },
    { id: 'task-2', name: 'Update Product Catalog', subtitle: 'Marketing • Medium Priority' },
  ],
  Project: [
    { id: 'proj-1', name: 'Q4 Product Launch', subtitle: 'Active project' },
    { id: 'proj-2', name: 'Inventory Optimization', subtitle: 'Planning phase' },
  ]
};

// Routes for Universal Interconnection System

// Search entities (for @ mention system)
app.get('/api/search/entities', (req, res) => {
  const { type, query, limit = 10 } = req.query;
  
  console.log(`🔍 Entity search: type=${type}, query=${query}`);
  
  if (!mockEntities[type]) {
    return res.json([]);
  }
  
  const results = mockEntities[type]
    .filter(entity => 
      entity.name.toLowerCase().includes(query.toLowerCase()) ||
      entity.subtitle.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, parseInt(limit));
    
  res.json(results);
});

// Get relationships
app.get('/api/relationships', (req, res) => {
  const { sourceType, sourceId, targetType, relationshipType } = req.query;
  
  console.log(`🔗 Relationship query: ${sourceType}/${sourceId} -> ${targetType} [${relationshipType}]`);
  
  let filtered = mockRelationships;
  
  if (sourceType && sourceId) {
    filtered = filtered.filter(r => r.sourceType === sourceType && r.sourceId === sourceId);
  }
  if (targetType) {
    filtered = filtered.filter(r => r.targetType === targetType);
  }
  if (relationshipType) {
    filtered = filtered.filter(r => r.relationshipType === relationshipType);
  }
  
  res.json({ data: filtered, meta: { total: filtered.length } });
});

// Create relationship
app.post('/api/relationships', (req, res) => {
  const relationship = {
    id: `rel-${Date.now()}`,
    ...req.body,
    createdAt: new Date().toISOString(),
    isActive: true
  };
  
  console.log(`➕ Creating relationship: ${relationship.sourceType} --[${relationship.relationshipType}]--> ${relationship.targetType}`);
  
  mockRelationships.push(relationship);
  res.json(relationship);
});

// Get relationship types
app.get('/api/relationships/types', (req, res) => {
  console.log('📋 Fetching relationship types');
  res.json(mockRelationshipTypes);
});

// SKU Templates
app.get('/api/sku/templates', (req, res) => {
  const { entityType } = req.query;
  console.log(`🏷️ Fetching SKU templates for: ${entityType}`);
  
  const templates = [
    {
      id: 'template-product',
      name: 'Standard Product SKU',
      entityType: 'Product',
      template: '{category}-{supplier}-{format}-{sequence}',
      exampleOutput: 'CAF-SMT-100-001',
      isDefault: true
    },
    {
      id: 'template-task',
      name: 'Project Task SKU',
      entityType: 'Task',
      template: '{project_code}-T{sequence}',
      exampleOutput: 'MURALL-T0001',
      isDefault: true
    }
  ];
  
  const filtered = entityType 
    ? templates.filter(t => t.entityType === entityType)
    : templates;
    
  res.json(filtered);
});

// Generate SKU preview
app.post('/api/sku/preview', (req, res) => {
  const { entityType, entityId } = req.body;
  console.log(`🎯 Generating SKU preview for: ${entityType}/${entityId}`);
  
  const skuMap = {
    Product: `PRD-${Date.now().toString().slice(-4)}`,
    Task: `TSK-${Date.now().toString().slice(-4)}`,
    Project: `PRJ-${Date.now().toString().slice(-4)}`,
  };
  
  res.json({ 
    sku: skuMap[entityType] || `GEN-${Date.now().toString().slice(-4)}`,
    components: { generated: true },
    template: { name: `${entityType} Template` }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Universal Interconnection System Mock Server',
    timestamp: new Date().toISOString(),
    features: {
      relationships: '✅ Active',
      mentions: '✅ Active', 
      sku_generation: '✅ Active',
      search: '✅ Active'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🎉 Universal Interconnection System - Mock Server',
    status: 'Running',
    endpoints: {
      search: '/api/search/entities?type=User&query=john',
      relationships: '/api/relationships?sourceType=Task&sourceId=task-1',
      relationship_types: '/api/relationships/types',
      sku_templates: '/api/sku/templates?entityType=Product',
      health: '/health'
    },
    note: 'This is a mock server demonstrating the Universal Interconnection System API'
  });
});

app.listen(port, () => {
  console.log('');
  console.log('🎉 ========================================');
  console.log('   Universal Interconnection System');
  console.log('   Mock Server - RUNNING!');
  console.log('🎉 ========================================');
  console.log('');
  console.log(`🔗 Backend: http://localhost:${port}`);
  console.log(`🎨 Frontend: http://localhost:5173`);
  console.log('');
  console.log('📋 Available Features:');
  console.log('   ✅ @ Mention System (search entities)');
  console.log('   ✅ Relationship Management (CRUD)');
  console.log('   ✅ SKU Generation (templates)');
  console.log('   ✅ Universal Entity Search');
  console.log('');
  console.log('🧪 Test Endpoints:');
  console.log(`   GET  ${port}/health - Health check`);
  console.log(`   GET  ${port}/api/search/entities?type=User&query=john`);
  console.log(`   GET  ${port}/api/relationships`);
  console.log(`   POST ${port}/api/relationships`);
  console.log('');
  console.log('🚀 Your Universal Interconnection System is LIVE!');
  console.log('');
});