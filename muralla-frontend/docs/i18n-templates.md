# 🎯 i18n Templates & Developer Memory Aids

## 🧠 Quick Reference Card

### Before You Code - The 3-Step Check
```bash
# 1. Plan your keys
echo "myModule.title, myModule.form.field" > keys.txt

# 2. Check existing patterns  
grep -r "similar" src/i18n.ts

# 3. Add to i18n.ts FIRST, then code
```

### Emergency Debugging
```bash
# Key missing? Check existence:
grep -r "your.key" src/i18n.ts

# Raw keys showing? Run validator:
npm run validate-translations

# Need quick fix? Add key and test:
# 1. Add to i18n.ts
# 2. Refresh browser
# 3. Should work immediately
```

---

## 🏗️ Component Templates

### Basic Page Component
```typescript
// 1. FIRST: Add to src/i18n.ts
const translations = {
  myPage: {
    title: 'Mi Página',
    subtitle: 'Descripción de la página',
    loading: 'Cargando...',
    error: 'Error al cargar datos',
    noData: 'No hay datos disponibles'
  }
};

// 2. THEN: Create component
import { useTranslation } from 'react-i18next';

export function MyPageComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('myPage.title')}</h1>
      <p>{t('myPage.subtitle')}</p>
      {/* Never hardcode Spanish text! */}
    </div>
  );
}
```

### Form Component Template
```typescript
// 1. FIRST: Add to i18n.ts
const formTranslations = {
  forms: {
    myForm: {
      title: 'Formulario de Ejemplo',
      fields: {
        name: 'Nombre',
        email: 'Correo Electrónico',
        phone: 'Teléfono'
      },
      placeholders: {
        name: 'Ingresa tu nombre completo',
        email: 'ejemplo@correo.com',
        phone: '+56 9 1234 5678'
      },
      validation: {
        required: 'Este campo es obligatorio',
        invalidEmail: 'Correo electrónico inválido',
        invalidPhone: 'Número de teléfono inválido'
      },
      actions: {
        submit: 'Enviar',
        cancel: 'Cancelar',
        reset: 'Limpiar'
      },
      messages: {
        success: 'Formulario enviado correctamente',
        error: 'Error al enviar el formulario'
      }
    }
  }
};

// 2. THEN: Create component
export function MyFormComponent() {
  const { t } = useTranslation();
  
  return (
    <form>
      <h2>{t('forms.myForm.title')}</h2>
      
      <div>
        <label>{t('forms.myForm.fields.name')}</label>
        <input 
          placeholder={t('forms.myForm.placeholders.name')}
          required 
        />
      </div>
      
      <div>
        <label>{t('forms.myForm.fields.email')}</label>
        <input 
          type="email"
          placeholder={t('forms.myForm.placeholders.email')}
          required 
        />
      </div>
      
      <div>
        <button type="submit">
          {t('forms.myForm.actions.submit')}
        </button>
        <button type="button">
          {t('forms.myForm.actions.cancel')}
        </button>
      </div>
    </form>
  );
}
```

### Data Table Component Template
```typescript
// 1. FIRST: Add to i18n.ts
const tableTranslations = {
  tables: {
    myTable: {
      title: 'Tabla de Datos',
      columns: {
        id: 'ID',
        name: 'Nombre',
        email: 'Correo',
        status: 'Estado',
        actions: 'Acciones'
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Eliminar',
        export: 'Exportar'
      },
      status: {
        active: 'Activo',
        inactive: 'Inactivo',
        pending: 'Pendiente'
      },
      messages: {
        loading: 'Cargando datos...',
        empty: 'No hay datos para mostrar',
        error: 'Error al cargar los datos'
      },
      pagination: {
        showing: 'Mostrando',
        of: 'de',
        results: 'resultados',
        previous: 'Anterior',
        next: 'Siguiente'
      }
    }
  }
};

// 2. THEN: Create component
export function MyTableComponent({ data, loading, error }) {
  const { t } = useTranslation();
  
  if (loading) {
    return <div>{t('tables.myTable.messages.loading')}</div>;
  }
  
  if (error) {
    return <div>{t('tables.myTable.messages.error')}</div>;
  }
  
  if (!data.length) {
    return <div>{t('tables.myTable.messages.empty')}</div>;
  }
  
  return (
    <div>
      <h2>{t('tables.myTable.title')}</h2>
      <table>
        <thead>
          <tr>
            <th>{t('tables.myTable.columns.id')}</th>
            <th>{t('tables.myTable.columns.name')}</th>
            <th>{t('tables.myTable.columns.email')}</th>
            <th>{t('tables.myTable.columns.status')}</th>
            <th>{t('tables.myTable.columns.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.name}</td>
              <td>{item.email}</td>
              <td>{t(`tables.myTable.status.${item.status}`)}</td>
              <td>
                <button>{t('tables.myTable.actions.view')}</button>
                <button>{t('tables.myTable.actions.edit')}</button>
                <button>{t('tables.myTable.actions.delete')}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 📝 Key Planning Worksheets

### New Feature Planning Template
```markdown
## Feature: [Feature Name]
### Translation Keys Needed:

