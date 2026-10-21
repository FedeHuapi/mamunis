/*
  Los datos de la tienda que se muestran en el sitio: contacto, redes y datos legales.
  Se cambian aca y se actualizan en todas las pantallas.

  Lo que esta entre corchetes todavia no se completo: se muestra tal cual, sin link, para
  que no se olvide. Una red con el usuario vacio ('') no aparece.
*/
import { numeroNacional } from './lib/checkout'

export type Red = 'instagram' | 'tiktok' | 'facebook'

export const TIENDA = {
  nombre: 'Mamunis',
  frase: '[Una línea sobre la marca]',

  // Escrito como se lo quiere mostrar; el link a WhatsApp se arma solo.
  whatsapp: '[11 2345 6789]',
  email: '[hola@mamunis.com.ar]',
  horario: '[Lunes a viernes de 9 a 18]',

  // El usuario, sin @ ni direccion: 'mamunis.ropa', no 'https://instagram.com/mamunis.ropa'.
  redes: [
    { red: 'instagram', usuario: '[usuario]' },
    { red: 'tiktok', usuario: '[usuario]' },
    { red: 'facebook', usuario: '[usuario]' },
  ] satisfies { red: Red; usuario: string }[],

  // Obligatorios para vender online: identifican quien vende.
  razonSocial: '[Razón social]',
  cuit: '[CUIT]',
}

/** Un dato que todavia no se completo. */
export function estaPendiente(valor: string): boolean {
  return valor.trim().startsWith('[')
}

/** El link de WhatsApp ("click to chat"), o undefined si el numero todavia no es valido. */
export function enlaceDeWhatsapp(numero: string): string | undefined {
  // El numero de ejemplo tiene forma de telefono: sin este control se armaria un link a el.
  if (estaPendiente(numero)) return undefined
  const nacional = numeroNacional(numero)
  // 54 es Argentina y el 9 va siempre: asi arma WhatsApp los numeros de celular argentinos.
  return nacional ? `https://wa.me/549${nacional}` : undefined
}
