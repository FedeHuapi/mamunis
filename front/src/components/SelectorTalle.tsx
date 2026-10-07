import type { Variante } from '../api/client'
import { ordenarPorTalla } from '../lib/catalogo'

type Props = {
  variantes: Variante[]
  seleccionada?: number
  onSeleccionar: (varianteId: number) => void
}

export function SelectorTalle({ variantes, seleccionada, onSeleccionar }: Props) {
  if (variantes.length === 0) return <p className="text-texto-suave">Este producto todavía no tiene talles cargados.</p>

  return (
    <fieldset>
      <legend className="mb-2 font-titulos text-lg font-semibold text-tinta">Talle</legend>
      <div className="flex flex-wrap gap-2">
        {ordenarPorTalla(variantes).map((variante) => {
          const sinStock = variante.stock === 0
          const activa = variante.id === seleccionada
          return (
            // Un input de tipo radio de verdad, escondido, adentro de una etiqueta con
            // forma de boton: asi funciona con teclado y lector de pantalla sin codigo extra.
            <label
              key={variante.id}
              className={`flex h-12 min-w-12 items-center justify-center rounded-full border-2 px-3 font-titulos text-lg font-semibold has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-tinta ${
                sinStock
                  ? 'cursor-not-allowed border-borde text-texto-suave line-through'
                  : activa
                    ? 'cursor-pointer border-tinta bg-tinta text-fondo'
                    : 'cursor-pointer border-tinta bg-white hover:bg-amarillo'
              }`}
            >
              <input
                type="radio"
                name="talle"
                value={variante.id}
                checked={activa}
                disabled={sinStock}
                onChange={() => onSeleccionar(variante.id)}
                className="sr-only"
              />
              {variante.talla}
              {sinStock && <span className="sr-only"> (sin stock)</span>}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
