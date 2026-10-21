import { Link } from 'react-router'

import type { Producto } from '../api/client'
import { ordenarPorTalla } from '../lib/catalogo'
import { formatearPrecio } from '../lib/formato'

export function TarjetaProducto({ producto }: { producto: Producto }) {
  const hayStock = producto.variantes.some((variante) => variante.stock > 0)
  const tallas = ordenarPorTalla(producto.variantes).map((variante) => variante.talla)

  return (
    <article className="group relative h-full">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-arena transition group-hover:-translate-y-1 group-hover:shadow-elevada">
        {producto.imagen ? (
          <img
            src={producto.imagen}
            alt={producto.nombre}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-texto-suave">Sin foto</div>
        )}
        {!hayStock && (
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-bold text-texto-suave">
            Sin stock
          </span>
        )}
      </div>
      <div className="space-y-0.5 px-1 pt-3">
        <p className="text-xs font-bold uppercase tracking-wide text-texto-suave">{producto.categoria.nombre}</p>
        <h2 className="text-lg font-semibold leading-tight group-hover:underline">
          {/* El link se estira sobre toda la tarjeta (after:inset-0): se puede tocar en cualquier parte,
              pero para el lector de pantalla es un solo link con el nombre del producto. */}
          <Link to={`/productos/${producto.id}`} className="after:absolute after:inset-0">
            {producto.nombre}
          </Link>
        </h2>
        <p className="font-titulos text-lg font-medium text-texto-suave">{formatearPrecio(producto.precio)}</p>
        {tallas.length > 0 && <p className="text-sm text-texto-suave">Talles: {tallas.join(' · ')}</p>}
      </div>
    </article>
  )
}
