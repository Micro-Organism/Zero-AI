import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { StepsPage } from '@/pages/StepsPage'
import { RuntimePage } from '@/pages/RuntimePage'
import { EffectsPage } from '@/pages/EffectsPage'
import { SetupPage } from '@/pages/SetupPage'
import { ConceptsPage } from '@/pages/ConceptsPage'
import { DataPage } from '@/pages/DataPage'
import { FinetunePage } from '@/pages/FinetunePage'
import { EvalPage } from '@/pages/EvalPage'
import { ExportPage } from '@/pages/ExportPage'
import { DataCraftPage } from '@/pages/DataCraftPage'
import { HparamsPage } from '@/pages/HparamsPage'
import { RetrainPage } from '@/pages/RetrainPage'
import { EngineeringPage } from '@/pages/EngineeringPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'setup', element: <SetupPage /> },
      { path: 'concepts', element: <ConceptsPage /> },
      { path: 'data', element: <DataPage /> },
      { path: 'finetune', element: <FinetunePage /> },
      { path: 'eval', element: <EvalPage /> },
      { path: 'export', element: <ExportPage /> },
      { path: 'data-craft', element: <DataCraftPage /> },
      { path: 'hparams', element: <HparamsPage /> },
      { path: 'retrain', element: <RetrainPage /> },
      { path: 'engineering', element: <EngineeringPage /> },
      { path: 'steps', element: <StepsPage /> },
      { path: 'runtime', element: <RuntimePage /> },
      { path: 'effects', element: <EffectsPage /> },
    ],
  },
])
