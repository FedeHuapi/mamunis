import type { Categoria } from '../api/client'

type Props = {
  categorias: Categoria[]
  seleccionada?: number
  onCambiar: (categoriaId?: number) => void
}

function estiloOpcion(activa: boolean) {
  return `rounded-full border-2 border-tinta px-4 py-1.5 font-semibold transition ${
    activa ? 'bg-tinta text-fondo' : 'bg-white hover:bg-amarillo'
  }`
}

export function FiltroCategorias({ categorias, seleccionada, onCambiar }: Props) {
  if (categorias.length === 0) return null

  return (
    <div role="group" aria-label="Filtrar por categoría" className="mb-6 flex flex-wrap gap-2">
      <button
        type="button"
        aria-pressed={seleccionada === undefined}
        className={estiloOpcion(seleccionada === undefined)}
        onClick={() => onCambiar(undefined)}
      >
        Todo
      </button>
      {categorias.map((categoria) => (
        <button
          key={categoria.id}
          type="button"
          aria-pressed={seleccionada === categoria.id}
          className={estiloOpcion(seleccionada === categoria.id)}
          onClick={() => onCambiar(categoria.id)}
        >
          {categoria.nombre}
        </button>
      ))}
    </div>
  )
}
