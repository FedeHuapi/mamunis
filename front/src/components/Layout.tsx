import { Link, Outlet } from 'react-router'

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-borde bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-2xl font-extrabold tracking-tight text-marca">
            Mamunis
          </Link>
          <nav aria-label="Principal" className="text-sm font-semibold text-texto-suave">
            <Link to="/" className="hover:text-marca-oscuro">
              Productos
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-borde py-6 text-center text-sm text-texto-suave">
        Mamunis · Ropa infantil
      </footer>
    </div>
  )
}
