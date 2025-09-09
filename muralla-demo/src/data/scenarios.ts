export type ScenarioKey = 'general' | 'retail' | 'manufacturing' | 'services'

export interface ScenarioData {
  kpis: { projects: number; openTasks: number; team: number; revenue: number }
  revenueByMonth: { month: string; revenue: number }[]
  tasksByStatus: { id: string; label: string; value: number }[]
  activityFeed: { id: string; text: string; time: string }[]
  tasks: { id: string; title: string; status: 'Todo' | 'In Progress' | 'Done'; project: string; due: string; assignee: string }[]
  projects: { id: string; name: string; stage: 'planning' | 'active' | 'completed'; owner: string; deadline: string; description: string }[]
  team: { id: string; name: string; role: string; email: string }[]
  reportBarData: { month: string; revenue: number; costs: number; profit: number }[]
}

export const scenarios: Record<ScenarioKey, { label: string; data: ScenarioData }> = {
  general: {
    label: 'General (Predeterminado)',
    data: {
      kpis: { projects: 18, openTasks: 124, team: 22, revenue: 324500 },
      revenueByMonth: [
        { month: 'Jan', revenue: 22000 },
        { month: 'Feb', revenue: 24500 },
        { month: 'Mar', revenue: 26800 },
        { month: 'Apr', revenue: 30100 },
        { month: 'May', revenue: 28000 },
        { month: 'Jun', revenue: 35000 },
        { month: 'Jul', revenue: 39000 },
        { month: 'Aug', revenue: 41000 },
      ],
      tasksByStatus: [
        { id: 'todo', label: 'Todo', value: 40 },
        { id: 'inprogress', label: 'In Progress', value: 58 },
        { id: 'done', label: 'Done', value: 26 },
      ],
      activityFeed: [
        { id: 'a1', text: 'Maria completed “Design homepage v2”', time: '2h ago' },
        { id: 'a2', text: 'Carlos updated Project “Q4 Launch Plan”', time: '4h ago' },
        { id: 'a3', text: 'Sofia added 3 new tasks to “Website Refresh”', time: '5h ago' },
        { id: 'a4', text: 'Rafael commented on “Supplier negotiation”', time: '1d ago' },
      ],
      tasks: [
        { id: 't1', title: 'Finalize pitch deck', status: 'In Progress', project: 'Investor Relations', due: 'Sep 12', assignee: 'Alex' },
        { id: 't2', title: 'Design dashboard widgets', status: 'Todo', project: 'UI Library', due: 'Sep 20', assignee: 'Maria' },
        { id: 't3', title: 'Implement search API', status: 'In Progress', project: 'Platform', due: 'Sep 14', assignee: 'Diego' },
        { id: 't4', title: 'QA test flows', status: 'Done', project: 'Mobile App', due: 'Sep 03', assignee: 'Sofia' },
        { id: 't5', title: 'Customer interview synthesis', status: 'Todo', project: 'Research', due: 'Sep 16', assignee: 'Camila' },
      ],
      projects: [
        { id: 'p1', name: 'Website Refresh', stage: 'active', owner: 'Alex', deadline: 'Oct 28', description: 'Modernize brand site and improve conversion.' },
        { id: 'p2', name: 'Q4 Launch Plan', stage: 'planning', owner: 'Maria', deadline: 'Nov 10', description: 'Prepare cross-functional GTM for Q4.' },
        { id: 'p3', name: 'Mobile App 2.0', stage: 'active', owner: 'Sofia', deadline: 'Dec 02', description: 'Performance and UX improvements.' },
        { id: 'p4', name: 'Data Warehouse', stage: 'completed', owner: 'Diego', deadline: 'Aug 18', description: 'Centralized analytics foundation.' },
        { id: 'p5', name: 'UI Library', stage: 'active', owner: 'Camila', deadline: 'Nov 30', description: 'Reusable design system components.' },
      ],
      team: [
        { id: 'u1', name: 'Alex Doe', role: 'Product Manager', email: 'alex@example.com' },
        { id: 'u2', name: 'Maria Garcia', role: 'Designer', email: 'maria@example.com' },
        { id: 'u3', name: 'Diego Torres', role: 'Engineer', email: 'diego@example.com' },
        { id: 'u4', name: 'Sofia Alvarez', role: 'QA Lead', email: 'sofia@example.com' },
        { id: 'u5', name: 'Camila Rojas', role: 'Researcher', email: 'camila@example.com' },
      ],
      reportBarData: [
        { month: 'Jan', revenue: 22, costs: 12, profit: 10 },
        { month: 'Feb', revenue: 24, costs: 13, profit: 11 },
        { month: 'Mar', revenue: 26, costs: 15, profit: 11 },
        { month: 'Apr', revenue: 30, costs: 16, profit: 14 },
        { month: 'May', revenue: 28, costs: 14, profit: 14 },
        { month: 'Jun', revenue: 35, costs: 17, profit: 18 },
        { month: 'Jul', revenue: 39, costs: 19, profit: 20 },
        { month: 'Aug', revenue: 41, costs: 20, profit: 21 },
      ],
    }
  },
  retail: {
    label: 'Retail / Comercio',
    data: {
      kpis: { projects: 12, openTasks: 86, team: 15, revenue: 512300 },
      revenueByMonth: [
        { month: 'Jan', revenue: 42000 },
        { month: 'Feb', revenue: 45000 },
        { month: 'Mar', revenue: 48000 },
        { month: 'Apr', revenue: 51000 },
        { month: 'May', revenue: 53000 },
        { month: 'Jun', revenue: 56000 },
        { month: 'Jul', revenue: 59000 },
        { month: 'Aug', revenue: 62000 },
      ],
      tasksByStatus: [
        { id: 'todo', label: 'Todo', value: 20 },
        { id: 'inprogress', label: 'In Progress', value: 40 },
        { id: 'done', label: 'Done', value: 26 },
      ],
      activityFeed: [
        { id: 'a1', text: 'New supplier evaluation scheduled', time: '1h ago' },
        { id: 'a2', text: 'POS rollout phase 2 started', time: '6h ago' },
        { id: 'a3', text: 'Store #12 renovation approved', time: '1d ago' },
        { id: 'a4', text: 'Inventory audit completed', time: '2d ago' },
      ],
      tasks: [
        { id: 't1', title: 'Plan Black Friday promos', status: 'In Progress', project: 'Retail Ops', due: 'Nov 22', assignee: 'Alex' },
        { id: 't2', title: 'Update POS configs', status: 'Todo', project: 'POS Upgrade', due: 'Oct 10', assignee: 'Maria' },
        { id: 't3', title: 'Vendor negotiation', status: 'In Progress', project: 'Supply Chain', due: 'Sep 30', assignee: 'Diego' },
        { id: 't4', title: 'Store audit templates', status: 'Done', project: 'Quality', due: 'Sep 01', assignee: 'Sofia' },
      ],
      projects: [
        { id: 'p1', name: 'Store Renovations', stage: 'active', owner: 'Alex', deadline: 'Dec 15', description: 'Modernize top 5 locations.' },
        { id: 'p2', name: 'POS Upgrade', stage: 'planning', owner: 'Maria', deadline: 'Oct 20', description: 'New hardware + software.' },
        { id: 'p3', name: 'Supply Chain Revamp', stage: 'active', owner: 'Diego', deadline: 'Nov 11', description: 'Improve lead times.' },
      ],
      team: [
        { id: 'u1', name: 'Alex Doe', role: 'Ops Lead', email: 'alex@example.com' },
        { id: 'u2', name: 'Maria Garcia', role: 'Retail Design', email: 'maria@example.com' },
        { id: 'u3', name: 'Diego Torres', role: 'Supply Chain', email: 'diego@example.com' },
        { id: 'u4', name: 'Sofia Alvarez', role: 'QA Lead', email: 'sofia@example.com' },
      ],
      reportBarData: [
        { month: 'Jan', revenue: 42, costs: 30, profit: 12 },
        { month: 'Feb', revenue: 45, costs: 31, profit: 14 },
        { month: 'Mar', revenue: 48, costs: 33, profit: 15 },
        { month: 'Apr', revenue: 51, costs: 35, profit: 16 },
        { month: 'May', revenue: 53, costs: 36, profit: 17 },
        { month: 'Jun', revenue: 56, costs: 38, profit: 18 },
        { month: 'Jul', revenue: 59, costs: 40, profit: 19 },
        { month: 'Aug', revenue: 62, costs: 41, profit: 21 },
      ],
    }
  },
  manufacturing: {
    label: 'Manufactura',
    data: {
      kpis: { projects: 9, openTasks: 210, team: 35, revenue: 780200 },
      revenueByMonth: [
        { month: 'Jan', revenue: 60000 },
        { month: 'Feb', revenue: 64000 },
        { month: 'Mar', revenue: 70000 },
        { month: 'Apr', revenue: 72000 },
        { month: 'May', revenue: 76000 },
        { month: 'Jun', revenue: 82000 },
        { month: 'Jul', revenue: 86000 },
        { month: 'Aug', revenue: 90000 },
      ],
      tasksByStatus: [
        { id: 'todo', label: 'Todo', value: 80 },
        { id: 'inprogress', label: 'In Progress', value: 90 },
        { id: 'done', label: 'Done', value: 40 },
      ],
      activityFeed: [
        { id: 'a1', text: 'WO-324 completed with 97% yield', time: '3h ago' },
        { id: 'a2', text: 'New BOM version approved', time: '8h ago' },
        { id: 'a3', text: 'Supplier shipment delayed', time: '1d ago' },
        { id: 'a4', text: 'Inventory level reached threshold', time: '2d ago' },
      ],
      tasks: [
        { id: 't1', title: 'Schedule maintenance', status: 'Todo', project: 'Factory Ops', due: 'Sep 25', assignee: 'Alex' },
        { id: 't2', title: 'Optimize BOM costs', status: 'In Progress', project: 'Costing', due: 'Oct 05', assignee: 'Maria' },
        { id: 't3', title: 'Quality audit', status: 'In Progress', project: 'QA', due: 'Sep 13', assignee: 'Sofia' },
        { id: 't4', title: 'Line balancing study', status: 'Done', project: 'Industrial Eng.', due: 'Sep 02', assignee: 'Diego' },
      ],
      projects: [
        { id: 'p1', name: 'WO Optimization', stage: 'active', owner: 'Sofia', deadline: 'Dec 01', description: 'Improve throughput and yield.' },
        { id: 'p2', name: 'Warehouse Layout', stage: 'planning', owner: 'Alex', deadline: 'Oct 22', description: 'New storage locations.' },
      ],
      team: [
        { id: 'u1', name: 'Alex Doe', role: 'Ops Manager', email: 'alex@example.com' },
        { id: 'u2', name: 'Maria Garcia', role: 'Industrial Designer', email: 'maria@example.com' },
        { id: 'u3', name: 'Diego Torres', role: 'Process Engineer', email: 'diego@example.com' },
        { id: 'u4', name: 'Sofia Alvarez', role: 'QA Lead', email: 'sofia@example.com' },
        { id: 'u5', name: 'Camila Rojas', role: 'Planner', email: 'camila@example.com' },
      ],
      reportBarData: [
        { month: 'Jan', revenue: 60, costs: 38, profit: 22 },
        { month: 'Feb', revenue: 64, costs: 39, profit: 25 },
        { month: 'Mar', revenue: 70, costs: 42, profit: 28 },
        { month: 'Apr', revenue: 72, costs: 44, profit: 28 },
        { month: 'May', revenue: 76, costs: 47, profit: 29 },
        { month: 'Jun', revenue: 82, costs: 50, profit: 32 },
        { month: 'Jul', revenue: 86, costs: 53, profit: 33 },
        { month: 'Aug', revenue: 90, costs: 56, profit: 34 },
      ],
    }
  },
  services: {
    label: 'Servicios Profesionales',
    data: {
      kpis: { projects: 24, openTasks: 62, team: 12, revenue: 184200 },
      revenueByMonth: [
        { month: 'Jan', revenue: 12000 },
        { month: 'Feb', revenue: 14000 },
        { month: 'Mar', revenue: 16000 },
        { month: 'Apr', revenue: 17000 },
        { month: 'May', revenue: 18000 },
        { month: 'Jun', revenue: 20000 },
        { month: 'Jul', revenue: 22000 },
        { month: 'Aug', revenue: 23000 },
      ],
      tasksByStatus: [
        { id: 'todo', label: 'Todo', value: 18 },
        { id: 'inprogress', label: 'In Progress', value: 28 },
        { id: 'done', label: 'Done', value: 16 },
      ],
      activityFeed: [
        { id: 'a1', text: 'Client workshop scheduled', time: '2h ago' },
        { id: 'a2', text: 'Proposal accepted by Acme Co.', time: '8h ago' },
        { id: 'a3', text: 'New SOW drafted', time: '1d ago' },
        { id: 'a4', text: 'Retainer renewed', time: '3d ago' },
      ],
      tasks: [
        { id: 't1', title: 'Write project brief', status: 'Todo', project: 'Discovery', due: 'Sep 18', assignee: 'Alex' },
        { id: 't2', title: 'Design sprint setup', status: 'In Progress', project: 'Design', due: 'Sep 11', assignee: 'Maria' },
        { id: 't3', title: 'Client review meeting', status: 'Done', project: 'Delivery', due: 'Sep 05', assignee: 'Sofia' },
      ],
      projects: [
        { id: 'p1', name: 'Website Audit', stage: 'completed', owner: 'Alex', deadline: 'Aug 21', description: 'SEO + UX improvements.' },
        { id: 'p2', name: 'Brand Refresh', stage: 'active', owner: 'Maria', deadline: 'Oct 03', description: 'Visual identity update.' },
        { id: 'p3', name: 'Content Strategy', stage: 'planning', owner: 'Camila', deadline: 'Oct 15', description: 'Editorial calendar.' },
      ],
      team: [
        { id: 'u1', name: 'Alex Doe', role: 'Account Lead', email: 'alex@example.com' },
        { id: 'u2', name: 'Maria Garcia', role: 'Designer', email: 'maria@example.com' },
        { id: 'u3', name: 'Sofia Alvarez', role: 'Project Manager', email: 'sofia@example.com' },
      ],
      reportBarData: [
        { month: 'Jan', revenue: 12, costs: 7, profit: 5 },
        { month: 'Feb', revenue: 14, costs: 8, profit: 6 },
        { month: 'Mar', revenue: 16, costs: 9, profit: 7 },
        { month: 'Apr', revenue: 17, costs: 10, profit: 7 },
        { month: 'May', revenue: 18, costs: 10, profit: 8 },
        { month: 'Jun', revenue: 20, costs: 11, profit: 9 },
        { month: 'Jul', revenue: 22, costs: 12, profit: 10 },
        { month: 'Aug', revenue: 23, costs: 12, profit: 11 },
      ],
    }
  },
}
