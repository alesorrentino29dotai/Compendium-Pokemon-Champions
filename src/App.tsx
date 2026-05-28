import { useState } from 'react'

import { AppLayout, type AppTab } from './components/AppLayout'
import { DamageCalc } from './components/DamageCalc'
import { SpeedTiers } from './components/SpeedTiers'
import { Teambuilder } from './components/Teambuilder'

function App() {
  const [tab, setTab] = useState<AppTab>('teambuilder')

  return (
    <AppLayout activeTab={tab} onTabChange={setTab}>
      {tab === 'teambuilder' && <Teambuilder />}
      {tab === 'calc' && <DamageCalc />}
      {tab === 'speed' && <SpeedTiers />}
    </AppLayout>
  )
}

export default App
