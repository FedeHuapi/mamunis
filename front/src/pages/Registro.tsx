import { type FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'

import { useRegistrarse, useUsuario } from '../api/usuarios'
import { Campo, estiloBotonPrincipal, estiloCampo } from '../components/Campo'
import { type DatosDeRegistro, rutaParaVolver, validarRegistro } from '../lib/cuenta'
import { estiloAviso } from '../lib/estilos'
import { enfocarPrimerError } from '../lib/formularios'

const CAMPOS: (keyof DatosDeRegistro)[] = ['nombre', 'email', 'password', 'repetirPassword']

export function Registro() {
  const navigate = useNavigate()
  const [parametros] = useSearchParams()
  const volver = rutaParaVolver(parametros.get('volver'))
  const usuario = useUsuario()
  const registrarse = useRegistrarse()
  const [datos, setDatos] = useState<DatosDeRegistro>({ nombre: '', email: '', password: '', repetirPassword: '' })
  const [errores, setErrores] = useState<Partial<Record<keyof DatosDeRegistro, string>>>({})

  if (usuario.data) return <Navigate to={volver} replace />

  function cambiar(campo: keyof DatosDeRegistro, valor: string) {
    setDatos((actuales) => ({ ...actuales, [campo]: valor }))
    if (errores[campo]) setErrores((actuales) => ({ ...actuales, [campo]: undefined }))
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const encontrados = validarRegistro(datos)
    setErrores(encontrados)
    if (enfocarPrimerError(CAMPOS, encontrados)) return
    registrarse.mutate(datos, { onSuccess: () => navigate(volver, { replace: true }) })
  }

  return (
    <section aria-labelledby="titulo-registro" className="mx-auto max-w-md">
      <h1 id="titulo-registro" className="mb-2 text-4xl font-semibold">
        Crear una cuenta
      </h1>
      <p className="mb-6 text-texto-suave">Con una cuenta, tus pedidos quedan guardados para que los puedas consultar.</p>

      <form noValidate onSubmit={enviar} className="space-y-5">
        <Campo id="nombre" etiqueta="Nombre" error={errores.nombre}>
          {(props) => (
            <input
              {...props}
              type="text"
              autoComplete="name"
              maxLength={150}
              value={datos.nombre}
              onChange={(e) => cambiar('nombre', e.target.value)}
              className={estiloCampo}
            />
          )}
        </Campo>

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

        <Campo id="password" etiqueta="Contraseña" ayuda="Al menos 8 caracteres." error={errores.password}>
          {(props) => (
            <input
              {...props}
              type="password"
              autoComplete="new-password"
              maxLength={72}
              value={datos.password}
              onChange={(e) => cambiar('password', e.target.value)}
              className={estiloCampo}
            />
          )}
        </Campo>

        <Campo id="repetirPassword" etiqueta="Repetí la contraseña" error={errores.repetirPassword}>
          {(props) => (
            <input
              {...props}
              type="password"
              autoComplete="new-password"
              maxLength={72}
              value={datos.repetirPassword}
              onChange={(e) => cambiar('repetirPassword', e.target.value)}
              className={estiloCampo}
            />
          )}
        </Campo>

        {/* Por ejemplo "Ya existe una cuenta con ese email". */}
        {registrarse.isError && (
          <p role="alert" className={estiloAviso}>
            {registrarse.error.message}
          </p>
        )}

        <button type="submit" disabled={registrarse.isPending} className={estiloBotonPrincipal}>
          {registrarse.isPending ? 'Creando tu cuenta…' : 'Crear cuenta'}
        </button>
      </form>

      <p className="mt-6">
        ¿Ya tenés cuenta?{' '}
        <Link to={`/ingresar?volver=${encodeURIComponent(volver)}`} className="font-semibold underline">
          Ingresar
        </Link>
      </p>
    </section>
  )
}
