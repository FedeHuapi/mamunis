import { Link, Outlet } from 'react-router'

import logo from '../assets/logo.png'

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b-2 border-tinta bg-fondo">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" aria-label="Mamunis, ir al inicio">
            <img src={logo} alt="" className="h-16 w-auto md:h-20" />
          </Link>
          <nav aria-label="Principal" className="font-titulos text-lg font-semibold text-tinta">
            <Link to="/" className="rounded-full px-4 py-2 hover:bg-amarillo">
              Productos
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="bg-tinta py-8 text-center text-sm text-fondo">
        <p className="font-titulos text-lg">Mamunis</p>
        <p className="text-fondo/80">Ropa infantil</p>
      </footer>
    </div>
  )
}
