import { type FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'

import { useIngresar, useUsuario } from '../api/usuarios'
import { Campo, estiloBotonPrincipal, estiloCampo } from '../components/Campo'
import { type DatosDeIngreso, rutaParaVolver, validarIngreso } from '../lib/cuenta'
import { enfocarPrimerError } from '../lib/formularios'

const CAMPOS: (keyof DatosDeIngreso)[] = ['email', 'password']

export function Ingresar() {
  const navigate = useNavigate()
  const [parametros] = useSearchParams()
  const volver = rutaParaVolver(parametros.get('volver'))
  const usuario = useUsuario()
  const ingresar = useIngresar()
  const [datos, setDatos] = useState<DatosDeIngreso>({ email: '', password: '' })
  const [errores, setErrores] = useState<Partial<Record<keyof DatosDeIngreso, string>>>({})

  // Quien ya ingreso no tiene nada que hacer en esta pantalla.
  if (usuario.data) return <Navigate to={volver} replace />

  function cambiar(campo: keyof DatosDeIngreso, valor: string) {
    setDatos((actuales) => ({ ...actuales, [campo]: valor }))
    if (errores[campo]) setErrores((actuales) => ({ ...actuales, [campo]: undefined }))
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const encontrados = validarIngreso(datos)
    setErrores(encontrados)
    if (enfocarPrimerError(CAMPOS, encontrados)) return
    ingresar.mutate(datos, { onSuccess: () => navigate(volver, { replace: true }) })
  }

  return (
    <section aria-labelledby="titulo-ingresar" className="mx-auto max-w-md">
      <h1 id="titulo-ingresar" className="mb-6 text-4xl font-bold">
        Ingresar
      </h1>

      <form noValidate onSubmit={enviar} className="space-y-5">
        <Campo id="email" etiqueta="Email" error={errores.email}>
          {(props) => (
            <input
              {...props}
              type="email"
              autoComplete="email"
              value={datos.email}
              onChange={(e) => cambiar('email', e.target.value)}
              className={estiloCampo}
            />
          )}
        </Campo>

        <Campo id="password" etiqueta="Contraseña" error={errores.password}>
          {(props) => (
            <input
              {...props}
              type="password"
              autoComplete="current-password"
              value={datos.password}
              onChange={(e) => cambiar('password', e.target.value)}
              className={estiloCampo}
            />
          )}
        </Campo>

        {/* Por ejemplo "Email o contraseña incorrectos" o el aviso de demasiados intentos. */}
        {ingresar.isError && (
          <p role="alert" className="rounded-2xl border-2 border-dashed border-tinta bg-amarillo-suave p-4 font-semibold">
            {ingresar.error.message}
          </p>
        )}

        <button type="submit" disabled={ingresar.isPending} className={estiloBotonPrincipal}>
          {ingresar.isPending ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>

      <p className="mt-6">
        ¿No tenés cuenta?{' '}
        <Link to={`/registro?volver=${encodeURIComponent(volver)}`} className="font-semibold underline">
          Crear una cuenta
        </Link>
      </p>
    </section>
  )
}
