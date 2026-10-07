import { Link } from 'react-router'

import { type ItemDeCarrito, useCambiarCantidad, useCarrito, useQuitarDelCarrito } from '../api/carrito'
import { formatearPrecio } from '../lib/formato'

const estiloPaso =
  'flex h-10 w-10 items-center justify-center rounded-full border-2 border-tinta font-titulos text-xl font-semibold hover:bg-amarillo disabled:cursor-not-allowed disabled:border-borde disabled:text-texto-suave disabled:hover:bg-transparent'

function Item({ item }: { item: ItemDeCarrito }) {
  const cambiar = useCambiarCantidad()
  const quitar = useQuitarDelCarrito()
  const ocupado = cambiar.isPending || quitar.isPending
  const nombre = `${item.producto.nombre}, talle ${item.talla}`

  return (
    <li className="flex gap-4 rounded-3xl border-2 border-tinta bg-white p-4">
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-amarillo-suave">
        {item.producto.imagen && <img src={item.producto.imagen} alt="" className="h-full w-full object-cover" />}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold leading-tight">
              <Link to={`/productos/${item.producto.id}`} className="hover:underline">
                {item.producto.nombre}
              </Link>
            </h2>
            <p className="text-texto-suave">Talle {item.talla}</p>
          </div>
          <p className="font-titulos text-lg font-bold text-tinta">
            {formatearPrecio(String(Number(item.producto.precio) * item.cantidad))}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={estiloPaso}
            aria-label={`Quitar una unidad de ${nombre}`}
            disabled={ocupado || item.cantidad <= 1}
            onClick={() => cambiar.mutate({ itemId: item.id, cantidad: item.cantidad - 1 })}
          >
            −
          </button>
          <span aria-label={`Cantidad de ${nombre}`} className="min-w-6 text-center font-titulos text-lg font-semibold">
            {item.cantidad}
          </span>
          <button
            type="button"
            className={estiloPaso}
            aria-label={`Agregar una unidad de ${nombre}`}
            disabled={ocupado}
            onClick={() => cambiar.mutate({ itemId: item.id, cantidad: item.cantidad + 1 })}
          >
            +
          </button>
          <button
            type="button"
            className="ml-auto font-semibold text-texto-suave underline hover:text-tinta"
            aria-label={`Quitar ${nombre} del carrito`}
            disabled={ocupado}
            onClick={() => quitar.mutate(item.id)}
          >
            Quitar
          </button>
        </div>

        {/* Por ejemplo "Stock insuficiente. Disponible: 3": el limite lo decide el backend. */}
        {cambiar.isError && (
          <p role="alert" className="font-semibold">
            {cambiar.error.message}
          </p>
        )}
        {quitar.isError && (
          <p role="alert" className="font-semibold">
            {quitar.error.message}
          </p>
        )}
      </div>
    </li>
  )
}

export function Carrito() {
  const { data: carrito, isPending, isError } = useCarrito()

  if (isPending) return <p role="status">Cargando el carrito…</p>
  if (isError) return <p role="alert">No pudimos cargar el carrito. Probá de nuevo en un rato.</p>

  if (!carrito || carrito.items.length === 0) {
    return (
      <section className="py-12 text-center">
        <h1 className="text-4xl font-bold">Tu carrito está vacío</h1>
        <Link
          to="/"
          className="mt-6 inline-block rounded-full border-2 border-tinta bg-amarillo px-6 py-3 font-titulos text-lg font-semibold hover:bg-tinta hover:text-fondo"
        >
          Ver productos
        </Link>
      </section>
    )
  }

  return (
    <section aria-labelledby="titulo-carrito">
      <h1 id="titulo-carrito" className="mb-6 text-4xl font-bold">
        Tu carrito
      </h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <ul className="space-y-4">
          {carrito.items.map((item) => (
            <Item key={item.id} item={item} />
          ))}
        </ul>

        <aside className="h-fit rounded-3xl border-2 border-tinta bg-amarillo p-6">
          <h2 className="text-2xl font-bold">Resumen</h2>
          <p className="mt-4 flex items-baseline justify-between">
            <span className="text-lg">Total</span>
            <span className="font-titulos text-3xl font-bold text-tinta">{formatearPrecio(carrito.total)}</span>
          </p>
          <Link to="/" className="mt-6 inline-block font-semibold underline">
            Seguir mirando
          </Link>
        </aside>
      </div>
    </section>
  )
}
