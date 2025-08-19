import { useTranslation } from 'react-i18next'

function TasksList() {
  const { t } = useTranslation()
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">{t('routes.tasks.title') || 'Tasks'}</h1>
      <p className="text-neutral-600 dark:text-neutral-300">
        {t('common.comingSoon') || 'This page is temporarily unavailable while we refactor the component.'}
      </p>
    </div>
  )
}

export default TasksList
