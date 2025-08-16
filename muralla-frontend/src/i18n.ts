import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const storedLang = (typeof window !== 'undefined' && window.localStorage.getItem('lang')) || undefined
const defaultLang = storedLang || 'es'

const resources = {
  es: {
    translation: {
      common: {
        loadingAuth: 'Verificando autenticación...',
        noDate: 'Sin fecha',
        unassigned: 'Sin asignar',
      },
      theme: {
        light: 'Modo claro',
        dark: 'Modo oscuro',
      },
      actions: {
        create: 'Crear',
        new: 'Nuevo',
        import: 'Importar',
        logout: 'Cerrar sesión',
        remove: 'Eliminar',
        addSubtask: '+ Subtarea',
        searchPlaceholder: 'Buscar...'
      },
      status: {
        'New': 'Nuevo',
        'In Progress': 'En progreso',
        'Completed': 'Completado',
        'Overdue': 'Vencido'
      },
      tooltips: {
        autoOverdue: 'El estado se define automáticamente como Vencido según la fecha de vencimiento',
        editStatus: 'Haz clic para editar el estado',
        customizeDueDate: 'Haz clic para personalizar la fecha',
        editDueDate: 'Haz clic para editar la fecha',
        customizeAssignee: 'Haz clic para personalizar el responsable',
        setAssignee: 'Haz clic para asignar responsable',
        collapse: 'Contraer',
        expand: 'Expandir',
        dragTask: 'Arrastrar tarea',
        dragSubtask: 'Arrastrar subtarea'
      },
      nav: {
        home: 'Inicio',
        my: 'Mi',
        myPto: 'Mis vacaciones',
        myFinances: 'Mis finanzas',
        myShifts: 'Mis turnos',
        myData: 'Mis datos',
        mySales: 'Mis ventas',
        myProducts: 'Mis productos',
        myCalendar: 'Mi calendario',
        knowledge: 'Conocimiento',
        policies: 'Políticas y SOPs',
        playbooks: 'Guías y plantillas',
        wiki: 'Memoria institucional',
        projects: 'Proyectos y Tareas',
        tasksList: 'Lista de tareas',
        kanban: 'Tablero Kanban',
        timeline: 'Cronograma',
        calendar: 'Calendario',
        backlog: 'Backlog',
        goals: 'Árbol de objetivos',
        staff: 'Personal',
        directory: 'Directorio',
        shifts: 'Turnos y asistencia',
        pto: 'PTO / Vacaciones',
        staffFinances: 'Finanzas del personal',
        finance: 'Finanzas y Analítica',
        bank: 'Cuenta bancaria',
        payments: 'Pagos',
        revenueExpenses: 'Ingresos y egresos',
        taxes: 'Impuestos y IVA',
        budgets: 'Presupuestos',
        kpis: 'KPIs',
        forecasts: 'Escenarios',
        inventory: 'Inventario y Ventas',
        products: 'Productos',
        sales: 'Ventas',
        stock: 'Stock',
        movements: 'Otros movimientos',
        crm: 'CRM y Comunidad',
        contacts: 'Contactos',
        segments: 'Segmentos',
        activityLogs: 'Registros de actividad',
        feedback: 'Feedback',
        events: 'Eventos y Agenda',
        bookings: 'Reservas',
        resources: 'Asignación de recursos',
        notifications: 'Notificaciones',
        inbox: 'Bandeja de alertas',
        rules: 'Motor de reglas',
        templates: 'Plantillas',
        settings: 'Configuración'
      },
      pages: {
        tasks: {
          title: '🌱 Tareas',
          subtitle: 'Planifica, sigue y entrega. Las subtareas pueden heredar responsable y fecha de vencimiento del padre.',
          sectionAll: 'Todas las tareas',
          subnavAll: 'Todas las tareas',
          subnavTimeline: 'Cronograma',
          subnavByStatus: 'Por estado',
          subnavMore: '3 más…',
          newTask: 'Nueva tarea',
          newSubtask: 'Nueva subtarea',
          columns: {
            name: 'Nombre',
            dueDate: 'Fecha',
            status: 'Estado',
            assignee: 'Responsable'
          }
        },
        placeholders: {
          comingSoon: 'Próximamente'
        },
        settings: {
          title: 'Configuración',
          language: 'Idioma',
          selectLanguage: 'Seleccionar idioma',
          es: 'Español',
          en: 'Inglés'
        }
      },
      routes: {
        dashboard: { title: 'Inicio', description: '' },
        me: { title: 'Mi Centro', description: 'Vista personal: vacaciones, finanzas, turnos, ventas, productos, calendario' },
        meShifts: { title: 'Mis turnos', description: 'Tus turnos programados y pasados' },
        meData: { title: 'Mis datos', description: 'Datos personales, perfil, documentos' },
        meSales: { title: 'Mis ventas', description: 'Tus resultados y rendimiento de ventas' },
        meProducts: { title: 'Mis productos', description: 'Productos gestionados o asociados a ti' },
        meCalendar: { title: 'Mi calendario', description: 'Tus eventos y programación' },
        knowledge: { title: 'Conocimiento', description: 'Políticas, procedimientos y documentación de cumplimiento' },
        projects: { title: 'Proyectos y tareas', description: 'Gestión de proyectos con múltiples vistas y colaboración' },
        kanban: { title: 'Tablero Kanban', description: 'Gestión visual de tareas con arrastrar y soltar' },
        timeline: { title: 'Vista de cronograma', description: 'Cronograma tipo Gantt y dependencias' },
        calendar: { title: 'Vista de calendario', description: 'Programación de proyectos y tareas en calendario' },
        backlog: { title: 'Backlog', description: 'Backlog de producto y planificación de sprints' },
        goals: { title: 'Árbol de objetivos', description: 'Seguimiento jerárquico de objetivos y OKRs' },
        staff: { title: 'Personal', description: '' },
        directory: { title: 'Directorio', description: 'Gestión de contactos y perfiles del personal' },
        staffShifts: { title: 'Turnos y asistencia', description: 'Visibilidad en tiempo real de quién está en turno' },
        staffPto: { title: 'PTO / Vacaciones', description: 'Resumen de solicitudes de tiempo libre' },
        staffFinances: { title: 'Finanzas del personal', description: '' },
        finance: { title: 'Finanzas y analítica', description: '' },
        bank: { title: 'Cuenta bancaria', description: '' },
        payments: { title: 'Pagos', description: '' },
        revenueExpenses: { title: 'Ingresos y egresos', description: '' },
        taxes: { title: 'Impuestos y IVA', description: '' },
        budgets: { title: 'Presupuestos', description: '' },
        kpis: { title: 'KPIs', description: '' },
        forecasts: { title: 'Escenarios', description: '' },
        inventory: { title: 'Inventario y ventas', description: 'Seguimiento de productos, ventas y existencias' },
        products: { title: 'Productos', description: 'Catálogo autoritativo de cada artículo o servicio' },
        sales: { title: 'Ventas', description: 'Registro de eventos de ingresos y deducciones de inventario' },
        stock: { title: 'Stock', description: 'Instantánea por ubicación de las existencias disponibles' },
        movements: { title: 'Otros movimientos', description: 'Cambios y ajustes de inventario' },
        crm: { title: 'CRM y comunidad', description: 'Gestión de relaciones con clientes y comunidad' },
        contacts: { title: 'Contactos', description: '' },
        segments: { title: 'Segmentos', description: '' },
        activityLogs: { title: 'Registros de actividad', description: '' },
        feedback: { title: 'Feedback', description: '' },
        events: { title: 'Eventos y agenda', description: 'Gestión de eventos y recursos' },
        eventsCalendar: { title: 'Calendario', description: 'Calendario de eventos y programación' },
        bookings: { title: 'Reservas', description: 'Gestión de reservas y cupos' },
        resources: { title: 'Asignación de recursos', description: 'Gestión de equipos y recursos' },
        notifications: { title: 'Notificaciones', description: 'Alertas y automatizaciones' },
        inbox: { title: 'Bandeja de alertas', description: 'Centro de notificaciones' },
        rules: { title: 'Motor de reglas', description: 'Crear reglas automáticas de notificación' },
        templates: { title: 'Plantillas', description: 'Gestionar plantillas de notificación' },
        settings: { title: 'Configuración', description: 'Preferencias del sistema' }
      }
    }
  },
  en: {
    translation: {
      common: {
        loadingAuth: 'Checking authentication...',
        noDate: 'No date',
        unassigned: 'Unassigned',
      },
      theme: {
        light: 'Light Mode',
        dark: 'Dark Mode',
      },
      actions: {
        create: 'Create',
        new: 'New',
        import: 'Import',
        logout: 'Logout',
        remove: 'Remove',
        addSubtask: '+ Subtask',
        searchPlaceholder: 'Search...'
      },
      status: {
        'New': 'New',
        'In Progress': 'In Progress',
        'Completed': 'Completed',
        'Overdue': 'Overdue'
      },
      tooltips: {
        autoOverdue: 'Status is auto-set to Overdue based on due date',
        editStatus: 'Click to edit status',
        customizeDueDate: 'Click to customize due date',
        editDueDate: 'Click to edit due date',
        customizeAssignee: 'Click to customize assignee',
        setAssignee: 'Click to set assignee',
        collapse: 'Collapse',
        expand: 'Expand',
        dragTask: 'Drag task',
        dragSubtask: 'Drag subtask'
      },
      nav: {
        home: 'Home Hub',
        my: 'My',
        myPto: 'My PTO / Time-Off',
        myFinances: 'My Finances',
        myShifts: 'My Shifts',
        myData: 'My Data',
        mySales: 'My Sales',
        myProducts: 'My Products',
        myCalendar: 'My Calendar',
        knowledge: 'Knowledge Hub',
        policies: 'Policies & SOPs',
        playbooks: 'Playbooks & Templates',
        wiki: 'Institutional Memory',
        projects: 'Projects & Tasks',
        tasksList: 'Tasks List',
        kanban: 'Kanban Board',
        timeline: 'Timeline View',
        calendar: 'Calendar View',
        backlog: 'Backlog',
        goals: 'Goal Tree',
        staff: 'Staff',
        directory: 'Team Directory',
        shifts: 'Shifts & Attendance',
        pto: 'PTO / Time-Off',
        staffFinances: 'Staff Finances',
        finance: 'Finance & Analytics',
        bank: 'Bank Account',
        payments: 'Payment Handling',
        revenueExpenses: 'Revenue & Expenses',
        taxes: 'Taxes & VAT',
        budgets: 'Budgets',
        kpis: 'KPI Dashboards',
        forecasts: 'Scenario Planning',
        inventory: 'Inventory & Sales',
        products: 'Products',
        sales: 'Sales',
        stock: 'Stock',
        movements: 'Other Movements',
        crm: 'CRM & Community',
        contacts: 'Contacts',
        segments: 'Segments',
        activityLogs: 'Activity Logs',
        feedback: 'Feedback',
        events: 'Events & Scheduling',
        bookings: 'Bookings',
        resources: 'Resource Allocation',
        notifications: 'Notifications',
        inbox: 'Alert Inbox',
        rules: 'Rules Engine',
        templates: 'Templates',
        settings: 'Settings'
      },
      pages: {
        tasks: {
          title: '🌱 Tasks',
          subtitle: 'Plan, track, and ship. Subtasks can inherit assignee and due date from their parent.',
          sectionAll: 'All Tasks',
          subnavAll: 'All Tasks',
          subnavTimeline: 'Timeline',
          subnavByStatus: 'By Status',
          subnavMore: '3 more…',
          newTask: 'New task',
          newSubtask: 'New sub-item',
          columns: {
            name: 'Name',
            dueDate: 'Due Date',
            status: 'Status',
            assignee: 'Assignee'
          }
        },
        placeholders: {
          comingSoon: 'Coming Soon'
        },
        settings: {
          title: 'Settings',
          language: 'Language',
          selectLanguage: 'Select language',
          es: 'Spanish',
          en: 'English'
        }
      }
    }
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLang,
  fallbackLng: 'es',
  interpolation: { escapeValue: false }
})

export default i18n
