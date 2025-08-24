# 🤖 Claude Code Assistant Guide

## 📝 Project Context
This is the **muralla-frontend** React application with internationalization (i18n) using react-i18next. The main language is Spanish (ES).

## ⚡ Quick Commands

### Development
```bash
npm run dev                    # Start development server
npm run build                 # Production build with type checking
npm run build:fast           # Fast production build (no type check)
npm run lint                  # Run ESLint
```

### i18n Management
```bash
npm run validate-translations  # Check for missing translation keys
npm run i18n:check            # Alias for validate-translations  
npm run i18n:fix              # Validate + lint i18n specific rules
npm run lint:i18n             # Run ESLint with i18n rules
```

### Pre-commit Hooks
```bash
npm run precommit             # Lint + validate translations
npm run pre-push              # Translation validation before push
```

## 🌐 i18n System Overview

### Core Issue Solved
**Problem**: Translation keys showing as raw text (e.g., `gastos.subtitle` instead of "Gestión integral de gastos")

**Root Cause**: Missing translation keys in `src/i18n.ts`

**Solution**: Comprehensive workflow + automated validation + developer tools

### Key Files
- **`src/i18n.ts`** - Main translation file (476+ keys)
- **`scripts/validate-translations.js`** - Automated key validation
- **`eslint-plugin-i18n.js`** - Custom ESLint rules for i18n
- **`docs/i18n-workflow.md`** - Developer workflow guide
- **`docs/i18n-best-practices.md`** - Team best practices
- **`docs/i18n-templates.md`** - Templates and quick reference

## 🔧 i18n Configuration

### Translation Structure
```typescript
export default {
  es: {
    translation: {
      common: { /* Shared UI elements */ },
      nav: { /* Navigation items */ },
      pages: { /* Page-specific content */ },
      forms: { /* Form elements */ },
      finance: { gastos: { /* Finance module */ } },
      projects: { /* Projects module */ },
      people: { /* People module */ },
      knowledge: { /* Knowledge module */ }
    }
  }
};
```

### React Integration
```typescript
// Component usage
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('module.key')}</h1>;
}
```

### Configuration Settings
```typescript
// src/i18n.ts settings
{
  lng: 'es',
  fallbackLng: 'es', 
  react: { useSuspense: false }  // Prevents loading timing issues
}
```

## 🚨 Common Issues & Solutions

### Issue 1: Raw Translation Keys Displayed
**Symptoms**: Seeing `gastos.subtitle` instead of actual Spanish text
**Cause**: Missing key in `src/i18n.ts`
**Fix**: 
```bash
# 1. Check if key exists
grep -r "gastos.subtitle" src/i18n.ts

# 2. Add missing key to i18n.ts
gastos: {
  subtitle: 'Gestión integral de gastos'
}

# 3. Verify with validation
npm run validate-translations
```

### Issue 2: Component Loading Before Translations
**Symptoms**: Brief flash of raw keys before proper text loads
**Cause**: React Suspense timing
**Fix**: Already configured with `useSuspense: false`

### Issue 3: Large Number of Missing Keys
**Symptoms**: Validation script shows 200+ missing keys
**Solution**: Systematic approach using validation script output

## 🛠️ Development Workflow

### Before Coding (CRITICAL)
```bash
# 1. Plan your translation keys
echo "myModule.title, myModule.form.field" > keys-plan.txt

# 2. Add keys to src/i18n.ts FIRST
# 3. THEN create component
# 4. Test immediately
```

### During Development
```typescript
// ✅ CORRECT: Key-first approach
// 1. Add to i18n.ts:
myModule: { title: 'Mi Título' }

// 2. Then use in component:
const { t } = useTranslation();
return <h1>{t('myModule.title')}</h1>;
```

### After Development
```bash
# Always run before committing
npm run validate-translations
npm run lint:i18n
```

## 📋 Code Review Checklist

### For New Components
- [ ] All text uses translation keys (no hardcoded Spanish)
- [ ] Keys follow naming convention (`module.section.key`)
- [ ] Keys exist in `src/i18n.ts`
- [ ] Validation script passes
- [ ] No raw keys visible in browser

### For Translation Keys
- [ ] Semantic naming (describes purpose, not appearance)  
- [ ] Proper hierarchy (`finance.gastos.form.submit`)
- [ ] Grammatically correct Spanish
- [ ] Appropriate length for UI layouts

## 🎯 VS Code Integration

### Settings Applied
- ESLint validation for TypeScript/React files
- Auto-fix on save for ESLint issues
- i18n-ally plugin configuration (if installed)
- Custom TODO highlighting for TRANSLATION comments

### Code Snippets Available
- `i18n-comp` - Basic component template
- `t-key` - Translation key usage
- `i18n-field` - Form field with i18n
- `i18n-button` - Button with translation
- `i18n-todo` - TODO comment for missing translations

## 🔍 Debugging Strategies

### Translation Not Showing
1. **Check key exists**: `grep -r "your.key" src/i18n.ts`
2. **Check component setup**:
   ```typescript
   import { useTranslation } from 'react-i18next';
   const { t } = useTranslation();
   ```
3. **Check key syntax**: `{t('module.key')}` (not `{t(module.key)}`)
4. **Run validation**: `npm run validate-translations`

### Performance Issues
- i18n loading time should be <200ms
- Use browser dev tools to check network requests
- Verify React component mounting order

## 📊 Automated Tools

### Validation Script (`scripts/validate-translations.js`)
- **Scans**: All `.ts`, `.tsx`, `.js`, `.jsx` files in `src/`
- **Detects**: Missing keys, unused keys, total coverage
- **Reports**: Detailed file/line locations
- **Generates**: Quick-fix suggestions

### ESLint Rules (`eslint-plugin-i18n.js`)
- **`no-missing-translation-keys`**: Catches missing keys at lint time  
- **`no-hardcoded-translations`**: Warns about hardcoded Spanish text
- **`require-translation-comment`**: Suggests comments for complex keys

## 📈 Success Metrics
- **Zero raw translation keys in production**
- **476+ available translation keys** (growing)
- **330+ translation key usages** tracked
- **Automated validation in CI/CD pipeline**

## 🚀 Next Steps for Development

### Immediate Priorities  
1. **Fix Missing Keys**: Run validation script and systematically add missing keys
2. **Team Training**: Review workflow documentation with all developers
3. **CI/CD Integration**: Add translation validation to build pipeline

### Long-term Goals
1. **Multi-language Support**: Extend to English translations
2. **Advanced Validation**: Context-aware key suggestions
3. **Performance Optimization**: Lazy loading for large translation files

## 💡 Claude Assistant Tips

### When Adding Features
1. Always run `npm run validate-translations` first to understand current state
2. Check existing patterns: `grep -r "similar-concept" src/i18n.ts`  
3. Use templates from `docs/i18n-templates.md`
4. Test immediately after adding keys

### When Debugging i18n Issues
1. Start with validation script output
2. Check browser console for i18n errors
3. Verify key existence and spelling
4. Test component in isolation

### When Creating Documentation
1. Reference existing workflow documents
2. Include practical examples
3. Update this CLAUDE.md file with new patterns
4. Keep developer experience in mind

---

*This guide is maintained by the development team and updated with each major i18n system change.*