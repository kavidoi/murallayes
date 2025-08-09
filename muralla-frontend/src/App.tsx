import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './components/modules/dashboard/Dashboard'
import Login from './components/modules/auth/Login'
import FinanceDashboard from './components/modules/finance/FinanceDashboard'
import PeopleOverview from './components/modules/people/PeopleOverview'
import TeamDirectory from './components/modules/people/TeamDirectory'
import StaffFinances from './components/modules/people/StaffFinances'
import KnowledgeOverview from './components/modules/knowledge/KnowledgeOverview'
import BankAccount from './components/modules/finance/BankAccount'
import PlaceholderPage from './components/common/PlaceholderPage'
import PTO from './components/modules/people/PTO'

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const token = localStorage.getItem('authToken');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  const [darkMode, setDarkMode] = useState(false)

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

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={
          <MainLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
            <Routes>
              <Route index element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              
              {/* Knowledge Hub Routes */}
              <Route path="/knowledge" element={<ProtectedRoute><KnowledgeOverview /></ProtectedRoute>} />
              <Route path="/knowledge/policies" element={<ProtectedRoute><PlaceholderPage title="Policies & SOPs" description="Company policies, procedures, and compliance documentation" icon="📋" /></ProtectedRoute>} />
              <Route path="/knowledge/playbooks" element={<ProtectedRoute><PlaceholderPage title="Playbooks & Templates" description="Reusable frameworks and templates for common scenarios" icon="📖" /></ProtectedRoute>} />
              <Route path="/knowledge/wiki" element={<ProtectedRoute><PlaceholderPage title="Institutional Memory" description="Wiki pages, lessons learned, and organizational knowledge" icon="🧠" /></ProtectedRoute>} />
              
              {/* Projects & Tasks Routes */}
              <Route path="/projects" element={<ProtectedRoute><PlaceholderPage title="Projects & Tasks" description="Project management with multiple views and collaboration tools" icon="📋" /></ProtectedRoute>} />
              <Route path="/projects/kanban" element={<ProtectedRoute><PlaceholderPage title="Kanban Board" description="Visual task management with drag-and-drop functionality" icon="📊" /></ProtectedRoute>} />
              <Route path="/projects/timeline" element={<ProtectedRoute><PlaceholderPage title="Timeline View" description="Gantt-style project timeline and dependencies" icon="📅" /></ProtectedRoute>} />
              <Route path="/projects/calendar" element={<ProtectedRoute><PlaceholderPage title="Calendar View" description="Calendar-based project and task scheduling" icon="🗓️" /></ProtectedRoute>} />
              <Route path="/projects/backlog" element={<ProtectedRoute><PlaceholderPage title="Backlog" description="Product backlog and sprint planning" icon="📝" /></ProtectedRoute>} />
              <Route path="/projects/goals" element={<ProtectedRoute><PlaceholderPage title="Goal Tree" description="Hierarchical goal tracking and OKRs" icon="🎯" /></ProtectedRoute>} />
              
              {/* People & Roles Routes */}
              <Route path="/people" element={<ProtectedRoute><PeopleOverview /></ProtectedRoute>} />
              <Route path="/people/directory" element={<ProtectedRoute><TeamDirectory /></ProtectedRoute>} />
              <Route path="/people/shifts" element={<ProtectedRoute><PlaceholderPage title="Shifts & Attendance" description="Real-time visibility into who is on the clock" icon="⏰" /></ProtectedRoute>} />
              <Route path="/people/pto" element={<ProtectedRoute><PTO /></ProtectedRoute>} />
              <Route path="/people/finances" element={<ProtectedRoute><StaffFinances /></ProtectedRoute>} />
              
              {/* Finance & Analytics Routes */}
              <Route path="/finance" element={<ProtectedRoute><FinanceDashboard /></ProtectedRoute>} />
              <Route path="/finance/bank" element={<ProtectedRoute><BankAccount /></ProtectedRoute>} />
              <Route path="/finance/transactions" element={<ProtectedRoute><PlaceholderPage title="Revenue & Expenses" description="Real-time ledger of every transaction" icon="💳" /></ProtectedRoute>} />
              <Route path="/finance/taxes" element={<ProtectedRoute><PlaceholderPage title="Taxes & VAT" description="Keep the business compliant with tax management" icon="🧾" /></ProtectedRoute>} />
              <Route path="/finance/budgets" element={<ProtectedRoute><PlaceholderPage title="Budgets" description="Set spending guardrails and monitor variances" icon="📊" /></ProtectedRoute>} />
              <Route path="/finance/kpis" element={<ProtectedRoute><PlaceholderPage title="KPI Dashboards" description="Surface financial metrics that matter at a glance" icon="📈" /></ProtectedRoute>} />
              <Route path="/finance/forecasts" element={<ProtectedRoute><PlaceholderPage title="Scenario Planning" description="Model alternative futures and prepare decisions" icon="🔮" /></ProtectedRoute>} />
              
              {/* Inventory & Sales Routes */}
              <Route path="/inventory" element={<ProtectedRoute><PlaceholderPage title="Inventory & Sales" description="Track products, sales, and stock movements" icon="📦" /></ProtectedRoute>} />
              <Route path="/inventory/products" element={<ProtectedRoute><PlaceholderPage title="Products" description="Authoritative catalog for every item or service" icon="🏷️" /></ProtectedRoute>} />
              <Route path="/inventory/sales" element={<ProtectedRoute><PlaceholderPage title="Sales" description="Record revenue events and inventory deductions" icon="💰" /></ProtectedRoute>} />
              <Route path="/inventory/stock" element={<ProtectedRoute><PlaceholderPage title="Stock" description="Location-based snapshot of on-hand quantities" icon="📊" /></ProtectedRoute>} />
              <Route path="/inventory/movements" element={<ProtectedRoute><PlaceholderPage title="Other Movements" description="Non-sales inventory changes and adjustments" icon="🔄" /></ProtectedRoute>} />
              
              {/* CRM & Community Routes */}
              <Route path="/crm" element={<ProtectedRoute><PlaceholderPage title="CRM & Community" description="Customer relationship management and community engagement" icon="👥" /></ProtectedRoute>} />
              <Route path="/crm/contacts" element={<ProtectedRoute><PlaceholderPage title="Contacts" description="Customer and prospect contact management" icon="📞" /></ProtectedRoute>} />
              <Route path="/crm/segments" element={<ProtectedRoute><PlaceholderPage title="Segments" description="Customer segmentation and targeting" icon="🎯" /></ProtectedRoute>} />
              <Route path="/crm/logs" element={<ProtectedRoute><PlaceholderPage title="Activity Logs" description="Track customer interactions and touchpoints" icon="📝" /></ProtectedRoute>} />
              <Route path="/crm/feedback" element={<ProtectedRoute><PlaceholderPage title="Feedback" description="Collect and manage customer feedback" icon="💬" /></ProtectedRoute>} />
              
              {/* Events & Scheduling Routes */}
              <Route path="/events" element={<ProtectedRoute><PlaceholderPage title="Events & Scheduling" description="Event management and resource scheduling" icon="🎉" /></ProtectedRoute>} />
              <Route path="/events/calendar" element={<ProtectedRoute><PlaceholderPage title="Calendar" description="Event calendar and scheduling interface" icon="📅" /></ProtectedRoute>} />
              <Route path="/events/bookings" element={<ProtectedRoute><PlaceholderPage title="Bookings" description="Event bookings and reservation management" icon="🎫" /></ProtectedRoute>} />
              <Route path="/events/resources" element={<ProtectedRoute><PlaceholderPage title="Resource Allocation" description="Manage event resources and equipment" icon="🛠️" /></ProtectedRoute>} />
              
              {/* Notifications Routes */}
              <Route path="/notifications" element={<ProtectedRoute><PlaceholderPage title="Notifications" description="Alert management and automation rules" icon="🔔" /></ProtectedRoute>} />
              <Route path="/notifications/inbox" element={<ProtectedRoute><PlaceholderPage title="Alert Inbox" description="Centralized notification management" icon="📥" /></ProtectedRoute>} />
              <Route path="/notifications/rules" element={<ProtectedRoute><PlaceholderPage title="Rules Engine" description="Create automated notification rules" icon="⚙️" /></ProtectedRoute>} />
              <Route path="/notifications/templates" element={<ProtectedRoute><PlaceholderPage title="Templates" description="Manage notification templates" icon="📄" /></ProtectedRoute>} />
              
              {/* Settings */}
              <Route path="/settings" element={<ProtectedRoute><PlaceholderPage title="Settings" description="System configuration and preferences" icon="⚙️" /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </MainLayout>
        } />
      </Routes>
    </Router>
  )
}

export default App
