import type { DatosDeContacto } from '../api/pedidos'

export type ErroresDeContacto = Partial<Record<keyof DatosDeContacto, string>>

// Los mismos maximos que acepta el backend.
const MAXIMO_NOMBRE = 150
const MAXIMO_TELEFONO = 50
const MINIMO_DIGITOS_TELEFONO = 8

const FORMA_DE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Revisa los datos del formulario antes de mandarlos. Es para ayudar a la persona a
 * corregir rapido: la validacion que cuenta la vuelve a hacer el backend.
 */
export function validarContacto(datos: DatosDeContacto): ErroresDeContacto {
  const errores: ErroresDeContacto = {}
  const nombre = datos.nombre.trim()
  const email = datos.email.trim()
  const telefono = datos.telefono.trim()

  if (!nombre) errores.nombre = 'Escribí tu nombre y apellido.'
  else if (nombre.length > MAXIMO_NOMBRE) errores.nombre = 'El nombre es demasiado largo.'

  if (!email) errores.email = 'Escribí tu email.'
  else if (!FORMA_DE_EMAIL.test(email)) errores.email = 'Revisá el email: tiene que ser como nombre@ejemplo.com.'

  // Es el dato por el que nos vamos a comunicar: se acepta escrito de cualquier forma
  // (+54 9 11 1234-5678), pero tiene que tener digitos suficientes para ser un numero.
  const digitos = telefono.replace(/\D/g, '').length
  if (!telefono) errores.telefono = 'Escribí tu número de WhatsApp.'
  else if (digitos < MINIMO_DIGITOS_TELEFONO) errores.telefono = 'Revisá el número: le faltan dígitos.'
  else if (telefono.length > MAXIMO_TELEFONO) errores.telefono = 'El número es demasiado largo.'

  if (!datos.direccion.trim()) errores.direccion = 'Escribí la dirección de entrega.'

  return errores
}
