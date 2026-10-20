import { useSearchParams } from 'react-router'

import {
  type SolicitudDeArrepentimiento,
  SOLICITUDES_POR_PAGINA,
  useArrepentimientos,
  useCambiarEstadoArrepentimiento,
} from '../../api/admin'
import { Paginacion } from '../../components/Paginacion'
import {
  diasDesde,
  type EstadoArrepentimiento,
  ESTADOS_ARREPENTIMIENTO,
  nombreDeEstadoArrepentimiento,
  PLAZO_EN_DIAS,
} from '../../lib/arrepentimiento'
import { leerEnteroPositivo, totalDePaginas } from '../../lib/catalogo'
import { estiloAviso, estiloBotonLleno, estiloBotonSecundario, estiloChip, estiloSello, estiloTarjeta } from '../../lib/estilos'
import { formatearPrecio } from '../../lib/formato'
import { formatearFecha, formatearFechaYHora, nombreDeEstadoEnPanel } from '../../lib/pedidos'

/** El pedido al que corresponde la solicitud, o por que no se pudo vincular. */
function PedidoVinculado({ solicitud }: { solicitud: SolicitudDeArrepentimiento }) {
  const { pedido, numero_pedido: numeroEscrito } = solicitud

  if (!pedido) {
    return (
      <p className="text-sm">
        {numeroEscrito
          ? `Escribió el pedido N.º ${numeroEscrito}, pero no coincide con un pedido hecho con ese email. Revisalo a mano.`
          : 'No indicó número de pedido. Buscalo por el email o el nombre.'}
      </p>
    )
  }

  // El plazo legal cuenta desde la entrega; el sistema no guarda esa fecha, asi que se
  // muestra desde la compra como referencia.
  const dias = diasDesde(pedido.fecha_creacion)
  return (
    <div className="space-y-1 text-sm">
      <p>
        <span className="font-semibold">Pedido N.º {pedido.id}</span> · {nombreDeEstadoEnPanel(pedido.estado)} ·{' '}
        {formatearPrecio(pedido.total)}
      </p>
      <p className="text-texto-suave">
        Comprado el {formatearFecha(pedido.fecha_creacion)}, hace {dias} {dias === 1 ? 'día' : 'días'}.{' '}
        {dias > PLAZO_EN_DIAS && 'Pasaron más de 10 días desde la compra: fijate cuándo se entregó.'}
      </p>
    </div>
  )
}

function TarjetaSolicitud({ solicitud }: { solicitud: SolicitudDeArrepentimiento }) {
  const cambiar = useCambiarEstadoArrepentimiento()
  const otros = ESTADOS_ARREPENTIMIENTO.filter((estado) => estado !== solicitud.estado)

  return (
    <li className={estiloTarjeta}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-mono text-xl font-bold">{solicitud.codigo}</h2>
        <span className={estiloSello}>{nombreDeEstadoArrepentimiento(solicitud.estado)}</span>
      </div>
      <p className="text-sm text-texto-suave">{formatearFechaYHora(solicitud.fecha_creacion)}</p>

      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <dl className="space-y-1">
          <div>
            <dt className="inline font-semibold">Nombre: </dt>
            <dd className="inline">{solicitud.nombre}</dd>
          </div>
          <div>
            <dt className="inline font-semibold">Email: </dt>
            <dd className="inline break-all">{solicitud.email}</dd>
          </div>
          {solicitud.telefono && (
            <div>
              <dt className="inline font-semibold">WhatsApp: </dt>
              <dd className="inline">{solicitud.telefono}</dd>
            </div>
          )}
          {solicitud.motivo && (
            <div>
              <dt className="font-semibold">Motivo:</dt>
              <dd className="whitespace-pre-line">{solicitud.motivo}</dd>
            </div>
          )}
        </dl>
        <PedidoVinculado solicitud={solicitud} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-borde pt-4">
        {otros.map((estado: EstadoArrepentimiento) => (
          <button
            key={estado}
            type="button"
            className={estado === 'resuelta' ? estiloBotonLleno : estiloBotonSecundario}
            disabled={cambiar.isPending}
            onClick={() => cambiar.mutate({ id: solicitud.id, estado })}
          >
            Marcar como {nombreDeEstadoArrepentimiento(estado).toLowerCase()}
          </button>
        ))}
      </div>
      {cambiar.isError && (
        <p role="alert" className={`mt-4 ${estiloAviso}`}>
          {cambiar.error.message}
        </p>
      )}
    </li>
  )
}

function leerEstado(valor: string | null): EstadoArrepentimiento | undefined {
  return ESTADOS_ARREPENTIMIENTO.find((estado) => estado === valor)
}

export function AdminArrepentimientos() {
  const [parametros, setParametros] = useSearchParams()
  const estado = leerEstado(parametros.get('estado'))
  const pagina = leerEnteroPositivo(parametros.get('pagina')) ?? 1
  const { data, isPending, isError, error } = useArrepentimientos({ pagina, estado })

  function ir(nuevoEstado: EstadoArrepentimiento | undefined, nuevaPagina = 1) {
    const nuevos = new URLSearchParams()
    if (nuevoEstado) nuevos.set('estado', nuevoEstado)
    if (nuevaPagina > 1) nuevos.set('pagina', String(nuevaPagina))
    setParametros(nuevos)
  }

  return (
    <section aria-labelledby="titulo-arrepentimientos">
      <h1 id="titulo-arrepentimientos" className="mb-2 text-4xl font-semibold">
        Arrepentimientos
      </h1>
      <p className="mb-5 max-w-2xl text-texto-suave">
        Las solicitudes del botón de arrepentimiento. Registrarlas no cancela el pedido: coordiná con la persona la
        devolución y, si corresponde, cancelá el pedido desde Pedidos.
      </p>

      <div role="group" aria-label="Filtrar por estado" className="mb-6 flex flex-wrap gap-2">
        <button type="button" aria-pressed={!estado} className={estiloChip(!estado)} onClick={() => ir(undefined)}>
          Todas
        </button>
        {ESTADOS_ARREPENTIMIENTO.map((opcion) => (
          <button
            key={opcion}
            type="button"
            aria-pressed={estado === opcion}
            className={estiloChip(estado === opcion)}
            onClick={() => ir(opcion)}
          >
            {nombreDeEstadoArrepentimiento(opcion)}
          </button>
        ))}
      </div>

      {isPending && <p role="status">Cargando solicitudes…</p>}
      {isError && <p role="alert">{error.message}</p>}
      {data && data.total === 0 && <p>{estado ? 'No hay solicitudes en ese estado.' : 'Todavía no llegó ninguna solicitud.'}</p>}

      {data && data.total > 0 && (
        <>
          <ul className="space-y-4">
            {data.items.map((solicitud) => (
              <TarjetaSolicitud key={solicitud.id} solicitud={solicitud} />
            ))}
          </ul>
          <Paginacion
            pagina={pagina}
            totalPaginas={totalDePaginas(data.total, SOLICITUDES_POR_PAGINA)}
            onCambiar={(nueva) => ir(estado, nueva)}
            etiqueta="Páginas de solicitudes"
          />
        </>
      )}
    </section>
  )
}
