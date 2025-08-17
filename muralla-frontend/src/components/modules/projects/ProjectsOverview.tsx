import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import projectsService, { type Project, type ProjectKind } from '../../../services/projectsService'

export default function ProjectsOverview() {
  const { t } = useTranslation()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newProject, setNewProject] = useState<{ name: string; description?: string; kind: ProjectKind; deadline?: string }>({ name: '', description: '', kind: 'DEADLINE', deadline: '' })

  useEffect(() => {
    const load = async () => {
      try {
        const data = await projectsService.getAllProjects()
        setProjects(data)
      } catch (e: any) {
        setError(e?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const kpiFor = (p: Project) => {
    const totalTasks = p.tasks?.length ?? 0
    const done = p.tasks?.filter(t => t.status === 'DONE').length ?? 0
    const progressPct = totalTasks > 0 ? Math.round((done / totalTasks) * 100) : 0
    const planned = sumAmounts(p.budgets?.map(b => b.totalPlanned))
    const committed = sumAmounts(p.budgets?.map(b => b.totalCommitted))
    const actual = sumAmounts(p.budgets?.map(b => b.totalActual))
    return { totalTasks, done, progressPct, planned, committed, actual, currency: p.budgets?.[0]?.currency || 'CLP' }
  }

  const sumAmounts = (vals?: Array<number | string | undefined>) => {
    if (!vals || vals.length === 0) return 0
    return vals.reduce((acc: number, v) => acc + (v ? Number(v) : 0), 0)
  }

  const handleCreate = async () => {
    if (!newProject.name.trim()) return
    try {
      const created = await projectsService.createProject({
        name: newProject.name.trim(),
        description: newProject.description?.trim() || undefined,
        kind: newProject.kind,
        deadline: newProject.kind === 'DEADLINE' && newProject.deadline ? newProject.deadline : undefined,
      })
      setProjects(p => [created, ...p])
      setNewProject({ name: '', description: '', kind: 'DEADLINE', deadline: '' })
    } catch (e: any) {
      setError(e?.message || 'Failed to create')
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse text-neutral-500">{t('common.loadingAuth')}</div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{t('routes.projectsOverview.title')}</h1>
          <p className="text-neutral-500 dark:text-neutral-400">{t('routes.projectsOverview.description')}</p>
        </div>
      </div>

      {/* Create project card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <input className="input flex-1" placeholder="Project name" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} />
          <input className="input flex-1" placeholder="Description" value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} />
          <select className="input" value={newProject.kind} onChange={e => setNewProject({ ...newProject, kind: e.target.value as ProjectKind })}>
            <option value="DEADLINE">Deadline</option>
            <option value="CORE">Core</option>
          </select>
          {newProject.kind === 'DEADLINE' && (
            <input type="date" className="input" value={newProject.deadline} onChange={e => setNewProject({ ...newProject, deadline: e.target.value })} />
          )}
          <button className="btn-primary" onClick={handleCreate}>{t('actions.create')}</button>
        </div>
        {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
      </div>

      {/* Projects list */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map(p => {
          const kpi = kpiFor(p)
          const kindLabel = p.kind === 'CORE' ? 'Core' : 'Deadline'
          return (
            <div key={p.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{p.name}</h3>
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm">{p.description || '—'}</p>
                </div>
                <span className="px-2 py-1 text-xs rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">{kindLabel}</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-neutral-500 dark:text-neutral-400">Progress</div>
                  <div className="font-medium">{kpi.progressPct}%</div>
                </div>
                <div>
                  <div className="text-neutral-500 dark:text-neutral-400">Tasks</div>
                  <div className="font-medium">{kpi.done}/{kpi.totalTasks}</div>
                </div>
                <div>
                  <div className="text-neutral-500 dark:text-neutral-400">Budget</div>
                  <div className="font-medium">{kpi.currency} {Number(kpi.actual || 0).toLocaleString()}</div>
                </div>
              </div>
              {p.kind === 'DEADLINE' && p.deadline && (
                <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">Deadline: {new Date(p.deadline).toLocaleDateString()}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}


