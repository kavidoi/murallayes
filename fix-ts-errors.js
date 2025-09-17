#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Common TypeScript error fixes
const fixes = [
  // Fix unused variables by prefixing with underscore
  {
    pattern: /(\w+),\s*index\)/g,
    replacement: '$1, _index)'
  },
  {
    pattern: /(\w+),\s*colIndex\)/g,
    replacement: '$1, _colIndex)'
  },
  // Fix unused imports
  {
    pattern: /import.*useEffect.*from 'react'/g,
    replacement: (match) => match.includes('useState') ? match : match.replace('useEffect, ', '').replace(', useEffect', '')
  },
  // Fix unused variables in destructuring
  {
    pattern: /const \{ ([^}]*), t \}/g,
    replacement: 'const { $1 }'
  },
  {
    pattern: /const \{ ([^}]*), currentUser \}/g,
    replacement: 'const { $1 }'
  }
];

// Files to fix (most critical ones first)
const filesToFix = [
  'src/components/common/ConflictResolutionModal.tsx',
  'src/components/common/ExcelImporter.tsx',
  'src/components/common/PresenceIndicator.tsx',
  'src/components/common/ProductEditModal.tsx',
  'src/components/modules/agenda/CalendarHub.tsx',
  'src/components/modules/cashier/VirtualProductGrid.tsx',
  'src/components/modules/crm/AddContact.tsx',
  'src/components/modules/crm/Contactos.tsx',
  'src/components/modules/crm/ContactProfile.tsx',
  'src/components/modules/crm/CRMHub.tsx'
];

function fixFile(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`Skipping ${filePath} - file not found`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // Apply fixes
    fixes.forEach(fix => {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });

    // Specific fixes for common patterns
    content = content
      .replace(/const \{ ([^}]*), t \} = useTranslation/g, 'const { $1 } = useTranslation')
      .replace(/const \{ ([^}]*), currentUser \} = /g, 'const { $1 } = ')
      .replace(/(\w+), index\)/g, '$1, _index)')
      .replace(/(\w+), colIndex\)/g, '$1, _colIndex)')
      .replace(/, useEffect/g, '')
      .replace(/useEffect, /g, '');

    if (modified) {
      fs.writeFileSync(fullPath, content);
      console.log(`Fixed ${filePath}`);
    }
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

// Fix all files
filesToFix.forEach(fixFile);

console.log('TypeScript error fixes completed');
