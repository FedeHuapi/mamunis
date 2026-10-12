import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'

import type { Usuario } from '../api/client'
import { useUsuario } from '../api/usuarios'

/**
 * Envuelve una pantalla que solo tiene sentido con una sesion iniciada. Sin sesion,
 * manda a ingresar y recuerda a donde se queria ir.
 *
 * Esto es comodidad, no seguridad: esconder una pantalla no protege nada, porque el
 * codigo de la pagina lo puede leer cualquiera. Lo que protege los datos es que el
 * backend exige el token en cada pedido.
 */
export function RequiereSesion({ children }: { children: (usuario: Usuario) => ReactNode }) {
  const { data: usuario, isPending } = useUsuario()
  const ubicacion = useLocation()

  if (isPending) return <p role="status">Cargando tu cuenta…</p>
  if (!usuario) {
    const volver = encodeURIComponent(ubicacion.pathname + ubicacion.search)
    return <Navigate to={`/ingresar?volver=${volver}`} replace />
  }
  return children(usuario)
}
