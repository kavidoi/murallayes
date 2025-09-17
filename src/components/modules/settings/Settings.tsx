import React from 'react'
import { useTranslation } from 'react-i18next'

export default function Settings() {
  const { t, i18n } = useTranslation()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value
    i18n.changeLanguage(lang)
    try { localStorage.setItem('lang', lang) } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{t('pages.settings.title')}</h1>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{t('pages.settings.language')}</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{t('pages.settings.selectLanguage')}</p>
          </div>
          <div>
            <select className="input" value={i18n.language} onChange={handleChange}>
              <option value="es">{t('pages.settings.es')}</option>
              <option value="en">{t('pages.settings.en')}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
