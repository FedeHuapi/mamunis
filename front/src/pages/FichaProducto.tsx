import { useState } from 'react'
import { Link, useParams } from 'react-router'

import { useAgregarAlCarrito } from '../api/carrito'
import { useProducto } from '../api/productos'
import { SelectorTalle } from '../components/SelectorTalle'
import { leerEnteroPositivo } from '../lib/catalogo'
import { formatearPrecio } from '../lib/formato'
import { NoEncontrada } from './NoEncontrada'

const POCAS_UNIDADES = 3

export function FichaProducto() {
  const id = leerEnteroPositivo(useParams().id ?? null)
  if (id === undefined) return <NoEncontrada />
  // key: al pasar de un producto a otro se arranca de cero (sin el talle elegido en el anterior).
  return <Ficha key={id} id={id} />
}

function Ficha({ id }: { id: number }) {
  const { data: producto, isPending, isError } = useProducto(id)
  const [varianteId, setVarianteId] = useState<number>()
  const agregar = useAgregarAlCarrito()

  if (isPending) return <p role="status">Cargando producto…</p>
  if (isError) return <p role="alert">No pudimos cargar el producto. Probá de nuevo en un rato.</p>
  if (producto === null) return <NoEncontrada />

  const elegida = producto.variantes.find((variante) => variante.id === varianteId)
  const hayStock = producto.variantes.some((variante) => variante.stock > 0)

  return (
    <article>
      <Link to="/" className="mb-6 inline-block font-semibold text-texto-suave hover:text-tinta">
        ← Volver a los productos
      </Link>

      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        <div className="aspect-square overflow-hidden rounded-3xl border-2 border-tinta bg-amarillo-suave">
          {producto.imagen ? (
            <img src={producto.imagen} alt={producto.nombre} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-texto-suave">Sin foto</div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-texto-suave">{producto.categoria.nombre}</p>
            <h1 className="mt-1 text-4xl font-bold">{producto.nombre}</h1>
            <p className="mt-3 font-titulos text-3xl font-bold text-tinta">{formatearPrecio(producto.precio)}</p>
          </div>

          {producto.descripcion && <p className="whitespace-pre-line text-lg">{producto.descripcion}</p>}

          {hayStock ? (
            <SelectorTalle
              variantes={producto.variantes}
              seleccionada={varianteId}
              onSeleccionar={(id) => {
                setVarianteId(id)
                agregar.reset() // al cambiar de talle se borra el aviso del anterior
              }}
            />
          ) : (
            <p className="rounded-2xl bg-amarillo-suave p-4 font-semibold">Por ahora no hay stock de este producto.</p>
          )}

          {elegida && elegida.stock <= POCAS_UNIDADES && (
            <p className="font-semibold" aria-live="polite">
              {elegida.stock === 1 ? 'Queda 1 unidad' : `Quedan ${elegida.stock} unidades`} en talle {elegida.talla}.
            </p>
          )}

          {hayStock && (
            <div className="space-y-3">
              <button
                type="button"
                className="w-full rounded-full border-2 border-tinta bg-tinta px-6 py-4 font-titulos text-xl font-semibold text-fondo transition hover:bg-amarillo hover:text-tinta disabled:cursor-not-allowed disabled:border-borde disabled:bg-borde disabled:text-texto-suave md:w-auto"
                disabled={!elegida || agregar.isPending}
                onClick={() => elegida && agregar.mutate({ varianteId: elegida.id, cantidad: 1 })}
              >
                {agregar.isPending ? 'Agregando…' : 'Agregar al carrito'}
              </button>

              <div aria-live="polite">
                {!elegida && <p className="text-texto-suave">Elegí un talle para agregarlo.</p>}
                {agregar.isSuccess && (
                  <p className="font-semibold">
                    Agregado al carrito.{' '}
                    <Link to="/carrito" className="underline">
                      Ver carrito
                    </Link>
                  </p>
                )}
                {agregar.isError && (
                  <p role="alert" className="font-semibold">
                    {agregar.error.message}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
