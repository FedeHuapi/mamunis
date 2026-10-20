import { useEffect, useRef, useState } from 'react'

import { estiloBotonLleno, estiloBotonSecundario } from '../lib/estilos'

type Props = {
  /** El texto del boton, por ejemplo "Eliminar". */
  etiqueta: string
  /** Lo que se pregunta antes de hacerlo, por ejemplo "¿Eliminar la categoría Remeras?". */
  pregunta: string
  /** El texto del boton que confirma, por ejemplo "Sí, eliminar". */
  confirmar: string
  onConfirmar: () => void
  deshabilitado?: boolean
}

/**
 * Un boton para acciones que no se pueden deshacer: el primer clic solo pregunta, y
 * recien el segundo actua. Evita borrar o cancelar algo por un clic de mas.
 */
export function BotonConConfirmacion({ etiqueta, pregunta, confirmar, onConfirmar, deshabilitado }: Props) {
  const [preguntando, setPreguntando] = useState(false)
  const botonNo = useRef<HTMLButtonElement>(null)

  // Al preguntar, el cursor queda en "No": apretar Enter de mas no confirma nada.
  useEffect(() => {
    if (preguntando) botonNo.current?.focus()
  }, [preguntando])

  if (!preguntando) {
    return (
      <button type="button" className={estiloBotonSecundario} disabled={deshabilitado} onClick={() => setPreguntando(true)}>
        {etiqueta}
      </button>
    )
  }

  return (
    <div role="group" aria-label={pregunta} className="flex flex-wrap items-center gap-2 rounded-2xl bg-amarillo-suave p-3 shadow-tarjeta">
      <p className="font-semibold">{pregunta}</p>
      <button
        type="button"
        className={estiloBotonLleno}
        onClick={() => {
          setPreguntando(false)
          onConfirmar()
        }}
      >
        {confirmar}
      </button>
      <button ref={botonNo} type="button" className={estiloBotonSecundario} onClick={() => setPreguntando(false)}>
        No
      </button>
    </div>
  )
}
