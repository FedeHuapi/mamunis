import { Link, Outlet } from 'react-router'

import { cantidadDeUnidades, useCarrito } from '../api/carrito'
import { useUsuario } from '../api/usuarios'
import logo from '../assets/logo.png'

export function Layout() {
  const unidades = cantidadDeUnidades(useCarrito().data)
  const usuario = useUsuario().data

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-borde bg-fondo">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" aria-label="Mamunis, ir al inicio">
            <img src={logo} alt="" className="h-16 w-auto md:h-20" />
          </Link>
          <nav aria-label="Principal" className="flex flex-wrap items-center justify-end gap-1 font-titulos text-lg font-medium text-tinta">
            <Link to="/" className="rounded-full px-4 py-2 transition hover:bg-arena">
              Productos
            </Link>
            <Link to="/carrito" className="flex items-center gap-2 rounded-full bg-tinta px-4 py-2 text-fondo shadow-boton transition hover:bg-amarillo hover:text-tinta">
              Carrito
              {unidades > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-amarillo px-2 text-sm text-tinta">
                  {unidades}
                  <span className="sr-only"> {unidades === 1 ? 'producto' : 'productos'}</span>
                </span>
              )}
            </Link>
            {usuario?.es_admin && (
              <Link to="/admin" className="rounded-full px-4 py-2 transition hover:bg-arena">
                Administrar
              </Link>
            )}
            {usuario ? (
              <Link to="/mi-cuenta" className="rounded-full px-4 py-2 transition hover:bg-arena">
                Mi cuenta
              </Link>
            ) : (
              <Link to="/ingresar" className="rounded-full px-4 py-2 transition hover:bg-arena">
                Ingresar
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-borde bg-arena py-8 text-center text-sm text-tinta">
        <p className="font-titulos text-lg">Mamunis</p>
        <p className="text-texto-suave">Ropa infantil</p>
      </footer>
    </div>
  )
}
