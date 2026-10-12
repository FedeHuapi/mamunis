import { useSearchParams } from 'react-router'

import { PEDIDOS_POR_PAGINA, useCambiarEstado, usePedidosAdmin } from '../../api/admin'
import type { Pedido } from '../../api/pedidos'
import { BotonConConfirmacion } from '../../components/BotonConConfirmacion'
import { Paginacion } from '../../components/Paginacion'
import { leerEnteroPositivo, totalDePaginas } from '../../lib/catalogo'
import { estiloAviso, estiloBotonLleno, estiloTarjeta } from '../../lib/estilos'
import { formatearPrecio } from '../../lib/formato'
import {
  type Estado,
  ESTADOS,
  estadosSiguientes,
  formatearFechaYHora,
  nombreDeAccion,
  nombreDeEstadoEnPanel,
} from '../../lib/pedidos'

function estiloFiltro(activo: boolean) {
  return `rounded-full border-2 border-tinta px-4 py-1.5 font-semibold transition ${
    activo ? 'bg-tinta text-fondo' : 'bg-white hover:bg-amarillo'
  }`
}

function TarjetaPedido({ pedido }: { pedido: Pedido }) {
  const cambiar = useCambiarEstado()
  const siguientes = estadosSiguientes(pedido.estado)
  const pasarA = (estado: Estado) => cambiar.mutate({ pedidoId: pedido.id, estado })

  return (
    <li className={estiloTarjeta}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold">Pedido N.º {pedido.id}</h2>
        <span className="rounded-full bg-amarillo px-3 py-1 text-sm font-bold text-tinta">
          {nombreDeEstadoEnPanel(pedido.estado)}
        </span>
      </div>
      <p className="text-sm text-texto-suave">{formatearFechaYHora(pedido.fecha_creacion)}</p>

      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <dl className="space-y-1">
          <div>
            <dt className="inline font-semibold">Nombre: </dt>
            <dd className="inline">{pedido.nombre_contacto}</dd>
          </div>
          <div>
            <dt className="inline font-semibold">WhatsApp: </dt>
            <dd className="inline">{pedido.telefono_contacto}</dd>
          </div>
          <div>
            <dt className="inline font-semibold">Email: </dt>
            <dd className="inline break-all">{pedido.email_contacto}</dd>
          </div>
          <div>
            <dt className="inline font-semibold">Dirección: </dt>
            <dd className="inline whitespace-pre-line">{pedido.direccion_envio}</dd>
          </div>
        </dl>

        <div>
          <ul className="space-y-1">
            {pedido.items.map((item) => (
              <li key={item.id}>
                {item.cantidad} × {item.producto.nombre}, talle {item.talla}{' '}
                <span className="text-texto-suave">({formatearPrecio(item.precio_unitario)} c/u)</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 font-titulos text-xl font-bold text-tinta">Total: {formatearPrecio(pedido.total)}</p>
        </div>
      </div>

      {siguientes.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t-2 border-borde pt-4">
          {siguientes.map((estado) =>
            estado === 'cancelado' ? (
              <BotonConConfirmacion
                key={estado}
                etiqueta={nombreDeAccion(estado)}
                pregunta={`¿Cancelar el pedido N.º ${pedido.id}? No se puede deshacer; el stock vuelve a quedar disponible.`}
                confirmar="Sí, cancelar"
                deshabilitado={cambiar.isPending}
                onConfirmar={() => pasarA(estado)}
              />
            ) : (
              <button
                key={estado}
                type="button"
                className={estiloBotonLleno}
                disabled={cambiar.isPending}
                onClick={() => pasarA(estado)}
              >
                {nombreDeAccion(estado)}
              </button>
            ),
          )}
        </div>
      )}

      {cambiar.isError && (
        <p role="alert" className={`mt-4 ${estiloAviso}`}>
          {cambiar.error.message}
        </p>
      )}
    </li>
  )
}

function leerEstado(valor: string | null): Estado | undefined {
  return ESTADOS.find((estado) => estado === valor)
}

export function AdminPedidos() {
  // El filtro y la pagina viven en la direccion: se puede recargar o compartir el link.
  const [parametros, setParametros] = useSearchParams()
  const estado = leerEstado(parametros.get('estado'))
  const pagina = leerEnteroPositivo(parametros.get('pagina')) ?? 1
  const { data, isPending, isError, error } = usePedidosAdmin({ pagina, estado })

  function ir(nuevoEstado: Estado | undefined, nuevaPagina = 1) {
    const nuevos = new URLSearchParams()
    if (nuevoEstado) nuevos.set('estado', nuevoEstado)
    if (nuevaPagina > 1) nuevos.set('pagina', String(nuevaPagina))
    setParametros(nuevos)
  }

  return (
    <section aria-labelledby="titulo-pedidos">
      <h1 id="titulo-pedidos" className="mb-4 text-4xl font-bold">
        Pedidos
      </h1>

      <div role="group" aria-label="Filtrar por estado" className="mb-6 flex flex-wrap gap-2">
        <button type="button" aria-pressed={!estado} className={estiloFiltro(!estado)} onClick={() => ir(undefined)}>
          Todos
        </button>
        {ESTADOS.map((opcion) => (
          <button
            key={opcion}
            type="button"
            aria-pressed={estado === opcion}
            className={estiloFiltro(estado === opcion)}
            onClick={() => ir(opcion)}
          >
            {nombreDeEstadoEnPanel(opcion)}
          </button>
        ))}
      </div>

      {isPending && <p role="status">Cargando pedidos…</p>}
      {isError && <p role="alert">{error.message}</p>}

      {data && data.total === 0 && (
        <p>{estado ? 'No hay pedidos en ese estado.' : 'Todavía no entró ningún pedido.'}</p>
      )}

      {data && data.total > 0 && (
        <>
          <p className="mb-4 text-texto-suave">
            {data.total} {data.total === 1 ? 'pedido' : 'pedidos'}, del más nuevo al más viejo.
          </p>
          <ul className="space-y-4">
            {data.items.map((pedido) => (
              <TarjetaPedido key={pedido.id} pedido={pedido} />
            ))}
          </ul>
          <Paginacion
            pagina={pagina}
            totalPaginas={totalDePaginas(data.total, PEDIDOS_POR_PAGINA)}
            onCambiar={(nueva) => ir(estado, nueva)}
            etiqueta="Páginas de pedidos"
          />
        </>
      )}
    </section>
  )
}
