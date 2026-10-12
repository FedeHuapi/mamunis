import type { ReactNode } from 'react'

import { NoEncontrada } from '../pages/NoEncontrada'
import { RequiereSesion } from './RequiereSesion'

/**
 * Envuelve el panel: sin sesion manda a ingresar, y con una cuenta que no es
 * administradora muestra "pagina no encontrada".
 *
 * Igual que RequiereSesion, esto es comodidad y no seguridad. El codigo del panel lo
 * puede leer cualquiera; lo que no puede hacer nadie sin ser administrador es que el
 * backend le responda: cada llamada del panel se revisa alla (requerir_admin).
 */
export function RequiereAdmin({ children }: { children: ReactNode }) {
  return <RequiereSesion>{(usuario) => (usuario.es_admin ? children : <NoEncontrada />)}</RequiereSesion>
}
