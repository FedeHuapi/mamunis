import type { Producto } from '../api/client'
import { formatearPrecio } from '../lib/formato'

export function TarjetaProducto({ producto }: { producto: Producto }) {
  const hayStock = producto.variantes.some((variante) => variante.stock > 0)

  return (
    <article className="overflow-hidden rounded-2xl border border-borde bg-white">
      <div className="aspect-square bg-marca-suave">
        {producto.imagen ? (
          <img src={producto.imagen} alt={producto.nombre} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-texto-suave">Sin foto</div>
        )}
      </div>
      <div className="space-y-1 p-4">
        <p className="text-xs uppercase tracking-wide text-texto-suave">{producto.categoria.nombre}</p>
        <h2 className="font-bold">{producto.nombre}</h2>
        <p className="text-lg font-extrabold text-marca-oscuro">{formatearPrecio(producto.precio)}</p>
        {!hayStock && <p className="text-sm font-semibold text-texto-suave">Sin stock</p>}
      </div>
    </article>
  )
}
