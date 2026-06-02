import { useState } from 'react'

import { AppLayout, type AppTab } from './components/AppLayout'
import { MetaSyncProvider } from './context/MetaSyncContext'
import { DamageCalc } from './components/DamageCalc'
import { SearchTab } from './components/SearchTab'
import { SpeedTiers } from './components/SpeedTiers'
import { Teambuilder } from './components/Teambuilder'

function App() {
  const [tab, setTab] = useState<AppTab>('teambuilder')

  return (
    <MetaSyncProvider>
      <AppLayout activeTab={tab} onTabChange={setTab}>
        {tab === 'teambuilder' && <Teambuilder />}
        {tab === 'calc' && <DamageCalc />}
        {tab === 'speed' && <SpeedTiers />}
        {tab === 'search' && <SearchTab />}
      </AppLayout>
    </MetaSyncProvider>
  )
}

export default App
