import { type ChangeEvent, type FormEvent, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import {
  useAgregarTalle,
  useCambiarStock,
  useEliminarProducto,
  useEliminarTalle,
  useGuardarProducto,
  useSubirImagen,
} from '../../api/admin'
import type { Producto, Variante } from '../../api/client'
import { useCategorias, useProducto } from '../../api/productos'
import { BotonConConfirmacion } from '../../components/BotonConConfirmacion'
import { Campo, estiloBotonPrincipal, estiloCampo } from '../../components/Campo'
import {
  type DatosDeProducto,
  type ErroresDeProducto,
  FORMATOS_ACEPTADOS,
  leerStock,
  normalizarPrecio,
  revisarImagen,
  type StocksEscritos,
  TALLES,
  validarProducto,
  variantesDesdeStocks,
} from '../../lib/admin'
import { leerEnteroPositivo, ordenarPorTalla } from '../../lib/catalogo'
import { estiloAviso, estiloBotonLleno, estiloCampoChico, estiloTarjeta } from '../../lib/estilos'
import { enfocarPrimerError } from '../../lib/formularios'
import { NoEncontrada } from '../NoEncontrada'

const CAMPOS: (keyof ErroresDeProducto)[] = ['nombre', 'precio', 'categoriaId', 'talles']

/** Los datos del producto. Sirve para crear uno (sin `producto`) y para modificarlo. */
function FormularioProducto({ producto }: { producto?: Producto }) {
  const navigate = useNavigate()
  const categorias = useCategorias()
  const guardar = useGuardarProducto()
  // Solo se guarda lo escrito: mientras no se toque un campo, se muestra el dato actual.
  const [escrito, setEscrito] = useState<Partial<DatosDeProducto>>({})
  const [stocks, setStocks] = useState<StocksEscritos>({})
  const [errores, setErrores] = useState<ErroresDeProducto>({})
  const datos: DatosDeProducto = {
    nombre: escrito.nombre ?? producto?.nombre ?? '',
    descripcion: escrito.descripcion ?? producto?.descripcion ?? '',
    // La API manda "5000.00"; en la casilla se muestra "5000".
    precio: escrito.precio ?? (producto ? String(Number(producto.precio)) : ''),
    categoriaId: escrito.categoriaId ?? (producto ? String(producto.categoria_id) : ''),
  }

  function cambiar(campo: keyof DatosDeProducto, valor: string) {
    setEscrito((actuales) => ({ ...actuales, [campo]: valor }))
    if (errores[campo]) setErrores((actuales) => ({ ...actuales, [campo]: undefined }))
    guardar.reset()
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const encontrados = validarProducto(datos, producto ? {} : stocks)
    setErrores(encontrados)
    if (enfocarPrimerError(CAMPOS, encontrados)) return

    guardar.mutate(
      {
        id: producto?.id,
        nombre: datos.nombre.trim(),
        descripcion: datos.descripcion.trim() || null,
        precio: normalizarPrecio(datos.precio),
        categoria_id: Number(datos.categoriaId),
        variantes: producto ? undefined : variantesDesdeStocks(stocks),
      },
      {
        // Recien creado, se pasa a su pantalla de edicion para subirle la foto.
        onSuccess: (guardado) => {
          if (!producto) navigate(`/admin/productos/${guardado.id}`, { replace: true })
        },
      },
    )
  }

  if (categorias.data?.length === 0) {
    return (
      <p className={estiloAviso}>
        Todo producto va en una categoría, y todavía no hay ninguna.{' '}
        <Link to="/admin/categorias" className="underline">
          Crear una categoría
        </Link>
      </p>
    )
  }

  return (
    <form noValidate onSubmit={enviar} className="space-y-5">
      <Campo id="nombre" etiqueta="Nombre" error={errores.nombre}>
        {(props) => (
          <input
            {...props}
            type="text"
            maxLength={150}
            value={datos.nombre}
            onChange={(e) => cambiar('nombre', e.target.value)}
            className={estiloCampo}
          />
        )}
      </Campo>

      <Campo id="descripcion" etiqueta="Descripción" ayuda="Opcional. Se muestra en la ficha del producto.">
        {(props) => (
          <textarea
            {...props}
            rows={4}
            value={datos.descripcion}
            onChange={(e) => cambiar('descripcion', e.target.value)}
            className={estiloCampo}
          />
        )}
      </Campo>

      <div className="grid gap-5 md:grid-cols-2">
        <Campo id="precio" etiqueta="Precio" ayuda="En pesos, sin puntos de miles. Por ejemplo: 15000." error={errores.precio}>
          {(props) => (
            <input
              {...props}
              type="text"
              inputMode="decimal"
              value={datos.precio}
              onChange={(e) => cambiar('precio', e.target.value)}
              className={estiloCampo}
            />
          )}
        </Campo>

        <Campo id="categoriaId" etiqueta="Categoría" error={errores.categoriaId}>
          {(props) => (
            <select
              {...props}
              value={datos.categoriaId}
              onChange={(e) => cambiar('categoriaId', e.target.value)}
              className={estiloCampo}
            >
              <option value="">Elegí una…</option>
              {categorias.data?.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          )}
        </Campo>
      </div>

      {!producto && (
        <fieldset id="talles" tabIndex={-1} aria-describedby="talles-ayuda">
          <legend className="mb-1 font-titulos text-lg font-semibold text-tinta">Talles y stock</legend>
          <p id="talles-ayuda" className="mb-3 text-sm text-texto-suave">
            Escribí cuántas unidades hay de cada talle. Dejá vacío el talle que no se vende.
          </p>
          <div className="flex flex-wrap gap-4">
            {TALLES.map((talla) => (
              <label key={talla} className="flex items-center gap-2 font-semibold">
                Talle {talla}
                <input
                  type="text"
                  inputMode="numeric"
                  value={stocks[talla] ?? ''}
                  onChange={(e) => {
                    setStocks((actuales) => ({ ...actuales, [talla]: e.target.value }))
                    if (errores.talles) setErrores((actuales) => ({ ...actuales, talles: undefined }))
                  }}
                  className={`w-24 ${estiloCampoChico}`}
                />
              </label>
            ))}
          </div>
          {errores.talles && <p className="mt-2 font-semibold">{errores.talles}</p>}
        </fieldset>
      )}

      {guardar.isError && (
        <p role="alert" className={estiloAviso}>
          {guardar.error.message}
        </p>
      )}
      {producto && guardar.isSuccess && (
        <p role="status" className="font-semibold">
          Cambios guardados.
        </p>
      )}

      <button type="submit" disabled={guardar.isPending} className={estiloBotonPrincipal}>
        {guardar.isPending ? 'Guardando…' : producto ? 'Guardar cambios' : 'Crear producto'}
      </button>
    </form>
  )
}

function SeccionFoto({ producto }: { producto: Producto }) {
  const subir = useSubirImagen()
  const [problema, setProblema] = useState<string>()

  function elegir(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0]
    evento.target.value = '' // asi se puede volver a elegir el mismo archivo
    if (!archivo) return

    const encontrado = revisarImagen(archivo)
    setProblema(encontrado)
    if (encontrado) return
    subir.mutate({ productoId: producto.id, archivo })
  }

  const aviso = problema ?? (subir.isError ? subir.error.message : undefined)

  return (
    <section aria-labelledby="titulo-foto" className={estiloTarjeta}>
      <h2 id="titulo-foto" className="mb-3 text-2xl font-bold">
        Foto
      </h2>
      <div className="flex flex-wrap items-center gap-5">
        {producto.imagen ? (
          <img src={producto.imagen} alt={`Foto actual de ${producto.nombre}`} className="h-40 w-40 rounded-2xl object-cover" />
        ) : (
          <div className="flex h-40 w-40 items-center justify-center rounded-2xl bg-amarillo-suave text-texto-suave">
            Sin foto
          </div>
        )}
        <div>
          <label htmlFor="foto" className="mb-1 block font-semibold">
            {producto.imagen ? 'Cambiar la foto' : 'Subir una foto'}
          </label>
          <input
            id="foto"
            type="file"
            accept={FORMATOS_ACEPTADOS}
            disabled={subir.isPending}
            onChange={elegir}
            aria-describedby="foto-ayuda"
            className="block max-w-full"
          />
          <p id="foto-ayuda" className="mt-1 text-sm text-texto-suave">
            JPG, PNG o WebP, de hasta 5 MB. Se sube apenas la elegís.
          </p>
          {subir.isPending && <p role="status">Subiendo la foto…</p>}
          {subir.isSuccess && !aviso && <p role="status">Foto guardada.</p>}
        </div>
      </div>
      {aviso && (
        <p role="alert" className={`mt-4 ${estiloAviso}`}>
          {aviso}
        </p>
      )}
    </section>
  )
}

function FilaTalle({ productoId, variante }: { productoId: number; variante: Variante }) {
  const cambiarStock = useCambiarStock()
  const eliminar = useEliminarTalle()
  // undefined = no se toco: se muestra el stock actual. Al empezar a escribir se anota el
  // stock que se estaba viendo: la pantalla se actualiza sola y, si se tomara el valor al
  // guardar, una venta que entro mientras tanto se pisaria igual.
  const [edicion, setEdicion] = useState<{ texto: string; visto: number }>()
  const texto = edicion?.texto ?? String(variante.stock)
  const stock = leerStock(texto)
  const ocupado = cambiarStock.isPending || eliminar.isPending
  const error = cambiarStock.error ?? eliminar.error
  const idCampo = `stock-${variante.id}`

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (stock === undefined) return
    cambiarStock.mutate(
      { productoId, varianteId: variante.id, stock, stockAnterior: edicion?.visto ?? variante.stock },
      // Si el stock cambio en el medio, la casilla vuelve a mostrar el valor real y el aviso dice cual es.
      { onSettled: () => setEdicion(undefined) },
    )
  }

  return (
    <li className="border-t-2 border-borde py-3 first:border-t-0">
      <form onSubmit={enviar} className="flex flex-wrap items-center gap-3">
        <label htmlFor={idCampo} className="w-20 font-titulos text-lg font-semibold">
          Talle {variante.talla}
        </label>
        <input
          id={idCampo}
          type="text"
          inputMode="numeric"
          aria-invalid={stock === undefined}
          value={texto}
          onChange={(e) => setEdicion({ texto: e.target.value, visto: edicion?.visto ?? variante.stock })}
          className={`w-24 ${estiloCampoChico}`}
        />
        <span className="text-texto-suave">unidades</span>
        <button type="submit" className={estiloBotonLleno} disabled={ocupado || stock === undefined || stock === variante.stock}>
          Guardar stock
        </button>
        <BotonConConfirmacion
          etiqueta="Quitar talle"
          pregunta={`¿Quitar el talle ${variante.talla} de este producto?`}
          confirmar="Sí, quitar"
          deshabilitado={ocupado}
          onConfirmar={() => eliminar.mutate({ productoId, varianteId: variante.id })}
        />
      </form>
      {stock === undefined && <p className="mt-1 font-semibold">El stock tiene que ser un número entero, de 0 para arriba.</p>}
      {error && (
        <p role="alert" className="mt-1 font-semibold">
          {error.message}
        </p>
      )}
    </li>
  )
}

