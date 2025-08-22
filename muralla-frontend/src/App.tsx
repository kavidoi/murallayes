import { useState, useEffect, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthService } from './services/authService'
import { useTranslation } from 'react-i18next'

// Eager load critical components
import MainLayout from './components/layout/MainLayout'
import Dashboard from './components/modules/dashboard/Dashboard'
import Login from './components/modules/auth/Login'
import PlaceholderPage from './components/common/PlaceholderPage'

// Lazy load non-critical components for code splitting
const PaymentBrick = lazy(() => import('./components/modules/finance/PaymentBrick'))
const PaymentHandling = lazy(() => import('./components/modules/finance/PaymentHandling'))
const PaymentSuccess = lazy(() => import('./components/modules/finance/PaymentSuccess'))
const PaymentFailure = lazy(() => import('./components/modules/finance/PaymentFailure'))
const PaymentPending = lazy(() => import('./components/modules/finance/PaymentPending'))
const FinanceDashboard = lazy(() => import('./components/modules/finance/FinanceDashboard'))
const PeopleOverview = lazy(() => import('./components/modules/people/PeopleOverview'))
const TeamDirectory = lazy(() => import('./components/modules/people/TeamDirectory'))
const StaffFinances = lazy(() => import('./components/modules/people/StaffFinances'))
const MyFinances = lazy(() => import('./components/modules/people/MyFinances'))
const KnowledgeOverview = lazy(() => import('./components/modules/knowledge/KnowledgeOverview'))
const BankAccount = lazy(() => import('./components/modules/finance/BankAccount'))
const RevenueExpenses = lazy(() => import('./components/modules/finance/RevenueExpenses'))
const BudgetManager = lazy(() => import('./components/modules/finance/BudgetManager'))
const PTO = lazy(() => import('./components/modules/people/PTO'))
const TasksList = lazy(() => import('./components/modules/projects/TasksList'))
const ProjectsManager = lazy(() => import('./components/modules/projects/ProjectsManager'))
const Settings = lazy(() => import('./components/modules/settings/Settings'))
const ProductCatalog = lazy(() => import('./components/modules/pipeline/ProductCatalog'))
const InventoryDashboard = lazy(() => import('./components/modules/pipeline/InventoryDashboard'))
const CostsPurchases = lazy(() => import('./components/modules/pipeline/CostsPurchases'))
const ProductionWorkOrders = lazy(() => import('./components/modules/pipeline/ProductionWorkOrders'))
const ReportsAnalytics = lazy(() => import('./components/modules/pipeline/ReportsAnalytics'))
const PurchaseOrders = lazy(() => import('./components/modules/pipeline/PurchaseOrders'))
const Insumos = lazy(() => import('./components/modules/pipeline/Insumos'))
const Contactos = lazy(() => import('./components/modules/crm/Contactos'))
const SupplierPortal = lazy(() => import('./components/modules/supplier-portal/SupplierPortal'))
const CeluReceipt = lazy(() => import('./components/modules/mobile/CeluReceipt'))
const ShiftsAttendance = lazy(() => import('./components/modules/people/ShiftsAttendance'))
const MyShifts = lazy(() => import('./components/modules/people/MyShifts'))
const MisTareas = lazy(() => import('./components/modules/personal/MisTareas'))

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
)

