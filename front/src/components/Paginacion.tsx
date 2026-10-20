import { estiloBotonSecundario as estiloBoton } from '../lib/estilos'

type Props = {
  pagina: number
  totalPaginas: number
  onCambiar: (pagina: number) => void
  etiqueta?: string
}


export function Paginacion({ pagina, totalPaginas, onCambiar, etiqueta = 'Páginas del catálogo' }: Props) {
  if (totalPaginas <= 1) return null

  return (
    <nav aria-label={etiqueta} className="mt-10 flex items-center justify-center gap-4">
      <button type="button" className={estiloBoton} disabled={pagina <= 1} onClick={() => onCambiar(pagina - 1)}>
        Anterior
      </button>
      <p aria-live="polite">
        Página {pagina} de {totalPaginas}
      </p>
      <button
        type="button"
        className={estiloBoton}
        disabled={pagina >= totalPaginas}
        onClick={() => onCambiar(pagina + 1)}
      >
        Siguiente
      </button>
    </nav>
  )
}
