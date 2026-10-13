import { type FormEvent, useState } from 'react'

import { useEliminarCategoria, useGuardarCategoria } from '../../api/admin'
import type { Categoria } from '../../api/client'
import { useCategorias } from '../../api/productos'
import { BotonConConfirmacion } from '../../components/BotonConConfirmacion'
import { Campo } from '../../components/Campo'
import { validarNombreDeCategoria } from '../../lib/admin'
import { estiloAviso, estiloBotonLleno, estiloBotonSecundario, estiloCampoChico, estiloTarjeta } from '../../lib/estilos'

type PropsDelFormulario = {
  /** Si viene, se modifica esa categoria; si no, se crea una. */
  categoria?: Categoria
  alTerminar?: () => void
}

function FormularioCategoria({ categoria, alTerminar }: PropsDelFormulario) {
  const guardar = useGuardarCategoria()
  const [nombre, setNombre] = useState(categoria?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(categoria?.descripcion ?? '')
  const [error, setError] = useState<string>()
  // Puede haber varios formularios en pantalla: cada uno con sus propios ids.
  const prefijo = `categoria-${categoria?.id ?? 'nueva'}`

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const encontrado = validarNombreDeCategoria(nombre)
    setError(encontrado)
    if (encontrado) {
      document.getElementById(`${prefijo}-nombre`)?.focus()
      return
    }
    guardar.mutate(
      { id: categoria?.id, nombre: nombre.trim(), descripcion: descripcion.trim() || null },
      {
        onSuccess: () => {
          if (!categoria) {
            setNombre('')
            setDescripcion('')
          }
          alTerminar?.()
        },
      },
    )
  }

  return (
    <form noValidate onSubmit={enviar} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Campo id={`${prefijo}-nombre`} etiqueta="Nombre" error={error}>
          {(props) => (
            <input
              {...props}
              type="text"
              maxLength={100}
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value)
                setError(undefined)
              }}
              className={`w-full ${estiloCampoChico}`}
            />
          )}
        </Campo>
        <Campo id={`${prefijo}-descripcion`} etiqueta="Descripción" ayuda="Opcional.">
          {(props) => (
            <input
              {...props}
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className={`w-full ${estiloCampoChico}`}
            />
          )}
        </Campo>
      </div>

      {/* Por ejemplo "Ya existe una categoría con ese nombre". */}
      {guardar.isError && (
        <p role="alert" className={estiloAviso}>
          {guardar.error.message}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={guardar.isPending} className={estiloBotonLleno}>
          {guardar.isPending ? 'Guardando…' : categoria ? 'Guardar' : 'Crear categoría'}
        </button>
        {categoria && (
          <button type="button" className={estiloBotonSecundario} onClick={alTerminar}>
            Descartar cambios
          </button>
        )}
      </div>
    </form>
  )
}

function FilaCategoria({ categoria }: { categoria: Categoria }) {
  const eliminar = useEliminarCategoria()
  const [editando, setEditando] = useState(false)

  if (editando) {
    return (
      <li className={estiloTarjeta}>
        <FormularioCategoria categoria={categoria} alTerminar={() => setEditando(false)} />
      </li>
    )
  }

  return (
    <li className={estiloTarjeta}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold">{categoria.nombre}</h3>
          {categoria.descripcion && <p className="text-sm text-texto-suave">{categoria.descripcion}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={estiloBotonSecundario}
            aria-label={`Editar ${categoria.nombre}`}
            onClick={() => setEditando(true)}
          >
            Editar
          </button>
          <BotonConConfirmacion
            etiqueta="Eliminar"
            pregunta={`¿Eliminar la categoría “${categoria.nombre}”?`}
            confirmar="Sí, eliminar"
            deshabilitado={eliminar.isPending}
            onConfirmar={() => eliminar.mutate(categoria.id)}
          />
        </div>
      </div>
      {eliminar.isError && (
        <p role="alert" className={`mt-4 ${estiloAviso}`}>
          {eliminar.error.message}
        </p>
      )}
    </li>
  )
}

export function AdminCategorias() {
  const { data: categorias, isPending, isError } = useCategorias()

  return (
    <section aria-labelledby="titulo-categorias">
      <h1 id="titulo-categorias" className="mb-6 text-4xl font-bold">
        Categorías
      </h1>

      <section aria-labelledby="titulo-nueva-categoria" className={`mb-8 ${estiloTarjeta} bg-amarillo-suave`}>
        <h2 id="titulo-nueva-categoria" className="mb-3 text-2xl font-bold">
          Nueva categoría
        </h2>
        <FormularioCategoria />
      </section>

      <h2 className="mb-4 text-2xl font-bold">Categorías cargadas</h2>
      {isPending && <p role="status">Cargando categorías…</p>}
      {isError && <p role="alert">No pudimos cargar las categorías. Probá de nuevo en un rato.</p>}
      {categorias?.length === 0 && <p>Todavía no hay categorías.</p>}
      {categorias && categorias.length > 0 && (
        <ul className="space-y-3">
          {categorias.map((categoria) => (
            <FilaCategoria key={categoria.id} categoria={categoria} />
          ))}
        </ul>
      )}
    </section>
  )
}
