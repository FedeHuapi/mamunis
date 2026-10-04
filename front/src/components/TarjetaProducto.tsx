import type { Producto } from '../api/client'
import { formatearPrecio } from '../lib/formato'

export function TarjetaProducto({ producto }: { producto: Producto }) {
  const hayStock = producto.variantes.some((variante) => variante.stock > 0)
  const tallas = producto.variantes.map((variante) => variante.talla)

  return (
    <article className="group h-full overflow-hidden rounded-3xl border-2 border-tinta bg-white transition hover:-translate-y-1 hover:shadow-[4px_4px_0_var(--color-tinta)]">
      <div className="relative aspect-square bg-amarillo-suave">
        {producto.imagen ? (
          <img src={producto.imagen} alt={producto.nombre} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-texto-suave">Sin foto</div>
        )}
        {!hayStock && (
          <span className="absolute left-3 top-3 rounded-full bg-tinta px-3 py-1 text-xs font-bold text-fondo">
            Sin stock
          </span>
        )}
      </div>
      <div className="space-y-1 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-texto-suave">{producto.categoria.nombre}</p>
        <h2 className="text-lg font-semibold leading-tight">{producto.nombre}</h2>
        <p className="font-titulos text-xl font-bold text-tinta">{formatearPrecio(producto.precio)}</p>
        {tallas.length > 0 && <p className="text-sm text-texto-suave">Talles: {tallas.join(' · ')}</p>}
      </div>
    </article>
  )
}
