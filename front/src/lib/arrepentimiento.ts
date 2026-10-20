import type { components } from '../api/schema'
import { numeroNacional } from './checkout'
import { FORMA_DE_EMAIL } from './cuenta'

export type EstadoArrepentimiento = components['schemas']['EstadoArrepentimiento']

export type DatosDeArrepentimiento = {
  nombre: string
  email: string
  telefono: string
  numeroPedido: string
  motivo: string
}

export type ErroresDeArrepentimiento = Partial<Record<keyof DatosDeArrepentimiento, string>>

// El plazo de la ley: 10 dias corridos desde la entrega o la compra, lo que pase ultimo.
export const PLAZO_EN_DIAS = 10

// Los mismos limites que el backend (back/app/schemas/arrepentimiento.py).
const MAXIMO_NOMBRE = 150
const MAXIMO_MOTIVO = 1000

/**
 * Revisa el formulario antes de mandarlo. Solo el nombre y el email son obligatorios:
 * la norma no permite pedir mas tramites para arrepentirse.
 */
export function validarArrepentimiento(datos: DatosDeArrepentimiento): ErroresDeArrepentimiento {
  const errores: ErroresDeArrepentimiento = {}
  const nombre = datos.nombre.trim()
  const email = datos.email.trim()
  const telefono = datos.telefono.trim()
  const numeroPedido = datos.numeroPedido.trim()

  if (!nombre) errores.nombre = 'Escribí tu nombre y apellido.'
  else if ((nombre.match(/\p{L}/gu)?.length ?? 0) < 2) errores.nombre = 'Revisá el nombre.'
  else if (nombre.length > MAXIMO_NOMBRE) errores.nombre = 'El nombre es demasiado largo.'

  if (!email) errores.email = 'Escribí el email con el que hiciste la compra.'
  else if (!FORMA_DE_EMAIL.test(email)) errores.email = 'Revisá el email: tiene que ser como nombre@ejemplo.com.'

  if (telefono && !numeroNacional(telefono)) {
    errores.telefono = 'Revisá el número: tiene que ir con característica, por ejemplo 11 2345 6789.'
  }

  // Acepta "41" y tambien "N.º 41" o "#41", como figura en la confirmacion del pedido.
  if (numeroPedido && leerNumeroDePedido(numeroPedido) === undefined) {
    errores.numeroPedido = 'El número de pedido son solo números, por ejemplo 41.'
  }

  if (datos.motivo.trim().length > MAXIMO_MOTIVO) errores.motivo = 'El motivo es demasiado largo.'

  return errores
}

/** El numero de pedido como lo espera la API, o undefined si lo escrito no es un numero. */
export function leerNumeroDePedido(texto: string): number | undefined {
  const limpio = texto.trim().replace(/^(n\.?\s*º?|#)\s*/i, '')
  if (!/^\d{1,9}$/.test(limpio)) return undefined
  const numero = Number(limpio)
  return numero > 0 ? numero : undefined
}

const NOMBRES: Record<EstadoArrepentimiento, string> = {
  recibida: 'Recibida',
  en_proceso: 'En proceso',
  resuelta: 'Resuelta',
}

export const ESTADOS_ARREPENTIMIENTO: EstadoArrepentimiento[] = ['recibida', 'en_proceso', 'resuelta']

export function nombreDeEstadoArrepentimiento(estado: EstadoArrepentimiento): string {
  return NOMBRES[estado]
}

/** Cuantos dias calendario pasaron desde una fecha (el dia de hoy no cuenta). */
export function diasDesde(iso: string, ahora: Date = new Date()): number {
  const desde = new Date(iso)
  const inicio = Date.UTC(desde.getFullYear(), desde.getMonth(), desde.getDate())
  const hoy = Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  return Math.round((hoy - inicio) / 86_400_000)
}
