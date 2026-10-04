import { useProductos } from '../api/productos'
import { TarjetaProducto } from '../components/TarjetaProducto'

export function Catalogo() {
  const { data, isPending, isError } = useProductos(1)

  return (
    <>
      <section className="mb-10 rounded-3xl border-2 border-tinta bg-amarillo px-6 py-10 md:px-10">
        <h1 className="text-4xl font-bold md:text-5xl">Ropa para jugar todo el día</h1>
        <p className="mt-3 max-w-xl text-lg text-tinta">Prendas cómodas para chicos y chicas, en talles del 10 al 16.</p>
      </section>

      <section aria-labelledby="titulo-catalogo">
        <h2 id="titulo-catalogo" className="mb-6 text-3xl font-bold">
          Productos
        </h2>
        {isPending && <p role="status">Cargando productos…</p>}
        {isError && <p role="alert">No pudimos cargar los productos. Probá de nuevo en un rato.</p>}
        {data?.total === 0 && <p>Todavía no hay productos cargados.</p>}
        {data && data.total > 0 && (
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {data.items.map((producto) => (
              <li key={producto.id}>
                <TarjetaProducto producto={producto} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
