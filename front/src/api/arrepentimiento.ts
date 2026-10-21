import { useMutation } from '@tanstack/react-query'

import { leerNumeroDePedido } from '../lib/arrepentimiento'
import type { DatosDeArrepentimiento } from '../lib/arrepentimiento'
import { api } from './client'
import { mensajeDeError } from './errores'
import type { components } from './schema'

export type ArrepentimientoCreado = components['schemas']['ArrepentimientoCreado']

/** Manda la solicitud del boton de arrepentimiento. No necesita sesion. */
export function useCrearArrepentimiento() {
  return useMutation({
    mutationFn: async (datos: DatosDeArrepentimiento): Promise<ArrepentimientoCreado> => {
      const { data, error, response } = await api.POST('/arrepentimientos/', {
        body: {
          nombre: datos.nombre.trim(),
          email: datos.email.trim(),
          telefono: datos.telefono.trim() || null,
          numero_pedido: leerNumeroDePedido(datos.numeroPedido) ?? null,
          motivo: datos.motivo.trim() || null,
        },
      })
      // El texto del 429 (demasiadas solicitudes) esta pensado para mostrarse.
      if (!data) {
        const generico = 'No pudimos registrar tu solicitud. Probá de nuevo o escribinos por WhatsApp.'
        throw new Error(response.status >= 500 ? generico : mensajeDeError(error, generico))
      }
      return data
    },
  })
}
