/*
  Donde se guarda la sesion.

  Al ingresar, el backend entrega un token que dura 60 minutos. Se guarda en localStorage
  para que la sesion sobreviva a recargar la pagina.

  El riesgo de esta decision: si alguna vez se colara codigo ajeno en la pagina (un ataque
  XSS), ese codigo podria leer el token. Se acepta porque el token vence solo en una hora
  y no hay forma de renovarlo, y se compensa cuidando que ese codigo no pueda entrar:
    - React escapa todo el texto que muestra. Nunca se usa dangerouslySetInnerHTML.
    - No se cargan scripts de otros sitios, y las librerias se auditan en el CI.
  Si la sesion pasara a durar dias, o se sumaran pagos, corresponde mudarla a una cookie
  httpOnly, que el codigo de la pagina no puede leer (es un cambio en el backend).

  El token nunca se pone en una URL ni se muestra en pantalla.
*/
const CLAVE = 'mamunis.sesion'

export function leerToken(): string | null {
  try {
    return localStorage.getItem(CLAVE)
  } catch {
    return null
  }
}

export function guardarToken(token: string) {
  try {
    localStorage.setItem(CLAVE, token)
  } catch {
    // Sin almacenamiento disponible no se puede mantener la sesion.
  }
}

export function borrarToken() {
  try {
    localStorage.removeItem(CLAVE)
  } catch {
    // Nada que borrar.
  }
}
