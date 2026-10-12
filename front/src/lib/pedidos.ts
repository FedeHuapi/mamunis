import type { Pedido } from '../api/pedidos'

// Como se le muestra cada estado a la persona que compro.
const NOMBRES: Record<Pedido['estado'], string> = {
  pendiente: 'Recibido',
  confirmado: 'Confirmado',
  en_preparacion: 'En preparación',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

export function nombreDeEstado(estado: Pedido['estado']): string {
  return NOMBRES[estado]
}

const fecha = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })

export function formatearFecha(iso: string): string {
  return fecha.format(new Date(iso))
}
