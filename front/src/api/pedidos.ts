import { useMutation, useQueryClient } from '@tanstack/react-query'

import { CLAVE_CONSULTA as CLAVE_CARRITO, sesionActual } from './carrito'
import { api } from './client'
import { mensajeDeError } from './errores'
import type { components } from './schema'
import { borrarToken } from './token'
import { CLAVE_USUARIO } from './usuarios'

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
      const { data, error, response } = await api.POST('/pedidos/', {
        body: {
          session_id: sesionActual(),
          nombre_contacto: datos.nombre.trim(),
          email_contacto: datos.email.trim(),
          telefono_contacto: datos.telefono.trim(),
          direccion_envio: datos.direccion.trim(),
        },
      })
      // El backend no acepta un pedido con una sesion vencida (no lo toma como invitado en
      // silencio, para que nadie crea que compro con su cuenta). Se cierra la sesion y se avisa:
      // la persona decide si vuelve a ingresar o confirma sin cuenta.
      if (response.status === 401) {
        borrarToken()
        throw new Error('Tu sesión venció. Volvé a ingresar, o confirmá de nuevo para comprar sin cuenta.')
      }
      if (!data) throw new Error(mensajeDeError(error, 'No pudimos registrar tu pedido. Probá de nuevo.'))
      return data
    },
    // Salga bien o mal, el carrito pudo cambiar (se vacio, o cambio el stock): se vuelve a pedir.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CLAVE_CARRITO })
      queryClient.invalidateQueries({ queryKey: CLAVE_USUARIO })
    },
  })
}
