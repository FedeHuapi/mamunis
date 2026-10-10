import { createBrowserRouter } from 'react-router'

import { Layout } from './components/Layout'
import { Carrito } from './pages/Carrito'
import { Catalogo } from './pages/Catalogo'
import { Checkout } from './pages/Checkout'
import { FichaProducto } from './pages/FichaProducto'
import { NoEncontrada } from './pages/NoEncontrada'
import { PedidoConfirmado } from './pages/PedidoConfirmado'

export const rutas = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Catalogo /> },
      { path: '/productos/:id', element: <FichaProducto /> },
      { path: '/carrito', element: <Carrito /> },
      { path: '/checkout', element: <Checkout /> },
      { path: '/pedido-confirmado', element: <PedidoConfirmado /> },
      { path: '*', element: <NoEncontrada /> },
    ],
  },
])
