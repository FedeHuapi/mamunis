import type { DatosDeContacto } from '../api/pedidos'

export type ErroresDeContacto = Partial<Record<keyof DatosDeContacto, string>>

// Los mismos limites y las mismas reglas que el backend (back/app/schemas/pedido.py):
// si cambia una, cambia la otra.
const MAXIMO_NOMBRE = 150
const MAXIMO_TELEFONO = 50
const MAXIMO_DIRECCION = 300
const LARGO_DE_UN_NUMERO = 10 // caracteristica + numero, sin 0 ni 15: 11 2345 6789, 351 234 5678
const MINIMO_DE_LETRAS = 3

const FORMA_DE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Devuelve el telefono argentino en su forma de 10 digitos, o null si no parece uno.
 * Acepta las formas en que la gente lo escribe: +54 9 11 2345-6789, (011) 15-2345-6789,
 * 0351 15 234 5678, 1123456789.
 */
export function numeroNacional(telefono: string): string | null {
  let digitos = telefono.replace(/\D/g, '')
  for (const prefijo of ['54', '9', '0']) {
    if (digitos.startsWith(prefijo)) digitos = digitos.slice(prefijo.length)
  }
  if (digitos.length === LARGO_DE_UN_NUMERO + 2) {
    // El 15 de los celulares va despues de la caracteristica, que tiene 2, 3 o 4 digitos.
    const largo = [2, 3, 4].find((posicion) => digitos.slice(posicion, posicion + 2) === '15')
    if (largo) digitos = digitos.slice(0, largo) + digitos.slice(largo + 2)
  }
  // Las caracteristicas argentinas son 11 (Buenos Aires) o empiezan con 2 o 3.
  const caracteristicaValida = digitos.startsWith('11') || ['2', '3'].includes(digitos[0])
  // 1111111111 tiene la forma correcta, pero no es un numero.
  if (digitos.length !== LARGO_DE_UN_NUMERO || !caracteristicaValida || new Set(digitos).size < 3) return null
  return digitos
}

function cantidadDeLetras(texto: string): number {
  return texto.match(/\p{L}/gu)?.length ?? 0
}

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
  else if (cantidadDeLetras(nombre) < 2) errores.nombre = 'Revisá el nombre.'
  else if (nombre.length > MAXIMO_NOMBRE) errores.nombre = 'El nombre es demasiado largo.'

  if (!email) errores.email = 'Escribí tu email.'
  else if (!FORMA_DE_EMAIL.test(email)) errores.email = 'Revisá el email: tiene que ser como nombre@ejemplo.com.'

  // Es el dato por el que nos vamos a comunicar: se acepta escrito de cualquier forma
  // (+54 9 11 1234-5678), pero tiene que ser un numero argentino completo.
  if (!telefono) errores.telefono = 'Escribí tu número de WhatsApp.'
  else if (telefono.length > MAXIMO_TELEFONO) errores.telefono = 'El número es demasiado largo.'
  else if (!numeroNacional(telefono))
    errores.telefono = 'Revisá el número: tiene que ir con característica, por ejemplo 11 2345 6789.'

  // Una direccion tiene el nombre de una calle y una altura ("s/n" si no tiene numero).
  const direccion = datos.direccion.trim()
  const tieneAltura = /\d/.test(direccion) || direccion.toLowerCase().includes('s/n')
  if (!direccion) errores.direccion = 'Escribí la dirección de entrega.'
  else if (direccion.length > MAXIMO_DIRECCION) errores.direccion = 'La dirección es demasiado larga.'
  else if (cantidadDeLetras(direccion) < MINIMO_DE_LETRAS || !tieneAltura)
    errores.direccion = 'Revisá la dirección: tiene que tener calle y número.'

  return errores
}
