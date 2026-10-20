import { type FormEvent, useState } from 'react'
import { Link } from 'react-router'

import { type ArrepentimientoCreado, useCrearArrepentimiento } from '../api/arrepentimiento'
import { Campo, estiloBotonPrincipal, estiloCampo } from '../components/Campo'
import {
  type DatosDeArrepentimiento,
  type ErroresDeArrepentimiento,
  PLAZO_EN_DIAS,
  validarArrepentimiento,
} from '../lib/arrepentimiento'
import { estiloAviso, estiloBotonEnlace, estiloBotonSecundario, estiloNota } from '../lib/estilos'
import { enfocarPrimerError } from '../lib/formularios'
import { formatearFechaYHora } from '../lib/pedidos'

const CAMPOS: (keyof DatosDeArrepentimiento)[] = ['nombre', 'email', 'telefono', 'numeroPedido', 'motivo']
const VACIO: DatosDeArrepentimiento = { nombre: '', email: '', telefono: '', numeroPedido: '', motivo: '' }

function SolicitudRecibida({ solicitud }: { solicitud: ArrepentimientoCreado }) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(solicitud.codigo)
      setCopiado(true)
    } catch {
      // Sin permiso para copiar: el codigo sigue a la vista para anotarlo.
    }
  }

  return (
    <section aria-labelledby="titulo-recibida" className="mx-auto max-w-2xl">
      <div className="rounded-[28px] bg-amarillo-suave px-6 py-10 text-center md:px-10">
        <h1 id="titulo-recibida" className="text-4xl font-semibold">
          Recibimos tu solicitud
        </h1>
        <p className="mt-4 text-lg">Este es tu código de identificación:</p>
        {/* Las letras del codigo se leen de a una: si no, un lector de pantalla lo dice como palabra. */}
        <p className="mt-2 font-mono text-4xl font-bold tracking-widest text-tinta" aria-label={solicitud.codigo.split('').join(' ')}>
          {solicitud.codigo}
        </p>
        <p className="mt-2 text-sm text-texto-suave">{formatearFechaYHora(solicitud.fecha_creacion)}</p>
        <button type="button" onClick={copiar} className={`mt-5 ${estiloBotonSecundario}`}>
          {copiado ? 'Código copiado' : 'Copiar código'}
        </button>
        <p role="status" className="sr-only">
          {copiado ? 'Código copiado' : ''}
        </p>
      </div>

      <h2 className="mb-3 mt-8 text-2xl font-semibold">Qué sigue</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>Guardá el código: es el comprobante de tu solicitud.</li>
        <li>Te vamos a contactar para coordinar la devolución del producto y del dinero.</li>
        <li>Arrepentirte no tiene ningún costo para vos.</li>
      </ul>
      <Link to="/" className={`mt-8 ${estiloBotonEnlace}`}>
        Volver a la tienda
      </Link>
    </section>
  )
}

export function Arrepentimiento() {
  const crear = useCrearArrepentimiento()
  const [datos, setDatos] = useState<DatosDeArrepentimiento>(VACIO)
  const [errores, setErrores] = useState<ErroresDeArrepentimiento>({})

  function cambiar(campo: keyof DatosDeArrepentimiento, valor: string) {
    setDatos((actuales) => ({ ...actuales, [campo]: valor }))
    if (errores[campo]) setErrores((actuales) => ({ ...actuales, [campo]: undefined }))
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const encontrados = validarArrepentimiento(datos)
    setErrores(encontrados)
    if (enfocarPrimerError(CAMPOS, encontrados)) return
    crear.mutate(datos)
  }

  if (crear.isSuccess) return <SolicitudRecibida solicitud={crear.data} />

  return (
    <section aria-labelledby="titulo-arrepentimiento" className="mx-auto max-w-2xl">
      <h1 id="titulo-arrepentimiento" className="text-4xl font-semibold">
        Botón de arrepentimiento
      </h1>
      <p className="mt-4 text-lg text-texto-suave">
        Si compraste y te arrepentiste, podés cancelar la compra desde acá, sin dar explicaciones y sin ningún costo.
      </p>

      <div className={`mt-6 ${estiloNota}`}>
        <p>
          Tenés <strong>{PLAZO_EN_DIAS} días corridos</strong> desde que recibiste el producto, o desde la compra si fue
          después. No hace falta tener cuenta.
        </p>
      </div>

      <form noValidate onSubmit={enviar} className="mt-8 space-y-5">
        <Campo id="nombre" etiqueta="Nombre y apellido" error={errores.nombre}>
          {(props) => (
            <input
              {...props}
              type="text"
              autoComplete="name"
              maxLength={150}
              value={datos.nombre}
              onChange={(e) => cambiar('nombre', e.target.value)}
              className={estiloCampo}
            />
          )}
        </Campo>

        <Campo id="email" etiqueta="Email" ayuda="El que usaste al hacer la compra." error={errores.email}>
          {(props) => (
            <input
              {...props}
              type="email"
              autoComplete="email"
              value={datos.email}
              onChange={(e) => cambiar('email', e.target.value)}
              className={estiloCampo}
            />
          )}
        </Campo>

        <div className="grid gap-5 md:grid-cols-2">
          <Campo id="numeroPedido" etiqueta="Número de pedido (opcional)" ayuda="Figura en la confirmación de la compra." error={errores.numeroPedido}>
            {(props) => (
              <input
                {...props}
                type="text"
                inputMode="numeric"
                value={datos.numeroPedido}
                onChange={(e) => cambiar('numeroPedido', e.target.value)}
                className={estiloCampo}
              />
            )}
          </Campo>

          <Campo id="telefono" etiqueta="WhatsApp (opcional)" ayuda="Para contactarte más rápido." error={errores.telefono}>
            {(props) => (
              <input
                {...props}
                type="tel"
                autoComplete="tel"
                maxLength={50}
                value={datos.telefono}
                onChange={(e) => cambiar('telefono', e.target.value)}
                className={estiloCampo}
              />
            )}
          </Campo>
        </div>

        <Campo id="motivo" etiqueta="Motivo (opcional)" ayuda="No es obligatorio, pero nos ayuda a mejorar." error={errores.motivo}>
          {(props) => (
            <textarea
              {...props}
              rows={4}
              maxLength={1000}
              value={datos.motivo}
              onChange={(e) => cambiar('motivo', e.target.value)}
              className={estiloCampo}
            />
          )}
        </Campo>

        {/* Por ejemplo el aviso de demasiadas solicitudes seguidas. */}
        {crear.isError && (
          <p role="alert" className={estiloAviso}>
            {crear.error.message}
          </p>
        )}

        <button type="submit" disabled={crear.isPending} className={estiloBotonPrincipal}>
          {crear.isPending ? 'Enviando…' : 'Enviar solicitud'}
        </button>
      </form>
    </section>
  )
}
