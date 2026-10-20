import { Link, useLocation } from 'react-router'

import type { Pedido } from '../api/pedidos'
import { estiloBotonEnlace } from '../lib/estilos'
import { formatearPrecio } from '../lib/formato'

const estiloBoton =
  estiloBotonEnlace

export function PedidoConfirmado() {
  // El pedido llega desde el checkout, por la navegacion. No se vuelve a pedir a la API:
  // consultar un pedido por su numero es solo para el admin, porque un numero de pedido
  // se puede adivinar y el pedido tiene datos personales.
  const pedido = (useLocation().state as { pedido?: Pedido } | null)?.pedido

  if (!pedido) {
    return (
      <section className="py-12 text-center">
        <h1 className="text-4xl font-semibold">No hay un pedido para mostrar</h1>
        <p className="mt-3 text-lg">Si acabás de comprar, te vamos a escribir por WhatsApp.</p>
        <Link to="/" className={`mt-6 ${estiloBoton}`}>
          Ver productos
        </Link>
      </section>
    )
  }

  return (
    <section aria-labelledby="titulo-confirmacion" className="mx-auto max-w-2xl">
      <div className="rounded-[28px] bg-amarillo-suave px-6 py-10 text-center md:px-10">
        <h1 id="titulo-confirmacion" className="text-4xl font-semibold">
          ¡Recibimos tu pedido!
        </h1>
        <p className="mt-2 font-titulos text-xl font-semibold text-tinta">Pedido N.º {pedido.id}</p>
        <p className="mt-4 text-lg">
          {pedido.nombre_contacto}, te vamos a escribir por WhatsApp al <strong>{pedido.telefono_contacto}</strong> para
          coordinar el pago y la entrega.
        </p>
      </div>

      <h2 className="mb-3 mt-8 text-2xl font-semibold">Lo que pediste</h2>
      <ul className="space-y-3">
        {pedido.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4 rounded-2xl bg-white p-4 shadow-tarjeta">
            <span>
              {item.cantidad} × {item.producto.nombre}
              <span className="block text-sm text-texto-suave">Talle {item.talla}</span>
            </span>
            <span className="font-semibold">
              {formatearPrecio(String(Number(item.precio_unitario) * item.cantidad))}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex items-baseline justify-between">
        <span className="text-lg">Total</span>
        <span className="font-titulos text-3xl font-semibold text-tinta">{formatearPrecio(pedido.total)}</span>
      </p>

      <h2 className="mb-2 mt-8 text-2xl font-semibold">Entrega</h2>
      <p className="whitespace-pre-line">{pedido.direccion_envio}</p>

      <Link to="/" className={`mt-8 ${estiloBoton}`}>
        Seguir mirando
      </Link>
    </section>
  )
}
