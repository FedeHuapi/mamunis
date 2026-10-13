import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'

import { api } from '../api/client'
import { renderizarEnRuta } from '../test/render'
import { FichaProducto } from './FichaProducto'

vi.mock('../api/client', () => ({ api: { GET: vi.fn(), POST: vi.fn() } }))

const SESION = '11111111-1111-1111-1111-111111111111'
const NUEVA_SESION = '22222222-2222-2222-2222-222222222222'

const PRODUCTO = {
  id: 2,
  nombre: 'Remera Dino',
  descripcion: 'Algodón suave.',
  precio: '5000.00',
  categoria_id: 1,
  imagen: null,
  categoria: { id: 1, nombre: 'Remeras', descripcion: null },
  variantes: [
    { id: 1, talla: '10', stock: 5 },
    { id: 2, talla: '12', stock: 2 },
    { id: 3, talla: '14', stock: 0 },
  ],
}

const CARRITO = { session_id: SESION, fecha_creacion: '2026-10-07T12:00:00Z', total: '5000.00', items: [] }

const respuesta = (status: number, data?: unknown, error?: unknown) =>
  ({ data, error, response: { status, ok: status < 400 } }) as never

const renderizar = (url = '/productos/2') => renderizarEnRuta(<FichaProducto />, { ruta: '/productos/:id', url })

beforeEach(() => {
  localStorage.clear()
  vi.mocked(api.GET).mockReset().mockResolvedValue(respuesta(200, PRODUCTO))
  vi.mocked(api.POST).mockReset()
})

it('muestra el producto y no deja agregar sin elegir talle', async () => {
  renderizar()

  expect(await screen.findByRole('heading', { name: 'Remera Dino' })).toBeInTheDocument()
  expect(screen.getByText('Algodón suave.')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Agregar al carrito' })).toBeDisabled()
  expect(screen.getByText('Elegí un talle para agregarlo.')).toBeInTheDocument()
})

it('avisa cuando quedan pocas unidades del talle elegido', async () => {
  renderizar()

  await userEvent.click(await screen.findByRole('radio', { name: '12' }))

  expect(screen.getByText('Quedan 2 unidades en talle 12.')).toBeInTheDocument()
})

it('la primera vez crea el carrito, lo recuerda y agrega el talle elegido', async () => {
  vi.mocked(api.POST).mockImplementation((async (ruta: string) =>
    ruta === '/carrito/' ? respuesta(201, { session_id: SESION }) : respuesta(201, CARRITO)) as never)
  renderizar()

  await userEvent.click(await screen.findByRole('radio', { name: '12' }))
  await userEvent.click(screen.getByRole('button', { name: 'Agregar al carrito' }))

  expect(await screen.findByText(/Agregado al carrito/)).toBeInTheDocument()
  expect(localStorage.getItem('mamunis.carrito')).toBe(SESION)
  expect(api.POST).toHaveBeenLastCalledWith('/carrito/{session_id}/items', {
    params: { path: { session_id: SESION } },
    body: { variante_id: 2, cantidad: 1 },
  })
})

it('si ya hay un carrito, lo usa en lugar de crear otro', async () => {
  localStorage.setItem('mamunis.carrito', SESION)
  vi.mocked(api.POST).mockResolvedValue(respuesta(201, CARRITO))
  renderizar()

  await userEvent.click(await screen.findByRole('radio', { name: '10' }))
  await userEvent.click(screen.getByRole('button', { name: 'Agregar al carrito' }))

  await screen.findByText(/Agregado al carrito/)
  expect(api.POST).toHaveBeenCalledTimes(1)
})

it('si el carrito guardado ya no existe, crea uno nuevo y reintenta', async () => {
  localStorage.setItem('mamunis.carrito', SESION)
  vi.mocked(api.POST)
    .mockResolvedValueOnce(respuesta(404, undefined, { detail: 'Carrito no encontrado' }))
    .mockResolvedValueOnce(respuesta(201, { session_id: NUEVA_SESION }))
    .mockResolvedValueOnce(respuesta(201, { ...CARRITO, session_id: NUEVA_SESION }))
  renderizar()

  await userEvent.click(await screen.findByRole('radio', { name: '10' }))
  await userEvent.click(screen.getByRole('button', { name: 'Agregar al carrito' }))

  await screen.findByText(/Agregado al carrito/)
  expect(localStorage.getItem('mamunis.carrito')).toBe(NUEVA_SESION)
})

it('si no alcanza el stock, muestra el motivo que da el backend', async () => {
  localStorage.setItem('mamunis.carrito', SESION)
  vi.mocked(api.POST).mockResolvedValue(respuesta(422, undefined, { detail: 'Stock insuficiente. Disponible: 2' }))
  renderizar()

  await userEvent.click(await screen.findByRole('radio', { name: '12' }))
  await userEvent.click(screen.getByRole('button', { name: 'Agregar al carrito' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Stock insuficiente. Disponible: 2')
})

it('un producto que no existe muestra la pagina de no encontrado', async () => {
  vi.mocked(api.GET).mockResolvedValue(respuesta(404, undefined, { detail: 'Producto no encontrado' }))

  renderizar('/productos/999')

  expect(await screen.findByRole('heading', { name: 'No encontramos esa página' })).toBeInTheDocument()
})

it('un id que no es un numero no llama a la API', async () => {
  renderizar('/productos/abc')

  expect(await screen.findByRole('heading', { name: 'No encontramos esa página' })).toBeInTheDocument()
  expect(api.GET).not.toHaveBeenCalled()
})
