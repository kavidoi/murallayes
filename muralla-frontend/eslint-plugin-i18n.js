/**
 * 🌐 ESLint Plugin for i18n Translation Validation
 * 
 * Custom ESLint rules to catch common i18n issues during development
 */

import fs from 'fs';
import path from 'path';

// Cache for translation keys to avoid reading i18n.ts multiple times
let cachedTranslationKeys = null;
let lastModified = null;

function getTranslationKeys() {
  const i18nFilePath = path.resolve('./src/i18n.ts');
  
  try {
    const stats = fs.statSync(i18nFilePath);
    
    // Check if we need to refresh the cache
    if (!cachedTranslationKeys || lastModified !== stats.mtime.getTime()) {
      const content = fs.readFileSync(i18nFilePath, 'utf8');
      cachedTranslationKeys = extractKeysFromContent(content);
      lastModified = stats.mtime.getTime();
    }
    
    return cachedTranslationKeys;
  } catch (error) {
    return new Set();
  }
}

function extractKeysFromContent(content) {
  const keys = new Set();
  
  // Extract keys using regex (simplified approach)
  const esMatch = content.match(/es:\s*\{[\s\S]*?translation:\s*\{([\s\S]*?)\}\s*\}/);
  if (!esMatch) return keys;
  
  const translationContent = esMatch[1];
  extractKeysRecursively(translationContent, '', keys);
  
  return keys;
}

function extractKeysRecursively(content, prefix, keys) {
  // Simple key extraction
  const keyRegex = /(\w+):\s*['\"`]/g;
  let match;
  
  while ((match = keyRegex.exec(content)) !== null) {
    const key = match[1];
    const fullKey = prefix ? `${prefix}.${key}` : key;
    keys.add(fullKey);
  }
  
  // Handle nested objects
  const nestedRegex = /(\w+):\s*\{/g;
  while ((match = nestedRegex.exec(content)) !== null) {
    const key = match[1];
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    // Find matching brace (simplified)
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
      extractKeysRecursively(nestedContent, fullKey, keys);
    }
  }
}

const rules = {
  'no-missing-translation-keys': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Disallow usage of translation keys that do not exist in i18n.ts',
        category: 'Possible Errors'
      },
      fixable: null,
      schema: []
    },
    create(context) {
      const availableKeys = getTranslationKeys();
      
      return {
        CallExpression(node) {
          // Check for t('key') calls
          if (
            node.callee.type === 'Identifier' && 
            node.callee.name === 't' &&
            node.arguments.length > 0 &&
            node.arguments[0].type === 'Literal' &&
            typeof node.arguments[0].value === 'string'
          ) {
            const key = node.arguments[0].value;
            
            if (!availableKeys.has(key)) {
              context.report({
                node: node.arguments[0],
                message: `Translation key "${key}" not found in i18n.ts. Add it to prevent displaying raw keys to users.`
              });
            }
          }
        }
      };
    }
  },
  
  'no-hardcoded-translations': {
    meta: {
      type: 'suggestion',
      docs: {
        description: 'Discourage hardcoded Spanish text in JSX that should be translated',
        category: 'Best Practices'
      },
      fixable: null,
      schema: []
    },
    create(context) {
      // Common Spanish words/phrases that shouldn't be hardcoded
      const spanishPatterns = [
        /\b(guardar|cancelar|eliminar|editar|crear|buscar|filtrar)\b/i,
        /\b(nombre|descripción|fecha|estado|usuario|proyecto)\b/i,
        /\b(configuración|ajustes|perfil|cuenta|sesión)\b/i,
        /\b(empresa|empleado|cliente|proveedor|producto)\b/i
      ];
      
      return {
        JSXText(node) {
          const text = node.value.trim();
          if (text.length > 2) {
            spanishPatterns.forEach(pattern => {
              if (pattern.test(text)) {
                context.report({
                  node,
                  message: `Hardcoded Spanish text "${text}" should use translation key instead. Use t('appropriate.key').`
                });
              }
            });
          }
        },
        
        Literal(node) {
          // Check string literals in JSX attributes
          if (
            node.parent.type === 'JSXExpressionContainer' &&
            typeof node.value === 'string' &&
            node.value.length > 2
          ) {
            spanishPatterns.forEach(pattern => {
              if (pattern.test(node.value)) {
                context.report({
                  node,
                  message: `Hardcoded Spanish text "${node.value}" should use translation key instead. Use t('appropriate.key').`
                });
              }
            });
          }
        }
      };
    }
  },
  
  'require-translation-comment': {
    meta: {
      type: 'suggestion',
      docs: {
        description: 'Require comment for translation keys to improve maintainability',
        category: 'Best Practices'
      },
      fixable: null,
      schema: []
    },
    create(context) {
      const sourceCode = context.getSourceCode();
      
      return {
        CallExpression(node) {
          if (
            node.callee.type === 'Identifier' && 
            node.callee.name === 't' &&
            node.arguments.length > 0 &&
            node.arguments[0].type === 'Literal'
          ) {
            const comments = sourceCode.getCommentsBefore(node);
            const key = node.arguments[0].value;
            
            // Skip common/simple keys
            if (key && key.includes('.') && key.length > 10) {
              const hasRelevantComment = comments.some(comment => 
                comment.value.toLowerCase().includes('translation') ||
                comment.value.includes(key) ||
                comment.value.toLowerCase().includes('i18n')
              );
              
              if (!hasRelevantComment) {
                context.report({
                  node,
                  message: `Complex translation key "${key}" should have a comment explaining its context. Add // Translation: [explanation]`
                });
              }
            }
          }
        }
      };
    }
  }
};

export default {
  rules
};