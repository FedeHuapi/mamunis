import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'

/** Dibuja una pagina con lo que necesita alrededor: navegacion y datos de la API. */
export function renderizarEnRuta(elemento: ReactElement, { ruta = '/', url = '/' } = {}) {
  const router = createMemoryRouter(
    [
      { path: ruta, element: elemento },
      { path: '*', element: <p>otra pagina</p> },
    ],
    { initialEntries: [url] },
  )
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}
