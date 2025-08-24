#!/usr/bin/env node
/**
 * 🌐 Translation Key Validator
 * 
 * This script validates that all translation keys used in components
 * actually exist in the i18n translation files.
 * 
 * Usage:
 *   node scripts/validate-translations.js
 *   npm run validate-translations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const CONFIG = {
  srcDir: './src',
  i18nFile: './src/i18n.ts',
  extensions: ['ts', 'tsx', 'js', 'jsx'],
  excludePatterns: ['node_modules', 'dist', 'build', '__tests__', '.test.', '.spec.']
};

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class TranslationValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.translations = {};
    this.usedKeys = new Set();
    this.availableKeys = new Set();
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  error(message) {
    this.errors.push(message);
    this.log(`❌ ${message}`, 'red');
  }

  warning(message) {
    this.warnings.push(message);
    this.log(`⚠️  ${message}`, 'yellow');
  }

  success(message) {
    this.log(`✅ ${message}`, 'green');
  }

  info(message) {
    this.log(`ℹ️  ${message}`, 'blue');
  }

  // Extract translation keys from i18n.ts file
  extractTranslationKeys() {
    try {
      const i18nContent = fs.readFileSync(CONFIG.i18nFile, 'utf8');
      
      // Find the Spanish translation object (more robust parsing)
      const esMatch = i18nContent.match(/es:\s*\{[\s\S]*?translation:\s*\{([\s\S]*?)\}\s*\}/);
      if (!esMatch) {
        this.error('Could not find Spanish translations in i18n.ts');
        return;
      }

      const translationContent = esMatch[1];
      
      // Extract keys recursively
      this.extractKeysFromObject(translationContent, '');
      
      this.info(`Found ${this.availableKeys.size} available translation keys`);
    } catch (error) {
      this.error(`Error reading i18n file: ${error.message}`);
    }
  }

  // Recursively extract keys from nested object string
  extractKeysFromObject(content, prefix) {
    // Simple regex to find key patterns - this is basic but functional
    const keyRegex = /(\w+):\s*['"`]/g;
    let match;
    
    while ((match = keyRegex.exec(content)) !== null) {
      const key = match[1];
      const fullKey = prefix ? `${prefix}.${key}` : key;
      this.availableKeys.add(fullKey);
    }

    // Handle nested objects
    const nestedRegex = /(\w+):\s*\{/g;
    while ((match = nestedRegex.exec(content)) !== null) {
      const key = match[1];
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      // Find the matching closing brace (simplified approach)
      const startPos = match.index;
      let braceCount = 1;
      let pos = startPos + match[0].length;
      
      while (pos < content.length && braceCount > 0) {
        if (content[pos] === '{') braceCount++;
        if (content[pos] === '}') braceCount--;
        pos++;
      }
      
      if (braceCount === 0) {
        const nestedContent = content.substring(match.index + match[0].length, pos - 1);
        this.extractKeysFromObject(nestedContent, fullKey);
      }
    }
  }

  // Find all component files using Node.js built-in recursive directory traversal
  async findComponentFiles() {
    const files = [];
    
    const traverseDirectory = (dir) => {
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          
          if (item.isDirectory()) {
            // Skip excluded directories
            if (CONFIG.excludePatterns.some(pattern => item.name.includes(pattern))) {
              continue;
            }
            traverseDirectory(fullPath);
          } else if (item.isFile()) {
            // Check if file has valid extension
            const ext = path.extname(item.name).slice(1);
            if (CONFIG.extensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        this.warning(`Could not read directory ${dir}: ${error.message}`);
      }
    };
    
    traverseDirectory(CONFIG.srcDir);

    // Filter out excluded patterns
    const filteredFiles = files.filter(file => {
      return !CONFIG.excludePatterns.some(pattern => 
        file.includes(pattern) || file.match(pattern)
      );
    });

    return filteredFiles;
  }

  // Extract translation keys used in a file
  extractUsedKeys(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check if file uses useTranslation
      if (!content.includes('useTranslation') && !content.includes('t(')) {
        return [];
      }

      const keys = [];
      
      // Find t('key') or t("key") patterns
      const tRegex = /\bt\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
      let match;
      
      while ((match = tRegex.exec(content)) !== null) {
        const key = match[1];
        keys.push({
          key,
          line: this.getLineNumber(content, match.index),
          file: filePath
        });
      }

      return keys;
    } catch (error) {
      this.warning(`Could not read file ${filePath}: ${error.message}`);
      return [];
    }
  }

  // Get line number for a character position in string
  getLineNumber(content, position) {
    const lines = content.substring(0, position).split('\n');
    return lines.length;
  }

  // Main validation logic
  async validate() {
    this.log('\n🌐 Translation Key Validator', 'bold');
    this.log('=====================================\n');

    // Step 1: Extract available translation keys
    this.info('Step 1: Extracting available translation keys...');
    this.extractTranslationKeys();

    if (this.errors.length > 0) {
      this.log('\n❌ Cannot proceed due to errors in i18n file', 'red');
      return false;
    }

    // Step 2: Find all component files
    this.info('\nStep 2: Finding component files...');
    const files = await this.findComponentFiles();
    this.info(`Found ${files.length} component files`);

    // Step 3: Extract used keys from all files
    this.info('\nStep 3: Extracting used translation keys...');
    const allUsedKeys = [];
    
    files.forEach(file => {
      const usedKeys = this.extractUsedKeys(file);
      allUsedKeys.push(...usedKeys);
    });

    this.info(`Found ${allUsedKeys.length} translation key usages`);

    // Step 4: Validate keys
    this.info('\nStep 4: Validating translation keys...');
    const missingKeys = [];
    const unusedKeys = new Set([...this.availableKeys]);

    allUsedKeys.forEach(({ key, line, file }) => {
      this.usedKeys.add(key);
      
      if (!this.availableKeys.has(key)) {
        missingKeys.push({ key, line, file });
        this.error(`Missing key: "${key}" at ${file}:${line}`);
      } else {
        unusedKeys.delete(key);
      }
    });

    // Report unused keys
    if (unusedKeys.size > 0) {
      this.warning(`Found ${unusedKeys.size} unused translation keys:`);
      unusedKeys.forEach(key => {
        this.warning(`  Unused: "${key}"`);
      });
    }

    // Summary
    this.log('\n📊 Validation Summary', 'bold');
    this.log('====================');
    
    if (missingKeys.length === 0) {
      this.success(`✅ All ${allUsedKeys.length} translation keys are valid!`);
    } else {
      this.error(`❌ Found ${missingKeys.length} missing translation keys`);
    }

    if (unusedKeys.size > 0) {
      this.warning(`⚠️  Found ${unusedKeys.size} unused translation keys`);
    } else {
      this.success('✅ No unused translation keys');
    }

    this.log(`\n📈 Statistics:`);
    this.log(`  - Available keys: ${this.availableKeys.size}`);
    this.log(`  - Used keys: ${this.usedKeys.size}`);
    this.log(`  - Missing keys: ${missingKeys.length}`);
    this.log(`  - Unused keys: ${unusedKeys.size}`);

    // Return success/failure
    return missingKeys.length === 0;
  }

  // Generate a report of missing keys for easy fixing
  generateFixReport() {
    if (this.errors.length === 0) return;

    this.log('\n🔧 Quick Fix Guide', 'bold');
    this.log('=================');
    this.log('Add these missing keys to src/i18n.ts:\n');

    const missingKeys = this.errors
      .map(error => error.match(/Missing key: "([^"]+)"/))
      .filter(match => match)
      .map(match => match[1]);

    const groupedKeys = {};
    missingKeys.forEach(key => {
      const parts = key.split('.');
      const section = parts[0];
      if (!groupedKeys[section]) groupedKeys[section] = [];
      groupedKeys[section].push(key);
    });

    Object.entries(groupedKeys).forEach(([section, keys]) => {
      this.log(`${section}: {`, 'blue');
      keys.forEach(key => {
        const keyParts = key.split('.');
        const keyName = keyParts[keyParts.length - 1];
        this.log(`  ${keyName}: '${keyName}', // TODO: Add proper translation`, 'blue');
      });
      this.log('},\n', 'blue');
    });
  }
}

// Main execution
async function main() {
  const validator = new TranslationValidator();
  
  try {
    const isValid = await validator.validate();
    
    if (!isValid) {
      validator.generateFixReport();
      process.exit(1);
    }
    
    validator.success('\n🎉 Translation validation passed!');
    process.exit(0);
  } catch (error) {
    validator.error(`Validation failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default TranslationValidator;