**Page Level:**
- [ ] featureName.title
- [ ] featureName.subtitle  
- [ ] featureName.description

**Navigation:**
- [ ] nav.featureName.title
- [ ] nav.featureName.description

**Forms:**
- [ ] forms.featureName.field1
- [ ] forms.featureName.field2
- [ ] forms.featureName.placeholders.field1

**Actions:**
- [ ] actions.featureName.create
- [ ] actions.featureName.save
- [ ] actions.featureName.cancel

**Status/Messages:**
- [ ] status.featureName.loading
- [ ] status.featureName.success
- [ ] status.featureName.error

**Validation:**
- [ ] validation.featureName.required
- [ ] validation.featureName.invalid
```

### Component Audit Template
```markdown
## Component: [ComponentName.tsx]
### Current Translation Usage:

**✅ Using translations correctly:**
- t('proper.key.structure')
- Clear, semantic naming

**⚠️ Needs improvement:**
- Hardcoded text: "[text]"
- Missing keys: [key]
- Inconsistent naming: [key]

**🔧 Action Items:**
- [ ] Add missing keys to i18n.ts
- [ ] Replace hardcoded text
- [ ] Standardize key naming
- [ ] Test in browser
```

---

## 🎨 VS Code Snippets

Add these to your VS Code user snippets (`Preferences > Configure User Snippets > typescriptreact`):

```json
{
  "i18n Basic Component": {
    "prefix": "i18n-comp",
    "body": [
      "// 1. FIRST: Add to src/i18n.ts",
      "const translations = {",
      "  ${1:moduleName}: {",
      "    title: '${2:Title}',",
      "    subtitle: '${3:Subtitle}'",
      "  }",
      "};",
      "",
      "// 2. THEN: Create component",
      "import { useTranslation } from 'react-i18next';",
      "",
      "export function ${4:ComponentName}() {",
      "  const { t } = useTranslation();",
      "  ",
      "  return (",
      "    <div>",
      "      <h1>{t('${1:moduleName}.title')}</h1>",
      "      <p>{t('${1:moduleName}.subtitle')}</p>",
      "    </div>",
      "  );",
      "}"
    ],
    "description": "Basic i18n component template"
  },
  
  "i18n Translation Key": {
    "prefix": "t-key",
    "body": [
      "{t('${1:module.key}')}"
    ],
    "description": "Translation key usage"
  },
  
  "i18n Form Field": {
    "prefix": "i18n-field",
    "body": [
      "<div>",
      "  <label>{t('forms.${1:formName}.fields.${2:fieldName}')}</label>",
      "  <input ",
      "    placeholder={t('forms.${1:formName}.placeholders.${2:fieldName}')}",
      "    $3",
      "  />",
      "</div>"
    ],
    "description": "i18n form field template"
  }
}
```

---

## 🗂️ File Organization Cheat Sheet

### i18n.ts Structure Template
```typescript
export default {
  es: {
    translation: {
      // 🌐 Global/Common
      common: {
        actions: { save: 'Guardar', cancel: 'Cancelar' },
        status: { active: 'Activo', inactive: 'Inactivo' },
        loading: 'Cargando...',
        error: 'Error'
      },
      
      // 🧭 Navigation
      nav: {
        dashboard: { title: 'Dashboard' },
        finance: { title: 'Finanzas' },
        projects: { title: 'Proyectos' }
      },
      
      // 📄 Pages
      pages: {
        dashboard: {
          title: 'Panel de Control',
          subtitle: 'Resumen general del sistema'
        }
      },
      
      // 📋 Forms
      forms: {
        login: {
          fields: { email: 'Email', password: 'Contraseña' },
          actions: { submit: 'Iniciar Sesión' }
        }
      },
      
      // 💰 Module: Finance
      finance: {
        gastos: {
          title: 'Gastos',
          subtitle: 'Gestión de gastos'
        }
      },
      
      // 🎯 Module: Projects  
      projects: {
        kanban: {
          title: 'Tablero Kanban',
          addTask: 'Agregar Tarea'
        }
      },
      
      // 👥 Module: People
      people: {
        directory: {
          title: 'Directorio',
          searchPlaceholder: 'Buscar empleado'
        }
      },
      
      // 📚 Module: Knowledge
      knowledge: {
        wiki: {
          title: 'Wiki',
          createArticle: 'Crear Artículo'
        }
      }
    }
  }
};
```

---

## ⚡ Speed Development Tips

### 1. Copy-Paste Safety
```typescript
// ✅ Safe pattern to copy-paste
const baseTranslations = {
  title: 'Module Title',
  subtitle: 'Module Description',
  loading: 'Loading...',
  error: 'Error occurred',
  noData: 'No data available'
};

