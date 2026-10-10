import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { expect, it } from 'vitest'

import { PedidoConfirmado } from './PedidoConfirmado'

const PEDIDO = {
  id: 41,
  estado: 'pendiente',
  nombre_contacto: 'Ana Pérez',
  email_contacto: 'ana@ejemplo.com',
  telefono_contacto: '11 2345-6789',
  direccion_envio: 'Calle Falsa 123',
  total: '13000.00',
  fecha_creacion: '2026-10-09T12:05:00Z',
  items: [
    { id: 1, talla: '12', cantidad: 2, precio_unitario: '5000.00', producto: { id: 2, nombre: 'Remera Dino', imagen: null } },
    { id: 2, talla: '10', cantidad: 1, precio_unitario: '3000.00', producto: { id: 5, nombre: 'Short', imagen: null } },
  ],
}

function renderizar(state?: unknown) {
  const router = createMemoryRouter([{ path: '/pedido-confirmado', element: <PedidoConfirmado /> }], {
    initialEntries: [{ pathname: '/pedido-confirmado', state }],
  })
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

it('muestra el numero de pedido y por donde se va a contactar al cliente', () => {
  renderizar({ pedido: PEDIDO })

  expect(screen.getByRole('heading', { name: '¡Recibimos tu pedido!' })).toBeInTheDocument()
  expect(screen.getByText('Pedido N.º 41')).toBeInTheDocument()
  expect(screen.getByText(/te vamos a escribir por WhatsApp al/)).toHaveTextContent('11 2345-6789')
})

it('muestra lo que se pidio con el precio del pedido, el total y la direccion', () => {
  renderizar({ pedido: PEDIDO })

  expect(screen.getByText('2 × Remera Dino')).toBeInTheDocument()
  expect(screen.getByText(/10\.000/)).toBeInTheDocument() // 2 x 5000
  expect(screen.getByText(/13\.000/)).toBeInTheDocument()
  expect(screen.getByText('Calle Falsa 123')).toBeInTheDocument()
})

it('si se entra directo, sin haber comprado, lo dice en lugar de romperse', () => {
  renderizar()

  expect(screen.getByRole('heading', { name: 'No hay un pedido para mostrar' })).toBeInTheDocument()
})
