import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'

import '@fontsource-variable/fredoka'
import '@fontsource-variable/nunito'

import './index.css'
import { rutas } from './rutas'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={rutas} />
    </QueryClientProvider>
  </StrictMode>,
)
