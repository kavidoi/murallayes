# 🌐 i18n Best Practices & Team Guidelines

## 🎯 Core Principles

### 1. **Translation-First Development**
Always add translation keys BEFORE writing components. This prevents the raw key display issue entirely.

```typescript
// ✅ CORRECT: Add to i18n.ts first
const translations = {
  userProfile: {
    title: 'Perfil de Usuario',
    subtitle: 'Gestiona tu información personal'
  }
};

// Then use in component
const { t } = useTranslation();
return <h1>{t('userProfile.title')}</h1>;
```

### 2. **Hierarchical Key Structure**
Use consistent, nested key structures that mirror your component organization.

```typescript
// ✅ GOOD: Clear hierarchy
'finance.gastos.form.submitButton'
'dashboard.overview.totalRevenue'
'common.actions.save'

// ❌ BAD: Flat structure
'submitGastosButton'
'dashboardRevenue'
'saveBtn'
```

### 3. **Semantic Naming**
Keys should describe the purpose/context, not the visual appearance.

```typescript
// ✅ GOOD: Semantic naming
'forms.validation.emailRequired'
'status.processing'
'navigation.backToList'

// ❌ BAD: Visual naming
'redErrorText'
'bigBlueButton'
'leftSidebarItem'
```

---

## 📏 Naming Conventions

### Standard Prefixes
| Prefix | Usage | Example |
|--------|-------|---------|
| `common.*` | Shared across app | `common.actions.save` |
| `nav.*` | Navigation items | `nav.dashboard.title` |
| `pages.*` | Page-specific content | `pages.profile.header` |
| `forms.*` | Form elements | `forms.login.emailLabel` |
| `status.*` | Status indicators | `status.active` |
| `errors.*` | Error messages | `errors.validation.required` |
| `actions.*` | User actions | `actions.delete.confirm` |

### Module-Specific Prefixes
| Module | Prefix | Example |
|--------|--------|---------|
| Finance | `finance.*` | `finance.gastos.createNew` |
| Projects | `projects.*` | `projects.kanban.addTask` |
| People | `people.*` | `people.directory.searchUser` |
| Knowledge | `knowledge.*` | `knowledge.wiki.createArticle` |

---

## 🔄 Development Workflow

### Phase 1: Planning
1. **Design Translation Structure**
   ```typescript
   // Plan your keys before coding
   const plannedKeys = [
     'myModule.title',
     'myModule.subtitle',
     'myModule.form.nameLabel',
     'myModule.form.emailLabel',
     'myModule.actions.submit',
     'myModule.actions.cancel'
   ];
   ```

2. **Check Existing Keys**
   ```bash
   # Search for similar existing keys
   grep -r "similar-concept" src/i18n.ts
   # Use validation script to understand current coverage
   npm run validate-translations
   ```

### Phase 2: Implementation
1. **Add Keys to i18n.ts FIRST**
2. **Use Descriptive Values**
   ```typescript
   // ✅ GOOD: Clear, descriptive translations
   myModule: {
     title: 'Gestión de Usuarios',
     subtitle: 'Administra los usuarios del sistema',
     form: {
       nameLabel: 'Nombre completo',
       emailLabel: 'Correo electrónico'
     }
   }
   ```

3. **Test Immediately**
   - Run the app and verify translations display correctly
   - If you see raw keys like `myModule.title`, the key is missing

### Phase 3: Validation
1. **Run Validation Script**
   ```bash
   npm run validate-translations
   ```

2. **Review ESLint Warnings**
   ```bash
   npm run lint:i18n
   ```

3. **Manual Testing**
   - Check all new components in browser
   - Test with different user roles
   - Verify responsive layouts with longer Spanish text

---

## 🛠️ Development Tools

### Automated Validation
```bash
# Full translation check
npm run i18n:check

# Fix missing keys and run linting
npm run i18n:fix

# Pre-commit validation (automatically runs)
npm run precommit
```

### ESLint Rules
Our custom ESLint rules catch:
- Missing translation keys
- Hardcoded Spanish text
- Complex keys without context comments

### VS Code Integration
Add to `.vscode/settings.json`:
```json
{
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "eslint.workingDirectories": ["muralla-frontend"]
}
```

---

## 📋 Code Review Checklist

### For Authors
- [ ] All new translation keys added to `i18n.ts`
- [ ] Keys follow naming conventions
- [ ] Validation script passes
- [ ] No raw keys visible in browser
- [ ] Complex keys have context comments

