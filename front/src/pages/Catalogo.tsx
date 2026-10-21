import { useSearchParams } from 'react-router'

import { PRODUCTOS_POR_PAGINA, useCategorias, useProductos } from '../api/productos'
import { FiltroCategorias } from '../components/FiltroCategorias'
import { Paginacion } from '../components/Paginacion'
import { Bienvenida, SobreMamunisResumen } from '../components/Portada'
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
    // Se vuelve al principio de la grilla, no de la pagina: la franja de bienvenida ya se vio.
    document.getElementById('productos')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <Bienvenida />

      {/* scroll-mt: al bajar con "Ver productos", el titulo no queda pegado al borde. */}
      <section id="productos" aria-labelledby="titulo-catalogo" className="scroll-mt-6">
        <h2 id="titulo-catalogo" className="mb-5 text-3xl font-semibold">
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

      <SobreMamunisResumen />
    </>
  )
}
