export const kpi = (n: number) => Math.floor(n)

export const kpis = {
  projects: 18,
  openTasks: 124,
  team: 22,
  revenue: 324500,
}

export const revenueByMonth = [
  { month: 'Jan', revenue: 22000 },
  { month: 'Feb', revenue: 24500 },
  { month: 'Mar', revenue: 26800 },
  { month: 'Apr', revenue: 30100 },
  { month: 'May', revenue: 28000 },
  { month: 'Jun', revenue: 35000 },
  { month: 'Jul', revenue: 39000 },
  { month: 'Aug', revenue: 41000 },
]

export const tasksByStatus = [
  { id: 'todo', label: 'Todo', value: 40 },
  { id: 'inprogress', label: 'In Progress', value: 58 },
  { id: 'done', label: 'Done', value: 26 },
]

export const activityFeed = [
  { id: 'a1', text: 'Maria completed “Design homepage v2”', time: '2h ago' },
  { id: 'a2', text: 'Carlos updated Project “Q4 Launch Plan”', time: '4h ago' },
  { id: 'a3', text: 'Sofia added 3 new tasks to “Website Refresh”', time: '5h ago' },
  { id: 'a4', text: 'Rafael commented on “Supplier negotiation”', time: '1d ago' },
]

export const tasks = [
  { id: 't1', title: 'Finalize pitch deck', status: 'In Progress', project: 'Investor Relations', due: 'Sep 12', assignee: 'Alex' },
  { id: 't2', title: 'Design dashboard widgets', status: 'Todo', project: 'UI Library', due: 'Sep 20', assignee: 'Maria' },
  { id: 't3', title: 'Implement search API', status: 'In Progress', project: 'Platform', due: 'Sep 14', assignee: 'Diego' },
  { id: 't4', title: 'QA test flows', status: 'Done', project: 'Mobile App', due: 'Sep 03', assignee: 'Sofia' },
  { id: 't5', title: 'Customer interview synthesis', status: 'Todo', project: 'Research', due: 'Sep 16', assignee: 'Camila' },
]

export const projects = [
  { id: 'p1', name: 'Website Refresh', stage: 'active', owner: 'Alex', deadline: 'Oct 28', description: 'Modernize brand site and improve conversion.' },
  { id: 'p2', name: 'Q4 Launch Plan', stage: 'planning', owner: 'Maria', deadline: 'Nov 10', description: 'Prepare cross-functional GTM for Q4.' },
  { id: 'p3', name: 'Mobile App 2.0', stage: 'active', owner: 'Sofia', deadline: 'Dec 02', description: 'Performance and UX improvements.' },
  { id: 'p4', name: 'Data Warehouse', stage: 'completed', owner: 'Diego', deadline: 'Aug 18', description: 'Centralized analytics foundation.' },
  { id: 'p5', name: 'UI Library', stage: 'active', owner: 'Camila', deadline: 'Nov 30', description: 'Reusable design system components.' },
]

export const team = [
  { id: 'u1', name: 'Alex Doe', role: 'Product Manager', email: 'alex@example.com' },
  { id: 'u2', name: 'Maria Garcia', role: 'Designer', email: 'maria@example.com' },
  { id: 'u3', name: 'Diego Torres', role: 'Engineer', email: 'diego@example.com' },
  { id: 'u4', name: 'Sofia Alvarez', role: 'QA Lead', email: 'sofia@example.com' },
  { id: 'u5', name: 'Camila Rojas', role: 'Researcher', email: 'camila@example.com' },
]

export const reportBarData = [
  { month: 'Jan', revenue: 22, costs: 12, profit: 10 },
  { month: 'Feb', revenue: 24, costs: 13, profit: 11 },
  { month: 'Mar', revenue: 26, costs: 15, profit: 11 },
  { month: 'Apr', revenue: 30, costs: 16, profit: 14 },
  { month: 'May', revenue: 28, costs: 14, profit: 14 },
  { month: 'Jun', revenue: 35, costs: 17, profit: 18 },
  { month: 'Jul', revenue: 39, costs: 19, profit: 20 },
  { month: 'Aug', revenue: 41, costs: 20, profit: 21 },
]