### For Reviewers
- [ ] Translation keys are semantic, not visual
- [ ] Keys are properly nested under appropriate modules
- [ ] No hardcoded Spanish text in JSX
- [ ] Translations are grammatically correct
- [ ] Text length works in UI layouts

---

## 🚨 Common Issues & Solutions

### Issue 1: Raw Keys Displaying
**Problem**: `gastos.subtitle` shows instead of actual text
```typescript
// ❌ CAUSE: Key missing from i18n.ts
<h2>{t('gastos.subtitle')}</h2>
```
**Solution**: Add key to `i18n.ts` first
```typescript
// ✅ FIX: Add to translations
gastos: {
  subtitle: 'Gestión integral de gastos'
}
```

### Issue 2: React Suspense Loading Issues
**Problem**: Components render before translations load
```typescript
// ❌ CAUSE: Suspense timing
react: { useSuspense: true }
```
**Solution**: Configure i18n properly
```typescript
// ✅ FIX: Disable suspense
react: { useSuspense: false }
```

### Issue 3: Inconsistent Key Structure
**Problem**: Mixed naming conventions
```typescript
// ❌ PROBLEMATIC: Inconsistent structure
'gastos_title'        // Underscore
'gastosCreateNew'     // camelCase
'gastos.form_submit'  // Mixed
```
**Solution**: Use consistent dot notation
```typescript
// ✅ CONSISTENT: Dot notation hierarchy
'gastos.title'
'gastos.createNew'
'gastos.form.submit'
```

---

## 📈 Quality Metrics

### Target Goals
- **Zero raw keys in production** (100% key coverage)
- **Sub-200ms translation loading time**
- **95% developer compliance** with naming conventions
- **Zero hardcoded Spanish text** in components

### Monitoring
- Automated validation in CI/CD pipeline
- Weekly translation coverage reports
- User feedback tracking for untranslated content
- Performance monitoring for i18n loading

---

## 🎓 Training Resources

### New Developer Onboarding
1. **Read Core Documentation**
   - This best practices guide
   - `docs/i18n-workflow.md`
   - Review existing `i18n.ts` structure

2. **Hands-on Exercise**
   ```typescript
   // Exercise: Create a simple component with proper i18n
   // 1. Plan 5 translation keys for a user profile component
   // 2. Add them to i18n.ts following conventions
   // 3. Create the component using only translation keys
   // 4. Run validation to ensure 100% coverage
   ```

3. **Code Review Practice**
   - Review 3 recent PRs for i18n best practices
   - Identify good and bad patterns
   - Practice using validation tools

### Ongoing Education
- **Monthly i18n health reviews**
- **Share learnings from production issues**
- **Update documentation with new patterns**
- **Team workshops on complex i18n scenarios**

---

## 🔧 Troubleshooting Guide

### Debug Checklist
1. **Check i18n Configuration**
   ```typescript
   // Verify in src/i18n.ts
   export default {
     lng: 'es',
     fallbackLng: 'es',
     react: { useSuspense: false }
   }
   ```

2. **Verify Key Existence**
   ```bash
   # Search for key in translations
   grep -r "your.key" src/i18n.ts
   ```

3. **Test Component in Isolation**
   ```typescript
   // Minimal test component
   function TestTranslation() {
     const { t } = useTranslation();
     return <div>{t('your.key')}</div>;
   }
   ```

4. **Check Network/Loading**
   - Open browser dev tools
   - Check for i18n resource loading errors
   - Verify React component mounting order

### Common Error Messages
| Error | Cause | Solution |
|-------|-------|----------|
| `Key not found: xyz` | Missing translation | Add to i18n.ts |
| `Raw key displayed` | Key missing or typo | Validate key existence |
| `Translation loads late` | Suspense timing | Configure React settings |
| `ESLint: no-missing-key` | Validation failure | Add missing key |

---

## 📞 Support & Communication

### Quick Help
- **Slack**: `#i18n-support`
- **Documentation**: This file + workflow guide
- **Tools**: `npm run validate-translations`

### Code Review Standards
- Always check translation key coverage
- Verify naming convention compliance
- Test with different text lengths
- Confirm no hardcoded Spanish text

### Issue Reporting
Use this template for i18n issues:
```
**Issue**: [Brief description]
**Component**: [File path]
**Key**: [Translation key causing issue]
**Expected**: [What should happen]
**Actual**: [What actually happens]
**Steps**: [How to reproduce]
```

---

*Last Updated: $(date)*  
*Maintained by: Frontend Development Team*  
*Next Review: Monthly*