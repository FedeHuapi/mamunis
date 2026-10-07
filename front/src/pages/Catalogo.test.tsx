import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, expect, it, vi } from 'vitest'

import { api } from '../api/client'
import { Catalogo } from './Catalogo'

// Se reemplaza la llamada a la API: los tests del front no necesitan el backend corriendo.
vi.mock('../api/client', () => ({ api: { GET: vi.fn() } }))

const CATEGORIAS = [
  { id: 1, nombre: 'Remeras', descripcion: null },
  { id: 2, nombre: 'Buzos', descripcion: null },
]

function producto(id: number) {
  return {
    id,
    nombre: `Remera ${id}`,
    descripcion: null,
    precio: '5000.00',
    categoria_id: 1,
    imagen: null,
    categoria: CATEGORIAS[0],
    variantes: [{ id, talla: '10', stock: 1 }],
  }
}

const getMock = vi.mocked(api.GET)

beforeEach(() => {
  getMock.mockReset()
  getMock.mockImplementation((async (ruta: string) => {
    if (ruta === '/categorias/') return { data: { total: 2, items: CATEGORIAS } }
    return { data: { total: 30, items: [producto(1), producto(2)] } }
  }) as never)
})

function renderizar(url = '/') {
  const router = createMemoryRouter([{ path: '/', element: <Catalogo /> }], { initialEntries: [url] })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

function parametrosDelUltimoPedido() {
  const llamadas = getMock.mock.calls.filter(([ruta]) => ruta === '/productos/')
  const opciones = llamadas.at(-1)?.[1] as { params: { query: Record<string, unknown> } } | undefined
  if (!opciones) throw new Error('No se pidieron productos')
  return opciones.params.query
}

it('muestra los productos y la paginacion', async () => {
  renderizar()

  expect(await screen.findByRole('link', { name: 'Remera 1' })).toHaveAttribute('href', '/productos/1')
  expect(screen.getByText('Página 1 de 3')).toBeInTheDocument()
})

it('filtrar por categoria pide solo esa categoria y vuelve a la primera pagina', async () => {
  const router = renderizar('/?pagina=2')
  await screen.findByText('Página 2 de 3')

  await userEvent.click(screen.getByRole('button', { name: 'Buzos' }))

  expect(router.state.location.search).toBe('?categoria=2')
  expect(parametrosDelUltimoPedido()).toMatchObject({ categoria_id: 2, skip: 0 })
  expect(screen.getByRole('button', { name: 'Buzos' })).toHaveAttribute('aria-pressed', 'true')
})

it('la pagina siguiente pide los productos que siguen', async () => {
  const router = renderizar()
  await screen.findByText('Página 1 de 3')

  await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }))

  expect(router.state.location.search).toBe('?pagina=2')
  expect(parametrosDelUltimoPedido()).toMatchObject({ skip: 12, limit: 12 })
})

it('un parametro invalido en la URL no rompe la pagina', async () => {
  renderizar('/?pagina=abc&categoria=-5')

  await screen.findByText('Página 1 de 3')
  expect(parametrosDelUltimoPedido()).toMatchObject({ skip: 0, categoria_id: undefined })
})

it('si la API falla muestra un mensaje', async () => {
  getMock.mockImplementation((async () => ({ error: { detail: 'error' } })) as never)

  renderizar()

  expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar los productos')
})
