import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'

import { api } from '../api/client'
import { renderizarEnRuta } from '../test/render'
import { Checkout } from './Checkout'

vi.mock('../api/client', () => ({ api: { GET: vi.fn(), POST: vi.fn() } }))

const SESION = '11111111-1111-1111-1111-111111111111'

const CARRITO = {
  session_id: SESION,
  fecha_creacion: '2026-10-09T12:00:00Z',
  total: '10000.00',
  items: [
    {
      id: 7,
      variante_id: 3,
      talla: '12',
      cantidad: 2,
      producto: { id: 2, nombre: 'Remera Dino', precio: '5000.00', imagen: null },
    },
  ],
}

const PEDIDO = {
  id: 41,
  estado: 'pendiente',
  nombre_contacto: 'Ana Pérez',
  email_contacto: 'ana@ejemplo.com',
  telefono_contacto: '11 2345-6789',
  direccion_envio: 'Calle Falsa 123',
  total: '10000.00',
  fecha_creacion: '2026-10-09T12:05:00Z',
  items: [],
}

const respuesta = (status: number, data?: unknown, error?: unknown) =>
  ({ data, error, response: { status, ok: status < 400 } }) as never

async function completar() {
  await userEvent.type(screen.getByLabelText('Nombre y apellido'), '  Ana Pérez ')
  await userEvent.type(screen.getByLabelText('WhatsApp'), '11 2345-6789')
  await userEvent.type(screen.getByLabelText('Email'), 'ana@ejemplo.com')
  await userEvent.type(screen.getByLabelText('Dirección de entrega'), 'Calle Falsa 123')
}

const confirmar = () => userEvent.click(screen.getByRole('button', { name: 'Confirmar pedido' }))

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('mamunis.carrito', SESION)
  vi.mocked(api.GET).mockReset().mockResolvedValue(respuesta(200, CARRITO))
  vi.mocked(api.POST).mockReset()
})

it('muestra el resumen del pedido', async () => {
  renderizarEnRuta(<Checkout />)

  expect(await screen.findByText('2 × Remera Dino')).toBeInTheDocument()
  expect(screen.getByText('Talle 12')).toBeInTheDocument()
  expect(screen.getAllByText(/10\.000/)).toHaveLength(2)
})

it('con el formulario vacio no manda nada, marca los campos y lleva al primero', async () => {
  renderizarEnRuta(<Checkout />)
  await screen.findByRole('heading', { name: 'Finalizar compra' })

  await confirmar()

  expect(api.POST).not.toHaveBeenCalled()
  const nombre = screen.getByLabelText('Nombre y apellido')
  expect(nombre).toHaveAttribute('aria-invalid', 'true')
  expect(nombre).toHaveAccessibleDescription('Escribí tu nombre y apellido.')
  expect(nombre).toHaveFocus()
  expect(screen.getByLabelText('WhatsApp')).toHaveAttribute('aria-invalid', 'true')
})

it('el aviso de un campo se va cuando se empieza a corregir', async () => {
  renderizarEnRuta(<Checkout />)
  await screen.findByRole('heading', { name: 'Finalizar compra' })
  await confirmar()

  await userEvent.type(screen.getByLabelText('Nombre y apellido'), 'A')

  expect(screen.getByLabelText('Nombre y apellido')).toHaveAttribute('aria-invalid', 'false')
  expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
})

it('manda solo el contacto y el identificador del carrito, y va a la confirmacion', async () => {
  vi.mocked(api.POST).mockResolvedValue(respuesta(201, PEDIDO))
  const router = renderizarEnRuta(<Checkout />, { ruta: '/checkout', url: '/checkout' })
  await screen.findByRole('heading', { name: 'Finalizar compra' })

  await completar()
  await confirmar()

  await waitFor(() => expect(router.state.location.pathname).toBe('/pedido-confirmado'))
  expect(router.state.location.state).toEqual({ pedido: PEDIDO })
  // Ni productos, ni cantidades, ni total: eso lo decide el backend.
  expect(api.POST).toHaveBeenCalledWith('/pedidos/', {
    body: {
      session_id: SESION,
      nombre_contacto: 'Ana Pérez',
      email_contacto: 'ana@ejemplo.com',
      telefono_contacto: '11 2345-6789',
      direccion_envio: 'Calle Falsa 123',
    },
  })
})

it('si alguien compro antes, muestra el motivo y ofrece revisar el carrito', async () => {
  const motivo = "Stock insuficiente para 'Remera Dino' talle 12. Disponible: 1"
  vi.mocked(api.POST).mockResolvedValue(respuesta(422, undefined, { detail: motivo }))
  renderizarEnRuta(<Checkout />)
  await screen.findByRole('heading', { name: 'Finalizar compra' })

  await completar()
  await confirmar()

  expect(await screen.findByRole('alert')).toHaveTextContent(motivo)
  expect(screen.getByRole('link', { name: 'Revisar el carrito' })).toHaveAttribute('href', '/carrito')
  expect(screen.getByLabelText('Nombre y apellido')).toHaveValue('  Ana Pérez ') // no se pierde lo escrito
})

it('un error de validacion del backend muestra un mensaje generico, no la lista tecnica', async () => {
  const detalleTecnico = [{ loc: ['body', 'email_contacto'], msg: 'value is not a valid email address', type: 'value_error' }]
  vi.mocked(api.POST).mockResolvedValue(respuesta(422, undefined, { detail: detalleTecnico }))
  renderizarEnRuta(<Checkout />)
  await screen.findByRole('heading', { name: 'Finalizar compra' })

  await completar()
  await confirmar()

  expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos registrar tu pedido. Probá de nuevo.')
})

it('mientras se envia no se puede confirmar dos veces', async () => {
  vi.mocked(api.POST).mockReturnValue(new Promise(() => {}) as never) // nunca responde
  renderizarEnRuta(<Checkout />)
  await screen.findByRole('heading', { name: 'Finalizar compra' })

  await completar()
  await confirmar()

  expect(await screen.findByRole('button', { name: 'Enviando tu pedido…' })).toBeDisabled()
  expect(api.POST).toHaveBeenCalledTimes(1)
})

it('con el carrito vacio no muestra el formulario', async () => {
  vi.mocked(api.GET).mockResolvedValue(respuesta(200, { ...CARRITO, items: [], total: '0' }))

  renderizarEnRuta(<Checkout />)

  expect(await screen.findByRole('heading', { name: 'No hay nada para comprar todavía' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Confirmar pedido' })).not.toBeInTheDocument()
})