function AgregarTalle({ productoId, disponibles }: { productoId: number; disponibles: string[] }) {
  const agregar = useAgregarTalle()
  const [elegido, setElegido] = useState<string>()
  const [texto, setTexto] = useState('0')
  // Si el talle elegido ya se agrego, se pasa al primero que quede.
  const talla = elegido && disponibles.includes(elegido) ? elegido : disponibles[0]
  const stock = leerStock(texto)

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (stock === undefined) return
    agregar.mutate({ productoId, talla, stock }, { onSuccess: () => setTexto('0') })
  }

  return (
    <form onSubmit={enviar} className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-amarillo-suave p-4">
      <label htmlFor="talle-nuevo" className="font-semibold">
        Agregar talle
      </label>
      <select id="talle-nuevo" value={talla} onChange={(e) => setElegido(e.target.value)} className={estiloCampoChico}>
        {disponibles.map((opcion) => (
          <option key={opcion} value={opcion}>
            {opcion}
          </option>
        ))}
      </select>
      <label htmlFor="stock-nuevo" className="font-semibold">
        Stock
      </label>
      <input
        id="stock-nuevo"
        type="text"
        inputMode="numeric"
        aria-invalid={stock === undefined}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        className={`w-24 ${estiloCampoChico}`}
      />
      <button type="submit" className={estiloBotonLleno} disabled={agregar.isPending || stock === undefined}>
        Agregar
      </button>
      {agregar.isError && (
        <p role="alert" className="w-full font-semibold">
          {agregar.error.message}
        </p>
      )}
    </form>
  )
}

