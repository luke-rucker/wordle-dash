import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { App } from './app.tsx'
import * as Sentry from '@sentry/react'
import { Splash } from '@/components/splash.tsx'

Sentry.init({
  dsn: 'https://11f3b4514100a58ffebeaad3ea28cc07@o4505976873746432.ingest.sentry.io/4505976879972352',
  enabled: import.meta.env.PROD,
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<Splash type="500" />}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
)
