import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { useCarrito } from '../api/carrito'
import { type DatosDeContacto, useCrearPedido } from '../api/pedidos'
import { type ErroresDeContacto, validarContacto } from '../lib/checkout'
import { formatearPrecio } from '../lib/formato'

const CAMPOS: (keyof DatosDeContacto)[] = ['nombre', 'email', 'telefono', 'direccion']

const estiloCampo =
  'w-full rounded-2xl border-2 border-tinta bg-white px-4 py-3 text-lg aria-invalid:border-dashed focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-tinta'

type PropsCampo = {
  id: keyof DatosDeContacto
  etiqueta: string
  ayuda?: string
  error?: string
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby': string | undefined }) => React.ReactNode
}

function Campo({ id, etiqueta, ayuda, error, children }: PropsCampo) {
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

export function Checkout() {
  const navigate = useNavigate()
  const carrito = useCarrito()
  const crearPedido = useCrearPedido()
  const [datos, setDatos] = useState<DatosDeContacto>({ nombre: '', email: '', telefono: '', direccion: '' })
  const [errores, setErrores] = useState<ErroresDeContacto>({})

  function cambiar(campo: keyof DatosDeContacto, valor: string) {
    setDatos((actuales) => ({ ...actuales, [campo]: valor }))
    // El aviso de un campo se va cuando la persona empieza a corregirlo.
    if (errores[campo]) setErrores((actuales) => ({ ...actuales, [campo]: undefined }))
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const encontrados = validarContacto(datos)
    setErrores(encontrados)

    const primeroConError = CAMPOS.find((campo) => encontrados[campo])
    if (primeroConError) {
      document.getElementById(primeroConError)?.focus()
      return
    }

    crearPedido.mutate(datos, {
      // replace: con "atras" no se vuelve a un formulario de un pedido que ya se hizo.
      onSuccess: (pedido) => navigate('/pedido-confirmado', { state: { pedido }, replace: true }),
    })
  }

  if (crearPedido.isSuccess) return null // ya se esta yendo a la confirmacion
  if (carrito.isPending) return <p role="status">Cargando tu compra…</p>
  if (carrito.isError) return <p role="alert">No pudimos cargar tu carrito. Probá de nuevo en un rato.</p>

  if (!carrito.data || carrito.data.items.length === 0) {
    return (
      <section className="py-12 text-center">
        <h1 className="text-4xl font-bold">No hay nada para comprar todavía</h1>
        <Link
          to="/"
          className="mt-6 inline-block rounded-full border-2 border-tinta bg-amarillo px-6 py-3 font-titulos text-lg font-semibold hover:bg-tinta hover:text-fondo"
        >
          Ver productos
        </Link>
      </section>
    )
  }

  return (
    <section aria-labelledby="titulo-checkout">
      <h1 id="titulo-checkout" className="mb-6 text-4xl font-bold">
        Finalizar compra
      </h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        {/* noValidate: los avisos los muestra la pagina, en castellano y al lado de cada campo. */}
        <form noValidate onSubmit={enviar} className="space-y-5">
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

          <Campo
            id="telefono"
            etiqueta="WhatsApp"
            ayuda="Te vamos a escribir a este número para coordinar el pago y la entrega."
            error={errores.telefono}
          >
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

          <Campo id="email" etiqueta="Email" error={errores.email}>
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

          <Campo
            id="direccion"
            etiqueta="Dirección de entrega"
            ayuda="Calle, número, piso o departamento, localidad y código postal."
            error={errores.direccion}
          >
            {(props) => (
              <textarea
                {...props}
                rows={3}
                autoComplete="street-address"
                value={datos.direccion}
                onChange={(e) => cambiar('direccion', e.target.value)}
                className={estiloCampo}
              />
            )}
          </Campo>

          {crearPedido.isError && (
            <div role="alert" className="rounded-2xl border-2 border-dashed border-tinta bg-amarillo-suave p-4">
              <p className="font-semibold">{crearPedido.error.message}</p>
              <Link to="/carrito" className="mt-1 inline-block underline">
                Revisar el carrito
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={crearPedido.isPending}
            className="w-full rounded-full border-2 border-tinta bg-tinta px-6 py-4 font-titulos text-xl font-semibold text-fondo transition hover:bg-amarillo hover:text-tinta disabled:cursor-not-allowed disabled:border-borde disabled:bg-borde disabled:text-texto-suave md:w-auto"
          >
            {crearPedido.isPending ? 'Enviando tu pedido…' : 'Confirmar pedido'}
          </button>
        </form>

        <aside className="h-fit rounded-3xl border-2 border-tinta bg-amarillo p-6">
          <h2 className="text-2xl font-bold">Tu pedido</h2>
          <ul className="mt-4 space-y-3">
            {carrito.data.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4">
                <span>
                  {item.cantidad} × {item.producto.nombre}
                  <span className="block text-sm">Talle {item.talla}</span>
                </span>
                <span className="font-semibold">
                  {formatearPrecio(String(Number(item.producto.precio) * item.cantidad))}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-baseline justify-between border-t-2 border-tinta pt-4">
            <span className="text-lg">Total</span>
            <span className="font-titulos text-3xl font-bold text-tinta">{formatearPrecio(carrito.data.total)}</span>
          </p>
          <p className="mt-3 text-sm">El pago y la entrega se coordinan por WhatsApp después de confirmar.</p>
        </aside>
      </div>
    </section>
  )
}