function SeccionTalles({ producto }: { producto: Producto }) {
  const cargados = producto.variantes.map((variante) => variante.talla)
  const disponibles = TALLES.filter((talla) => !cargados.includes(talla))

  return (
    <section aria-labelledby="titulo-talles" className={estiloTarjeta}>
      <h2 id="titulo-talles" className="mb-1 text-2xl font-bold">
        Talles y stock
      </h2>
      <p className="mb-3 text-sm text-texto-suave">Cada talle se guarda por separado, con su propio botón.</p>
      {producto.variantes.length === 0 ? (
        <p className="font-semibold">Este producto no tiene talles: en la tienda no se puede comprar.</p>
      ) : (
        <ul>
          {ordenarPorTalla(producto.variantes).map((variante) => (
            <FilaTalle key={variante.id} productoId={producto.id} variante={variante} />
          ))}
        </ul>
      )}
      {disponibles.length > 0 && <AgregarTalle productoId={producto.id} disponibles={disponibles} />}
    </section>
  )
}

function EditarProducto({ id }: { id: number }) {
  const navigate = useNavigate()
  const { data: producto, isPending, isError } = useProducto(id)
  const eliminar = useEliminarProducto()

  if (isPending) return <p role="status">Cargando el producto…</p>
  if (isError) return <p role="alert">No pudimos cargar el producto. Probá de nuevo en un rato.</p>
  if (!producto) return <NoEncontrada />

  return (
    <div className="space-y-8">
      <div>
        <Link to="/admin/productos" className="font-semibold underline">
          ← Volver a productos
        </Link>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-4xl font-bold">{producto.nombre}</h1>
          <Link to={`/productos/${producto.id}`} className="font-semibold underline">
            Ver en la tienda
          </Link>
        </div>
      </div>

      <section aria-labelledby="titulo-datos" className={estiloTarjeta}>
        <h2 id="titulo-datos" className="mb-4 text-2xl font-bold">
          Datos
        </h2>
        <FormularioProducto producto={producto} />
      </section>

      <SeccionFoto producto={producto} />
      <SeccionTalles producto={producto} />

      <section aria-labelledby="titulo-eliminar" className={estiloTarjeta}>
        <h2 id="titulo-eliminar" className="mb-1 text-2xl font-bold">
          Eliminar
        </h2>
        <p className="mb-3 text-sm text-texto-suave">
          Un producto que está en algún carrito o pedido no se puede eliminar. Para dejar de venderlo, poné su stock en 0.
        </p>
        <BotonConConfirmacion
          etiqueta="Eliminar producto"
          pregunta={`¿Eliminar “${producto.nombre}”? No se puede deshacer.`}
          confirmar="Sí, eliminar"
          deshabilitado={eliminar.isPending}
          onConfirmar={() => eliminar.mutate(producto.id, { onSuccess: () => navigate('/admin/productos') })}
        />
        {eliminar.isError && (
          <p role="alert" className={`mt-4 ${estiloAviso}`}>
            {eliminar.error.message}
          </p>
        )}
      </section>
    </div>
  )
}

/** La pantalla de un producto en el panel: `/admin/productos/nuevo` o `/admin/productos/:id`. */
export function AdminProducto() {
  const { id } = useParams()

  if (id === undefined) {
    return (
      <section aria-labelledby="titulo-nuevo" className="max-w-2xl">
        <Link to="/admin/productos" className="mb-2 inline-block font-semibold underline">
          ← Volver a productos
        </Link>
        <h1 id="titulo-nuevo" className="mb-2 text-4xl font-bold">
          Nuevo producto
        </h1>
        <p className="mb-6 text-texto-suave">La foto se sube en el paso siguiente, una vez creado.</p>
        <FormularioProducto />
      </section>
    )
  }

  const numero = leerEnteroPositivo(id)
  if (!numero) return <NoEncontrada />
  // key: al pasar de un producto a otro se empieza con las casillas limpias.
  return <EditarProducto key={numero} id={numero} />
}
