import type { Pedido } from '../api/pedidos'

export type Estado = Pedido['estado']

export const ESTADOS: Estado[] = ['pendiente', 'confirmado', 'en_preparacion', 'enviado', 'entregado', 'cancelado']

// Como se le muestra cada estado a la persona que compro.
const NOMBRES: Record<Estado, string> = {
  pendiente: 'Recibido',
  confirmado: 'Confirmado',
  en_preparacion: 'En preparación',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

export function nombreDeEstado(estado: Estado): string {
  return NOMBRES[estado]
}

// En el panel, un pedido recien llegado es uno que espera que alguien lo atienda.
export function nombreDeEstadoEnPanel(estado: Estado): string {
  return estado === 'pendiente' ? 'Pendiente' : NOMBRES[estado]
}

/** Un estado al que se puede llevar un pedido: a "pendiente" nunca se vuelve. */
export type EstadoSiguiente = Exclude<Estado, 'pendiente'>

// Los mismos pasos que permite el backend (TRANSICIONES_VALIDAS en services/pedido_service.py).
// Aca sirven para mostrar solo los botones que tienen sentido: el que decide es el backend.
const SIGUIENTES: Record<Estado, EstadoSiguiente[]> = {
  pendiente: ['confirmado', 'cancelado'],
  confirmado: ['en_preparacion', 'cancelado'],
  en_preparacion: ['enviado', 'cancelado'],
  enviado: ['entregado'],
  entregado: [],
  cancelado: [],
}

export function estadosSiguientes(estado: Estado): EstadoSiguiente[] {
  return SIGUIENTES[estado]
}

const ACCIONES: Record<EstadoSiguiente, string> = {
  confirmado: 'Confirmar',
  en_preparacion: 'Pasar a preparación',
  enviado: 'Marcar como enviado',
  entregado: 'Marcar como entregado',
  cancelado: 'Cancelar pedido',
}

/** El texto del boton que lleva un pedido a ese estado. */
export function nombreDeAccion(estado: EstadoSiguiente): string {
  return ACCIONES[estado]
}

const fecha = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
const fechaYHora = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' })

export function formatearFecha(iso: string): string {
  return fecha.format(new Date(iso))
}

export function formatearFechaYHora(iso: string): string {
  return fechaYHora.format(new Date(iso))
}
