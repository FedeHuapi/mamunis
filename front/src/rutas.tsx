import { createBrowserRouter } from 'react-router'

import { Layout } from './components/Layout'
import { Catalogo } from './pages/Catalogo'
import { FichaProducto } from './pages/FichaProducto'
import { NoEncontrada } from './pages/NoEncontrada'

export const rutas = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Catalogo /> },
      { path: '/productos/:id', element: <FichaProducto /> },
      { path: '*', element: <NoEncontrada /> },
    ],
  },
])
