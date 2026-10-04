type Props = {
  pagina: number
  totalPaginas: number
  onCambiar: (pagina: number) => void
}

const estiloBoton =
  'rounded-full border-2 border-tinta px-4 py-2 font-titulos font-semibold hover:bg-amarillo disabled:cursor-not-allowed disabled:border-borde disabled:text-texto-suave disabled:hover:bg-transparent'

export function Paginacion({ pagina, totalPaginas, onCambiar }: Props) {
  if (totalPaginas <= 1) return null

  return (
    <nav aria-label="Páginas del catálogo" className="mt-10 flex items-center justify-center gap-4">
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