function App() {
  const { t } = useTranslation()
  const [darkMode, setDarkMode] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null) // null = checking, false = not auth, true = auth
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for user preference or system preference
    const isDarkMode = localStorage.getItem('darkMode') === 'true' || 
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
    
    setDarkMode(isDarkMode)
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  useEffect(() => {
    // Check authentication status on app load
    const checkAuth = async () => {
      try {
        const ok = await AuthService.isAuthenticated()
        setIsAuthenticated(ok)
      } catch (error) {
        console.error('Authentication check failed:', error)
        AuthService.clearTokens()
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('darkMode', String(newDarkMode))
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('common.loadingAuth')}</p>
        </div>
      </div>
    )
  }

  // Force login if not authenticated
  if (isAuthenticated === false) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    )
  }

  // Render main app if authenticated
  return (
    <Router>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
        {/* Public Supplier Portal Route */}
        <Route path="/supplier-portal/:token" element={
          <Suspense fallback={<LoadingFallback />}>
            <SupplierPortal />
          </Suspense>
        } />
        <Route path="*" element={
          <MainLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route index element={<Dashboard />} />
              
              {/* My (user-centric) Routes */}
              <Route path="/me" element={<PlaceholderPage title={t('routes.me.title')} description={t('routes.me.description')} icon="🙋" />} />
              <Route path="/me/tasks" element={<MisTareas />} />
              <Route path="/me/pto" element={<PTO />} />
              <Route path="/me/finances" element={<MyFinances />} />
              <Route path="/me/shifts" element={<MyShifts />} />
              <Route path="/me/data" element={<PlaceholderPage title={t('routes.meData.title')} description={t('routes.meData.description')} icon="🪪" />} />
              <Route path="/me/sales" element={<PlaceholderPage title={t('routes.meSales.title')} description={t('routes.meSales.description')} icon="📈" />} />
              <Route path="/me/products" element={<PlaceholderPage title={t('routes.meProducts.title')} description={t('routes.meProducts.description')} icon="🏷️" />} />
              <Route path="/me/calendar" element={<PlaceholderPage title={t('routes.meCalendar.title')} description={t('routes.meCalendar.description')} icon="📅" />} />
              
              {/* Knowledge Hub Routes */}
              <Route path="/knowledge" element={<KnowledgeOverview />} />
              <Route path="/knowledge/policies" element={<PlaceholderPage title={t('routes.policies.title')} description={t('routes.policies.description')} icon="📋" />} />
              <Route path="/knowledge/playbooks" element={<PlaceholderPage title={t('routes.playbooks.title')} description={t('routes.playbooks.description')} icon="📖" />} />
              <Route path="/knowledge/wiki" element={<PlaceholderPage title={t('routes.wiki.title')} description={t('routes.wiki.description')} icon="🧠" />} />
              
              {/* Projects & Tasks Routes */}
              <Route path="/projects" element={<Navigate to="/projects/overview" replace />} />
              <Route path="/projects/overview" element={<ProjectsManager />} />
              <Route path="/projects/tasks" element={<TasksList />} />
              <Route path="/projects/kanban" element={<PlaceholderPage title={t('routes.kanban.title')} description={t('routes.kanban.description')} icon="📊" />} />
              <Route path="/projects/timeline" element={<PlaceholderPage title={t('routes.timeline.title')} description={t('routes.timeline.description')} icon="📅" />} />
              {/* Redirect project calendar to unified schedule calendar */}
              <Route path="/projects/calendar" element={<Navigate to="/schedule/calendar" replace />} />
              <Route path="/projects/backlog" element={<PlaceholderPage title={t('routes.backlog.title')} description={t('routes.backlog.description')} icon="📝" />} />
              <Route path="/projects/goals" element={<PlaceholderPage title={t('routes.goals.title')} description={t('routes.goals.description')} icon="🎯" />} />
              
              {/* Staff Routes (organization perspective) */}
              <Route path="/staff" element={<PeopleOverview />} />
              <Route path="/staff/directory" element={<TeamDirectory />} />
              <Route path="/staff/shifts" element={<ShiftsAttendance />} />
              <Route path="/staff/pto" element={<PlaceholderPage title={t('routes.staffPto.title')} description={t('routes.staffPto.description')} icon="🏖️" />} />
              <Route path="/staff/finances" element={<StaffFinances />} />
              
              {/* Finance Routes */}
              <Route path="/finance" element={<FinanceDashboard />} />
              <Route path="/finance/bank" element={<BankAccount />} />
              <Route path="/finance/payment/brick" element={<PaymentBrick />} />
              <Route path="/finance/payments" element={<PaymentHandling />} />
              <Route path="/finance/payment/success" element={<PaymentSuccess />} />
              <Route path="/finance/payment/failure" element={<PaymentFailure />} />
              <Route path="/finance/payment/pending" element={<PaymentPending />} />
              <Route path="/finance/revenue-expenses" element={<RevenueExpenses />} />
              <Route path="/finance/taxes" element={<PlaceholderPage title={t('routes.taxes.title')} description={t('routes.taxes.description')} icon="🧾" />} />
              <Route path="/finance/budgets" element={<BudgetManager />} />
              {/* Redirect old analytics under finance to new analytics section */}
              <Route path="/finance/kpis" element={<Navigate to="/analytics/kpis" replace />} />
              <Route path="/finance/forecasts" element={<Navigate to="/analytics/forecasts" replace />} />
              
              {/* Operations Routes (formerly Pipeline) - New logical order */}
              <Route path="/operations" element={<PurchaseOrders />} />
              <Route path="/operations/purchase-orders" element={<PurchaseOrders />} />
              <Route path="/operations/insumos" element={<Insumos />} />
              <Route path="/operations/production" element={<ProductionWorkOrders />} />
              <Route path="/operations/products" element={<ProductCatalog />} />
              {/* Legacy routes - kept for compatibility */}
              <Route path="/operations/inventory" element={<InventoryDashboard />} />
              <Route path="/operations/costs" element={<CostsPurchases />} />
              {/* Redirect old pipeline routes to operations */}
              <Route path="/pipeline" element={<Navigate to="/operations" replace />} />
              <Route path="/pipeline/products" element={<Navigate to="/operations/products" replace />} />
              <Route path="/pipeline/inventory" element={<Navigate to="/operations/inventory" replace />} />
              <Route path="/pipeline/purchase-orders" element={<Navigate to="/operations/purchase-orders" replace />} />
              <Route path="/pipeline/costs" element={<Navigate to="/operations/costs" replace />} />
              <Route path="/pipeline/production" element={<Navigate to="/operations/production" replace />} />
              <Route path="/pipeline/banking" element={<Navigate to="/finance/bank" replace />} />
              <Route path="/pipeline/reports" element={<Navigate to="/analytics/reports" replace />} />

              {/* Mobile quick upload route */}
              <Route path="/celu" element={<CeluReceipt />} />
              
              {/* Legacy Inventory & Sales Routes -> redirect to operations/finance */}
              <Route path="/inventory" element={<Navigate to="/operations/inventory" replace />} />
              <Route path="/inventory/products" element={<Navigate to="/operations/products" replace />} />
              <Route path="/inventory/sales" element={<Navigate to="/finance/revenue-expenses" replace />} />
              <Route path="/inventory/stock" element={<Navigate to="/operations/inventory" replace />} />
              
              {/* CRM & Community Routes */}
              <Route path="/crm" element={<Contactos />} />
              <Route path="/crm/contacts" element={<Contactos />} />
              <Route path="/crm/segments" element={<PlaceholderPage title={t('routes.segments.title')} description={t('routes.segments.description')} icon="🎯" />} />
              <Route path="/crm/logs" element={<PlaceholderPage title={t('routes.activityLogs.title')} description={t('routes.activityLogs.description')} icon="📝" />} />
              <Route path="/crm/feedback" element={<PlaceholderPage title={t('routes.feedback.title')} description={t('routes.feedback.description')} icon="💬" />} />
              
              {/* Scheduling (unified calendars) */}
              <Route path="/schedule" element={<Navigate to="/schedule/calendar" replace />} />
              <Route path="/schedule/calendar" element={<PlaceholderPage title={t('routes.eventsCalendar.title')} description={t('routes.eventsCalendar.description')} icon="📅" />} />
              <Route path="/schedule/bookings" element={<PlaceholderPage title={t('routes.bookings.title')} description={t('routes.bookings.description')} icon="🎫" />} />
              <Route path="/schedule/resources" element={<PlaceholderPage title={t('routes.resources.title')} description={t('routes.resources.description')} icon="🛠️" />} />
              {/* Redirect Events to Scheduling */}
              <Route path="/events" element={<Navigate to="/schedule" replace />} />
              <Route path="/events/calendar" element={<Navigate to="/schedule/calendar" replace />} />
              <Route path="/events/bookings" element={<Navigate to="/schedule/bookings" replace />} />
              <Route path="/events/resources" element={<Navigate to="/schedule/resources" replace />} />
              
              {/* Notifications Routes */}
              <Route path="/notifications" element={<PlaceholderPage title={t('routes.notifications.title')} description={t('routes.notifications.description')} icon="🔔" />} />
              <Route path="/notifications/inbox" element={<PlaceholderPage title={t('routes.inbox.title')} description={t('routes.inbox.description')} icon="📥" />} />
              <Route path="/notifications/rules" element={<PlaceholderPage title={t('routes.rules.title')} description={t('routes.rules.description')} icon="⚙️" />} />
              <Route path="/notifications/templates" element={<PlaceholderPage title={t('routes.templates.title')} description={t('routes.templates.description')} icon="📄" />} />

              {/* Analytics Routes */}
              <Route path="/analytics" element={<Navigate to="/analytics/kpis" replace />} />
              <Route path="/analytics/kpis" element={<PlaceholderPage title={t('routes.kpis.title')} description={t('routes.kpis.description')} icon="📈" />} />
              <Route path="/analytics/forecasts" element={<PlaceholderPage title={t('routes.forecasts.title')} description={t('routes.forecasts.description')} icon="🔮" />} />
              <Route path="/analytics/reports" element={<ReportsAnalytics />} />
              
              {/* Settings */}
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </MainLayout>
        } />
      </Routes>
    </Router>
  )
}

export default App
