import type { ReactNode } from 'react'

export const estiloCampo =
  'w-full rounded-2xl border-2 border-tinta bg-white px-4 py-3 text-lg aria-invalid:border-dashed focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-tinta'

export const estiloBotonPrincipal =
  'w-full rounded-full border-2 border-tinta bg-tinta px-6 py-4 font-titulos text-xl font-semibold text-fondo transition hover:bg-amarillo hover:text-tinta disabled:cursor-not-allowed disabled:border-borde disabled:bg-borde disabled:text-texto-suave md:w-auto'

type PropsDelControl = { id: string; 'aria-invalid': boolean; 'aria-describedby': string | undefined }

type Props = {
  id: string
  etiqueta: string
  ayuda?: string
  error?: string
  children: (props: PropsDelControl) => ReactNode
}

/**
 * Un campo de formulario con su etiqueta, su texto de ayuda y su aviso de error.
 * La ayuda y el error quedan asociados al control (aria-describedby), asi un lector
 * de pantalla los lee al entrar al campo.
 */
export function Campo({ id, etiqueta, ayuda, error, children }: Props) {
  const descripcion = [ayuda && `${id}-ayuda`, error && `${id}-error`].filter(Boolean).join(' ') || undefined

  return (
    <div>
      <label htmlFor={id} className="mb-1 block font-titulos text-lg font-semibold text-tinta">
        {etiqueta}
      </label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': descripcion })}
      {ayuda && (
        <p id={`${id}-ayuda`} className="mt-1 text-sm text-texto-suave">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 font-semibold">
          {error}
        </p>
      )}
    </div>
  )
}
