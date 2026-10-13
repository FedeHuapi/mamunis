import { useSearchParams } from 'react-router'

import { PRODUCTOS_POR_PAGINA, useCategorias, useProductos } from '../api/productos'
import { FiltroCategorias } from '../components/FiltroCategorias'
import { Paginacion } from '../components/Paginacion'
import { TarjetaProducto } from '../components/TarjetaProducto'
import { leerEnteroPositivo, totalDePaginas } from '../lib/catalogo'

export function Catalogo() {
  // La pagina y la categoria viven en la URL (?pagina=2&categoria=3): asi un link al
  // catalogo filtrado se puede compartir, y el boton "atras" del navegador funciona.
  const [parametros, setParametros] = useSearchParams()
  const pagina = leerEnteroPositivo(parametros.get('pagina')) ?? 1
  const categoriaId = leerEnteroPositivo(parametros.get('categoria'))

  const productos = useProductos({ pagina, categoriaId })
  const categorias = useCategorias()

  function irA(nuevaPagina: number, nuevaCategoria = categoriaId) {
    const siguientes = new URLSearchParams()
    if (nuevaCategoria) siguientes.set('categoria', String(nuevaCategoria))
    if (nuevaPagina > 1) siguientes.set('pagina', String(nuevaPagina))
    setParametros(siguientes)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <section className="mb-10 rounded-3xl border-2 border-tinta bg-amarillo px-6 py-10 md:px-10">
        <h1 className="text-4xl font-bold md:text-5xl">Ropa para jugar todo el día</h1>
        <p className="mt-3 max-w-xl text-lg text-tinta">Prendas cómodas para chicos y chicas, en talles del 10 al 16.</p>
      </section>

      <section aria-labelledby="titulo-catalogo">
        <h2 id="titulo-catalogo" className="mb-4 text-3xl font-bold">
          Productos
        </h2>

        {categorias.data && (
          <FiltroCategorias
            categorias={categorias.data}
            seleccionada={categoriaId}
            onCambiar={(nuevaCategoria) => irA(1, nuevaCategoria)}
          />
        )}

        {productos.isPending && <p role="status">Cargando productos…</p>}
        {productos.isError && <p role="alert">No pudimos cargar los productos. Probá de nuevo en un rato.</p>}
        {productos.data?.total === 0 && (
          <p>{categoriaId ? 'No hay productos en esta categoría.' : 'Todavía no hay productos cargados.'}</p>
        )}
        {productos.data && productos.data.items.length > 0 && (
          <ul
            aria-busy={productos.isPlaceholderData}
            className={`grid grid-cols-2 gap-4 transition-opacity md:grid-cols-3 md:gap-6 lg:grid-cols-4 ${
              productos.isPlaceholderData ? 'opacity-60' : ''
            }`}
          >
            {productos.data.items.map((producto) => (
              <li key={producto.id}>
                <TarjetaProducto producto={producto} />
              </li>
            ))}
          </ul>
        )}
        {productos.data && productos.data.total > 0 && productos.data.items.length === 0 && (
          <p>
            Esta página no existe.{' '}
            <button type="button" className="font-semibold underline" onClick={() => irA(1)}>
              Ir a la primera
            </button>
          </p>
        )}

        {productos.data && (
          <Paginacion
            pagina={pagina}
            totalPaginas={totalDePaginas(productos.data.total, PRODUCTOS_POR_PAGINA)}
            onCambiar={(nuevaPagina) => irA(nuevaPagina)}
          />
        )}
      </section>
    </>
  )
}
