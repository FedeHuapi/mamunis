import { Link, useSearchParams } from 'react-router'

import { PRODUCTOS_POR_PAGINA, useCategorias, useProductos } from '../../api/productos'
import { FiltroCategorias } from '../../components/FiltroCategorias'
import { Paginacion } from '../../components/Paginacion'
import { stockTotal } from '../../lib/admin'
import { leerEnteroPositivo, ordenarPorTalla, totalDePaginas } from '../../lib/catalogo'
import { estiloBotonLleno, estiloBotonSecundario, estiloTarjeta } from '../../lib/estilos'
import { formatearPrecio } from '../../lib/formato'

export function AdminProductos() {
  const [parametros, setParametros] = useSearchParams()
  const pagina = leerEnteroPositivo(parametros.get('pagina')) ?? 1
  const categoriaId = leerEnteroPositivo(parametros.get('categoria'))
  const categorias = useCategorias()
  const { data, isPending, isError } = useProductos({ pagina, categoriaId })

  function ir(nuevaCategoria: number | undefined, nuevaPagina = 1) {
    const nuevos = new URLSearchParams()
    if (nuevaCategoria) nuevos.set('categoria', String(nuevaCategoria))
    if (nuevaPagina > 1) nuevos.set('pagina', String(nuevaPagina))
    setParametros(nuevos)
  }

  return (
    <section aria-labelledby="titulo-productos">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <h1 id="titulo-productos" className="text-4xl font-bold">
          Productos
        </h1>
        <Link to="/admin/productos/nuevo" className={estiloBotonLleno}>
          Nuevo producto
        </Link>
      </div>

      <FiltroCategorias categorias={categorias.data ?? []} seleccionada={categoriaId} onCambiar={(id) => ir(id)} />

      {isPending && <p role="status">Cargando productos…</p>}
      {isError && <p role="alert">No pudimos cargar los productos. Probá de nuevo en un rato.</p>}

      {data && data.total === 0 && <p>No hay productos {categoriaId ? 'en esta categoría' : 'cargados todavía'}.</p>}

      {data && data.total > 0 && (
        <>
          <ul className="space-y-3">
            {data.items.map((producto) => {
              const total = stockTotal(producto.variantes)
              return (
                <li key={producto.id} className={`${estiloTarjeta} flex flex-wrap items-center gap-4`}>
                  {producto.imagen ? (
                    <img src={producto.imagen} alt="" className="h-20 w-20 rounded-2xl object-cover" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amarillo-suave text-center text-xs text-texto-suave">
                      Sin foto
                    </div>
                  )}
                  <div className="min-w-48 flex-1">
                    <h2 className="text-xl font-semibold">{producto.nombre}</h2>
                    <p className="text-sm text-texto-suave">
                      {producto.categoria.nombre} · {formatearPrecio(producto.precio)}
                    </p>
                    <p className="mt-1 text-sm">
                      {producto.variantes.length === 0 ? (
                        <strong>Sin talles cargados: no se puede comprar.</strong>
                      ) : (
                        <>
                          {total === 0 && <strong>Sin stock. </strong>}
                          {ordenarPorTalla(producto.variantes)
                            .map((variante) => `Talle ${variante.talla}: ${variante.stock}`)
                            .join(' · ')}
                        </>
                      )}
                    </p>
                  </div>
                  <Link
                    to={`/admin/productos/${producto.id}`}
                    className={estiloBotonSecundario}
                    aria-label={`Editar ${producto.nombre}`}
                  >
                    Editar
                  </Link>
                </li>
              )
            })}
          </ul>
          <Paginacion
            pagina={pagina}
            totalPaginas={totalDePaginas(data.total, PRODUCTOS_POR_PAGINA)}
            onCambiar={(nueva) => ir(categoriaId, nueva)}
            etiqueta="Páginas de productos"
          />
        </>
      )}
    </section>
  )
}
