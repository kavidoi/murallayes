# 🌐 Internationalization (i18n) Workflow Guide

## 🚨 Problem Statement
Translation keys showing as raw text (e.g., `gastos.subtitle` instead of "Gestión integral de gastos") is a recurring issue that breaks user experience.

## 🎯 Solution: The i18n Workflow

### 1. **BEFORE Writing Code**
- [ ] Plan your translation keys structure
- [ ] Use consistent naming conventions
- [ ] Check existing keys to avoid duplication

### 2. **WHILE Writing Code**
- [ ] Follow the **Key-First Approach**:
  1. Add translation key to `src/i18n.ts` FIRST
  2. THEN use it in your component
  3. Test immediately

### 3. **AFTER Writing Code**
- [ ] Run translation validation script
- [ ] Test with different languages
- [ ] Update this documentation if needed

---

## 📝 Naming Conventions

### Key Structure
```
section.subsection.keyName
```

### Examples
```typescript
// ✅ Good
'gastos.form.createExpense'
'common.actions.save'
'nav.finance.budgets'

// ❌ Bad  
'createExpenseButton'
'save'
'budgetPage'
```

### Standard Sections
- `common.*` - Shared across app (buttons, status, etc.)
- `nav.*` - Navigation items
- `pages.*` - Page-specific content
- `[module].*` - Module-specific (gastos, tasks, etc.)
- `actions.*` - Action buttons and links
- `status.*` - Status labels
- `errors.*` - Error messages
- `forms.*` - Form labels and placeholders

---

## 🔧 Developer Checklist

### Before Creating a Component
```bash
# 1. Check existing translations
grep -r "similar-key" src/i18n.ts

# 2. Plan your keys
# Create a list like:
# - myModule.title
# - myModule.subtitle  
# - myModule.form.fieldName
```

### While Developing
```typescript
// 1. Add to i18n.ts FIRST
export default {
  es: {
    translation: {
      gastos: {
        title: 'Gastos',
        subtitle: 'Gestión de gastos empresariales',
        // ... add all keys here
      }
    }
  }
}

// 2. THEN use in component
const { t } = useTranslation();
return <h1>{t('gastos.title')}</h1>

// 3. Test immediately - if you see the key, it's missing!
```

### After Development
```bash
# Run validation (we'll create this script)
npm run validate-translations

# Test in browser - look for raw keys
```

---

## 🛠️ Tools and Scripts

### 1. Translation Key Validator
```bash
# Will create: scripts/validate-translations.js
npm run validate-translations
```

### 2. ESLint Rule (Coming)
Will warn when using t() with non-existent keys

### 3. Pre-commit Hook
Prevents commits with missing translation keys

---

## 📚 Common Patterns

### Page Header
```typescript
// In i18n.ts
myPage: {
  title: 'Page Title',
  subtitle: 'Page description',
}

// In component
<div>
  <h1>{t('myPage.title')}</h1>
  <p>{t('myPage.subtitle')}</p>
</div>
```

### Form Fields
```typescript
// In i18n.ts
myForm: {
  fields: {
    email: 'Email',
    password: 'Password',
  },
  placeholders: {
    email: 'Enter your email',
    password: 'Enter your password',
  },
  actions: {
    submit: 'Submit',
    cancel: 'Cancel',
  }
}

// In component
<input 
  placeholder={t('myForm.placeholders.email')}
  aria-label={t('myForm.fields.email')}
/>
```

### Status and Actions
```typescript
// In i18n.ts (reuse common ones!)
common: {
  status: {
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
  },
  actions: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
  }
}
```

---

## 🚨 Red Flags - When You're Doing It Wrong

### ❌ Anti-Patterns
```typescript
// Don't do this!
<h1>Gastos</h1> // Hardcoded text
<h1>{t('title')}</h1> // Too generic
<h1>{t('gastos_title')}</h1> // Wrong naming convention
```

### 🔍 Quick Checks
1. **Raw Text Check**: Search for hardcoded Spanish text in JSX
2. **Key Existence**: If browser shows `gastos.title`, key is missing
3. **Consistency**: Similar components should use similar key patterns

---

## 🎓 Training Resources

### New Developer Onboarding
1. Read this document
2. Complete i18n exercise (create a simple component)
3. Review existing patterns in codebase
4. Set up development tools

### Regular Team Review
- Monthly i18n health check
- Review new translation keys
- Update documentation
- Share learnings from issues

---

## 📞 Getting Help

### Quick Fixes
1. Check `src/i18n.ts` for existing similar keys
2. Add missing key following naming convention
3. Test immediately

### Complex Issues
1. Check i18n initialization in `main.tsx`
2. Verify React Suspense settings
3. Debug language detection logic

### Team Communication
- Slack: #i18n-help
- Code Review: Always check translation keys
- Documentation: Keep this file updated

---

## 📊 Success Metrics

### Goals
- Zero raw translation keys in production
- 100% key coverage for new features
- Fast i18n development workflow

### Monitoring
- Automated key validation in CI/CD
- User reports of untranslated text
- Developer experience surveys

---

*Last Updated: $(date)*  
*Maintained by: Frontend Team*