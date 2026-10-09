import { useMutation, useQueryClient } from '@tanstack/react-query'

import { CLAVE_CONSULTA as CLAVE_CARRITO, sesionActual } from './carrito'
import { api } from './client'
import { mensajeDeError } from './errores'
import type { components } from './schema'

export type Pedido = components['schemas']['PedidoResponse']

export type DatosDeContacto = {
  nombre: string
  email: string
  telefono: string
  direccion: string
}

export function useCrearPedido() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (datos: DatosDeContacto): Promise<Pedido> => {
      // Solo viajan los datos de contacto y el identificador del carrito. Los productos,
      // las cantidades y el total los toma el backend de su propia base: desde el
      // navegador no se puede cambiar lo que se va a cobrar.
      const { data, error } = await api.POST('/pedidos/', {
        body: {
          session_id: sesionActual(),
          nombre_contacto: datos.nombre.trim(),
          email_contacto: datos.email.trim(),
          telefono_contacto: datos.telefono.trim(),
          direccion_envio: datos.direccion.trim(),
        },
      })
      if (!data) throw new Error(mensajeDeError(error, 'No pudimos registrar tu pedido. Probá de nuevo.'))
      return data
    },
    // Salga bien o mal, el carrito pudo cambiar (se vacio, o cambio el stock): se vuelve a pedir.
    onSettled: () => queryClient.invalidateQueries({ queryKey: CLAVE_CARRITO }),
  })
}
