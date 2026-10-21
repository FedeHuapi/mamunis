import { NavLink, Outlet } from 'react-router'

import { estiloChip } from '../../lib/estilos'

const SECCIONES = [
  { ruta: '/admin/pedidos', nombre: 'Pedidos' },
  { ruta: '/admin/productos', nombre: 'Productos' },
  { ruta: '/admin/categorias', nombre: 'Categorías' },
  { ruta: '/admin/arrepentimientos', nombre: 'Arrepentimientos' },
]

/** El marco del panel: el menu de secciones arriba y la seccion elegida abajo. */
export function PanelAdmin() {
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-borde pb-4">
        <p className="font-titulos text-lg font-semibold text-texto-suave">Panel de administración</p>
        <nav aria-label="Secciones del panel" className="flex flex-wrap gap-2">
          {SECCIONES.map(({ ruta, nombre }) => (
            <NavLink
              key={ruta}
              to={ruta}
              className={({ isActive }) => `font-titulos ${estiloChip(isActive)}`}
            >
              {nombre}
            </NavLink>
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  )
}
