import { createBrowserRouter } from 'react-router'

import { Layout } from './components/Layout'
import { RequiereSesion } from './components/RequiereSesion'
import { Carrito } from './pages/Carrito'
import { Catalogo } from './pages/Catalogo'
import { Checkout } from './pages/Checkout'
import { FichaProducto } from './pages/FichaProducto'
import { Ingresar } from './pages/Ingresar'
import { MiCuenta } from './pages/MiCuenta'
import { NoEncontrada } from './pages/NoEncontrada'
import { PedidoConfirmado } from './pages/PedidoConfirmado'
import { Registro } from './pages/Registro'

export const rutas = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Catalogo /> },
      { path: '/productos/:id', element: <FichaProducto /> },
      { path: '/carrito', element: <Carrito /> },
      { path: '/checkout', element: <Checkout /> },
      { path: '/pedido-confirmado', element: <PedidoConfirmado /> },
      { path: '/ingresar', element: <Ingresar /> },
      { path: '/registro', element: <Registro /> },
      {
        path: '/mi-cuenta',
        element: <RequiereSesion>{(usuario) => <MiCuenta usuario={usuario} />}</RequiereSesion>,
      },
      { path: '*', element: <NoEncontrada /> },
    ],
  },
])
