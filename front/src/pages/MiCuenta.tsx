import { useState } from 'react'
import { Link, useNavigate } from 'react-router'

import type { Usuario } from '../api/client'
import { PEDIDOS_POR_PAGINA, useMisPedidos, useSalir } from '../api/usuarios'
import { Paginacion } from '../components/Paginacion'
import { totalDePaginas } from '../lib/catalogo'
import { formatearPrecio } from '../lib/formato'
import { formatearFecha, nombreDeEstado } from '../lib/pedidos'

function MisPedidos() {
  const [pagina, setPagina] = useState(1)
  const { data, isPending, isError } = useMisPedidos(pagina)

  if (isPending) return <p role="status">Cargando tus pedidos…</p>
  if (isError) return <p role="alert">No pudimos cargar tus pedidos. Probá de nuevo en un rato.</p>

  if (data.total === 0) {
    return (
      <p>
        Todavía no hiciste ningún pedido con esta cuenta.{' '}
        <Link to="/" className="font-semibold underline">
          Ver productos
        </Link>
      </p>
    )
  }

  return (
    <>
      <ul className="space-y-4">
        {data.items.map((pedido) => (
          <li key={pedido.id} className="rounded-3xl border-2 border-tinta bg-white p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-xl font-semibold">Pedido N.º {pedido.id}</h3>
              <span className="rounded-full bg-amarillo px-3 py-1 text-sm font-bold text-tinta">
                {nombreDeEstado(pedido.estado)}
              </span>
            </div>
            <p className="text-sm text-texto-suave">{formatearFecha(pedido.fecha_creacion)}</p>
            <ul className="mt-3 space-y-1">
              {pedido.items.map((item) => (
                <li key={item.id}>
                  {item.cantidad} × {item.producto.nombre}, talle {item.talla}
                </li>
              ))}
            </ul>
            <p className="mt-3 font-titulos text-xl font-bold text-tinta">{formatearPrecio(pedido.total)}</p>
          </li>
        ))}
      </ul>
      <Paginacion
        pagina={pagina}
        totalPaginas={totalDePaginas(data.total, PEDIDOS_POR_PAGINA)}
        onCambiar={setPagina}
        etiqueta="Páginas de mis pedidos"
      />
    </>
  )
}

export function MiCuenta({ usuario }: { usuario: Usuario }) {
  const navigate = useNavigate()
  const salir = useSalir()

  return (
    <section aria-labelledby="titulo-cuenta">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 id="titulo-cuenta" className="text-4xl font-bold">
            Hola, {usuario.nombre}
          </h1>
          <p className="text-texto-suave">{usuario.email}</p>
        </div>
        <button
          type="button"
          className="rounded-full border-2 border-tinta px-5 py-2 font-titulos font-semibold hover:bg-amarillo"
          onClick={() => {
            salir()
            navigate('/')
          }}
        >
          Salir
        </button>
      </div>

      <h2 className="mb-4 text-2xl font-bold">Mis pedidos</h2>
      <MisPedidos />
    </section>
  )
}
