import { useProductos } from '../api/productos'
import { TarjetaProducto } from '../components/TarjetaProducto'

export function Catalogo() {
  const { data, isPending, isError } = useProductos(1)

  if (isPending) return <p role="status">Cargando productos…</p>
  if (isError) return <p role="alert">No pudimos cargar los productos. Probá de nuevo en un rato.</p>
  if (data.total === 0) return <p>Todavía no hay productos cargados.</p>

  return (
    <section aria-labelledby="titulo-catalogo">
      <h1 id="titulo-catalogo" className="mb-6 text-3xl font-extrabold">
        Productos
      </h1>
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {data.items.map((producto) => (
          <li key={producto.id}>
            <TarjetaProducto producto={producto} />
          </li>
        ))}
      </ul>
    </section>
  )
}