// Just change the module name and translations
```

### 2. Batch Key Creation
```typescript
// Create multiple related keys at once
const batchKeys = {
  myModule: {
    // UI Elements
    title: 'Title',
    subtitle: 'Subtitle',
    description: 'Description',
    
    // States
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    
    // Actions
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel'
  }
};
```

### 3. Testing Shortcuts
```bash
# Quick test cycle
npm run validate-translations && npm run dev
# Open browser, check for raw keys
# If raw keys found, add to i18n.ts and refresh
```

---

## 🔍 Debugging Checklist

### ❓ "Why is my translation not showing?"
1. **Check key exists in i18n.ts**
   ```bash
   grep -r "your.key" src/i18n.ts
   ```

2. **Check component import**
   ```typescript
   import { useTranslation } from 'react-i18next';
   const { t } = useTranslation();
   ```

3. **Check key syntax**
   ```typescript
   // ✅ Correct
   {t('module.key')}
   
   // ❌ Wrong  
   {t('module,key')}  // Comma instead of dot
   {t(module.key)}    // Missing quotes
   ```

4. **Check for typos**
   ```typescript
   // Common typos
   {t('moduel.key')}      // misspelled 'module'
   {t('module.titel')}    // misspelled 'title'
   {t('module.ket')}      // misspelled 'key'
   ```

### ❓ "Why do I see raw keys in production?"
1. **Key missing from i18n.ts** (most common)
2. **i18n not properly initialized**
3. **Component rendered before translations loaded**
4. **Network error loading translation resources**

---

## 📚 Learning Resources

### Practice Exercises
1. **Exercise 1: Convert Hardcoded Component**
   - Find a component with hardcoded Spanish text
   - Extract all text to translation keys
   - Test before and after

2. **Exercise 2: Create New Feature**
   - Plan 10+ translation keys for a new feature
   - Add them to i18n.ts with proper structure
   - Create component using only translation keys

3. **Exercise 3: Fix Validation Errors**
   - Run `npm run validate-translations`
   - Fix all reported missing keys
   - Verify with manual testing

### Reference Materials
- **Primary**: This template file
- **Workflow**: `docs/i18n-workflow.md`  
- **Best Practices**: `docs/i18n-best-practices.md`
- **Official**: [react-i18next documentation](https://react.i18next.com/)

---

*💡 **Remember**: When in doubt, add the key to i18n.ts FIRST, then code. This simple habit prevents 90% of translation issues.*

---

*Last Updated: $(date)*  
*Quick Reference: Keep this file bookmarked for daily use*