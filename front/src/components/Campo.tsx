import type { ReactNode } from 'react'

export const estiloCampo =
  'w-full rounded-xl border border-borde-fuerte bg-white px-4 py-3 text-lg aria-invalid:border-2 aria-invalid:border-dashed aria-invalid:border-tinta focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-tinta'

export const estiloBotonPrincipal =
  'w-full rounded-full bg-tinta px-6 py-4 font-titulos text-xl font-semibold text-fondo shadow-boton transition hover:bg-amarillo hover:text-tinta disabled:cursor-not-allowed disabled:bg-borde disabled:text-texto-suave disabled:shadow-none md:w-auto'

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
      <label htmlFor={id} className="mb-1.5 block font-bold text-tinta">
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
