import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'

import { api } from '../api/client'
import { renderizarEnRuta } from '../test/render'
import { Carrito } from './Carrito'

vi.mock('../api/client', () => ({ api: { GET: vi.fn(), POST: vi.fn(), PATCH: vi.fn(), DELETE: vi.fn() } }))

const SESION = '11111111-1111-1111-1111-111111111111'

function carrito(cantidad: number) {
  return {
    session_id: SESION,
    fecha_creacion: '2026-10-07T12:00:00Z',
    total: String(5000 * cantidad),
    items: [
      {
        id: 7,
        variante_id: 3,
        talla: '12',
        cantidad,
        producto: { id: 2, nombre: 'Remera Dino', precio: '5000.00', imagen: null },
      },
    ],
  }
}

const respuesta = (status: number, data?: unknown, error?: unknown) =>
  ({ data, error, response: { status, ok: status < 400 } }) as never

beforeEach(() => {
  localStorage.clear()
  vi.mocked(api.GET).mockReset()
  vi.mocked(api.PATCH).mockReset()
  vi.mocked(api.DELETE).mockReset()
})

it('sin carrito guardado muestra el carrito vacio y no llama a la API', async () => {
  renderizarEnRuta(<Carrito />)

  expect(await screen.findByRole('heading', { name: 'Tu carrito está vacío' })).toBeInTheDocument()
  expect(api.GET).not.toHaveBeenCalled()
})

it('muestra los productos, el talle y el total', async () => {
  localStorage.setItem('mamunis.carrito', SESION)
  vi.mocked(api.GET).mockResolvedValue(respuesta(200, carrito(2)))

  renderizarEnRuta(<Carrito />)

  expect(await screen.findByRole('link', { name: 'Remera Dino' })).toHaveAttribute('href', '/productos/2')
  expect(screen.getByText('Talle 12')).toBeInTheDocument()
  expect(screen.getByLabelText('Cantidad de Remera Dino, talle 12')).toHaveTextContent('2')
  expect(screen.getAllByText(/10\.000/)).toHaveLength(2) // subtotal del item y total
})

it('si el carrito guardado ya no existe, se olvida y se muestra vacio', async () => {
  localStorage.setItem('mamunis.carrito', SESION)
  vi.mocked(api.GET).mockResolvedValue(respuesta(404, undefined, { detail: 'Carrito no encontrado' }))

  renderizarEnRuta(<Carrito />)

  expect(await screen.findByRole('heading', { name: 'Tu carrito está vacío' })).toBeInTheDocument()
  expect(localStorage.getItem('mamunis.carrito')).toBeNull()
})

it('sumar una unidad pide la cantidad nueva y vuelve a cargar el carrito', async () => {
  localStorage.setItem('mamunis.carrito', SESION)
  vi.mocked(api.GET).mockResolvedValueOnce(respuesta(200, carrito(2))).mockResolvedValue(respuesta(200, carrito(3)))
  vi.mocked(api.PATCH).mockResolvedValue(respuesta(200, carrito(3).items[0]))
  renderizarEnRuta(<Carrito />)

  await userEvent.click(await screen.findByRole('button', { name: 'Agregar una unidad de Remera Dino, talle 12' }))

  expect(api.PATCH).toHaveBeenCalledWith('/carrito/{session_id}/items/{item_id}', {
    params: { path: { session_id: SESION, item_id: 7 } },
    body: { cantidad: 3 },
  })
  await waitFor(() => expect(screen.getByLabelText('Cantidad de Remera Dino, talle 12')).toHaveTextContent('3'))
})

it('si no hay stock para sumar, muestra el motivo que da el backend', async () => {
  localStorage.setItem('mamunis.carrito', SESION)
  vi.mocked(api.GET).mockResolvedValue(respuesta(200, carrito(2)))
  vi.mocked(api.PATCH).mockResolvedValue(respuesta(422, undefined, { detail: 'Stock insuficiente. Disponible: 2' }))
  renderizarEnRuta(<Carrito />)

  await userEvent.click(await screen.findByRole('button', { name: 'Agregar una unidad de Remera Dino, talle 12' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Stock insuficiente. Disponible: 2')
})

it('con una sola unidad no se puede restar', async () => {
  localStorage.setItem('mamunis.carrito', SESION)
  vi.mocked(api.GET).mockResolvedValue(respuesta(200, carrito(1)))

  renderizarEnRuta(<Carrito />)

  expect(await screen.findByRole('button', { name: 'Quitar una unidad de Remera Dino, talle 12' })).toBeDisabled()
})

it('quitar un producto lo borra y vuelve a cargar el carrito', async () => {
  localStorage.setItem('mamunis.carrito', SESION)
  vi.mocked(api.GET)
    .mockResolvedValueOnce(respuesta(200, carrito(2)))
    .mockResolvedValue(respuesta(200, { ...carrito(0), items: [], total: '0' }))
  vi.mocked(api.DELETE).mockResolvedValue(respuesta(204))
  renderizarEnRuta(<Carrito />)

  await userEvent.click(await screen.findByRole('button', { name: 'Quitar Remera Dino, talle 12 del carrito' }))

  expect(api.DELETE).toHaveBeenCalledWith('/carrito/{session_id}/items/{item_id}', {
    params: { path: { session_id: SESION, item_id: 7 } },
  })
  expect(await screen.findByRole('heading', { name: 'Tu carrito está vacío' })).toBeInTheDocument()
})
