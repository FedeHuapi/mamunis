import { NavLink, Outlet } from 'react-router'

const SECCIONES = [
  { ruta: '/admin/pedidos', nombre: 'Pedidos' },
  { ruta: '/admin/productos', nombre: 'Productos' },
  { ruta: '/admin/categorias', nombre: 'Categorías' },
]

/** El marco del panel: el menu de secciones arriba y la seccion elegida abajo. */
export function PanelAdmin() {
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-b-2 border-tinta pb-4">
        <p className="font-titulos text-lg font-semibold text-texto-suave">Panel de administración</p>
        <nav aria-label="Secciones del panel" className="flex flex-wrap gap-2">
          {SECCIONES.map(({ ruta, nombre }) => (
            <NavLink
              key={ruta}
              to={ruta}
              className={({ isActive }) =>
                `rounded-full border-2 border-tinta px-4 py-1.5 font-titulos font-semibold ${
                  isActive ? 'bg-tinta text-fondo' : 'bg-white hover:bg-amarillo'
                }`
              }
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
