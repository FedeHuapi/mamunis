import { createBrowserRouter, Navigate } from 'react-router'

import { Layout } from './components/Layout'
import { RequiereAdmin } from './components/RequiereAdmin'
import { RequiereSesion } from './components/RequiereSesion'
import { AdminCategorias } from './pages/admin/AdminCategorias'
import { AdminPedidos } from './pages/admin/AdminPedidos'
import { AdminProducto } from './pages/admin/AdminProducto'
import { AdminProductos } from './pages/admin/AdminProductos'
import { PanelAdmin } from './pages/admin/PanelAdmin'
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
      {
        path: '/admin',
        element: (
          <RequiereAdmin>
            <PanelAdmin />
          </RequiereAdmin>
        ),
        children: [
          { index: true, element: <Navigate to="/admin/pedidos" replace /> },
          { path: 'pedidos', element: <AdminPedidos /> },
          { path: 'productos', element: <AdminProductos /> },
          { path: 'productos/nuevo', element: <AdminProducto /> },
          { path: 'productos/:id', element: <AdminProducto /> },
          { path: 'categorias', element: <AdminCategorias /> },
        ],
      },
      { path: '*', element: <NoEncontrada /> },
    ],
  },
])
