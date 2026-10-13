// Los mismos limites que exige el backend.
const MINIMO_PASSWORD = 8
const MAXIMO_PASSWORD = 72
const MAXIMO_NOMBRE = 150

export const FORMA_DE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type DatosDeIngreso = { email: string; password: string }
export type DatosDeRegistro = DatosDeIngreso & { nombre: string; repetirPassword: string }

type Errores<T> = Partial<Record<keyof T, string>>

function errorDeEmail(email: string): string | undefined {
  if (!email.trim()) return 'Escribí tu email.'
  if (!FORMA_DE_EMAIL.test(email.trim())) return 'Revisá el email: tiene que ser como nombre@ejemplo.com.'
}

export function validarIngreso(datos: DatosDeIngreso): Errores<DatosDeIngreso> {
  const errores: Errores<DatosDeIngreso> = {}
  const email = errorDeEmail(datos.email)
  if (email) errores.email = email
  if (!datos.password) errores.password = 'Escribí tu contraseña.'
  return errores
}

export function validarRegistro(datos: DatosDeRegistro): Errores<DatosDeRegistro> {
  const errores: Errores<DatosDeRegistro> = {}

  if (!datos.nombre.trim()) errores.nombre = 'Escribí tu nombre.'
  else if (datos.nombre.trim().length > MAXIMO_NOMBRE) errores.nombre = 'El nombre es demasiado largo.'

  const email = errorDeEmail(datos.email)
  if (email) errores.email = email

  // La contrasena no se recorta: un espacio al principio o al final es parte de ella.
  if (datos.password.length < MINIMO_PASSWORD) {
    errores.password = `La contraseña tiene que tener al menos ${MINIMO_PASSWORD} caracteres.`
  } else if (datos.password.length > MAXIMO_PASSWORD) {
    errores.password = `La contraseña puede tener hasta ${MAXIMO_PASSWORD} caracteres.`
  }

  if (datos.repetirPassword !== datos.password) errores.repetirPassword = 'Las dos contraseñas no coinciden.'

  return errores
}

/**
 * A donde volver despues de ingresar (viene en la URL: /ingresar?volver=/checkout).
 *
 * Solo se aceptan direcciones de la propia tienda. Sin este control, alguien podria
 * repartir un link a nuestra pagina de ingreso que, despues de entrar, mande a la persona
 * a un sitio falso (se llama "redireccion abierta"). Por eso se rechaza todo lo que no
 * empiece con una sola barra: "https://otro.com", "//otro.com", "/\otro.com".
 */
export function rutaParaVolver(valor: string | null, porDefecto = '/mi-cuenta'): string {
  if (!valor || !/^\/(?![/\\])/.test(valor)) return porDefecto
  return valor
}
