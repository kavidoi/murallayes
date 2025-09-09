import React, { createContext, useContext, useMemo, useState } from 'react'
import { scenarios, ScenarioKey, ScenarioData } from '../data/scenarios'

interface DemoContextValue {
  scenario: ScenarioKey
  setScenario: (s: ScenarioKey) => void
  presentationMode: boolean
  togglePresentation: () => void
  data: ScenarioData
  scenarioOptions: { key: ScenarioKey; label: string }[]
}

const DemoContext = createContext<DemoContextValue | undefined>(undefined)

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [scenario, setScenario] = useState<ScenarioKey>('general')
  const [presentationMode, setPresentation] = useState(false)

  const value: DemoContextValue = useMemo(() => ({
    scenario,
    setScenario,
    presentationMode,
    togglePresentation: () => setPresentation((v) => !v),
    data: scenarios[scenario].data,
    scenarioOptions: (Object.keys(scenarios) as ScenarioKey[]).map((key) => ({ key, label: scenarios[key].label })),
  }), [scenario, presentationMode])

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  )
}

export function useDemo() {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemo must be used within DemoProvider')
  return ctx
}
