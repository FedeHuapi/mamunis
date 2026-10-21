import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, type Usuario } from './client'
import { mensajeDeError } from './errores'
import { borrarToken, guardarToken, leerToken } from './token'

export const CLAVE_USUARIO = ['usuario']
const CLAVE_MIS_PEDIDOS = 'mis-pedidos'
// Los pedidos de todos los clientes, que solo ve el panel de administracion (api/admin.ts).
export const CLAVE_PEDIDOS_ADMIN = 'pedidos-admin'
// Las solicitudes de arrepentimiento: tambien tienen datos personales de clientes.
export const CLAVE_ARREPENTIMIENTOS_ADMIN = 'arrepentimientos-admin'
export const PEDIDOS_POR_PAGINA = 10

type Credenciales = { email: string; password: string }
type DatosDeRegistro = Credenciales & { nombre: string }

async function obtenerUsuario(): Promise<Usuario | null> {
  if (!leerToken()) return null

  const { data, response } = await api.GET('/usuarios/me')
  // El token vencio o dejo de ser valido: la sesion se termina.
  if (response.status === 401) {
    borrarToken()
    return null
  }
  if (!data) throw new Error('No se pudo cargar tu cuenta')
  return data
}

/** La cuenta con la que se ingreso, o null si no hay sesion. */
export function useUsuario() {
  return useQuery({ queryKey: CLAVE_USUARIO, queryFn: obtenerUsuario })
}

async function ingresar({ email, password }: Credenciales) {
  const { data, error } = await api.POST('/usuarios/login', { body: { email: email.trim(), password } })
  // El backend responde lo mismo si el email no existe o si la contrasena esta mal,
  // a proposito: asi no se puede averiguar quien tiene cuenta.
  if (!data) throw new Error(mensajeDeError(error, 'No pudimos iniciar tu sesión. Probá de nuevo.'))
  guardarToken(data.access_token)
}

export function useIngresar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ingresar,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE_USUARIO }),
  })
}

export function useRegistrarse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ nombre, email, password }: DatosDeRegistro) => {
      const { data, error } = await api.POST('/usuarios/', {
        body: { nombre: nombre.trim(), email: email.trim(), password },
      })
      if (!data) throw new Error(mensajeDeError(error, 'No pudimos crear tu cuenta. Probá de nuevo.'))
      // Con la cuenta creada se inicia la sesion, para no pedir los datos dos veces.
      await ingresar({ email, password })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE_USUARIO }),
  })
}

export function useSalir() {
  const queryClient = useQueryClient()

  return () => {
    borrarToken()
    queryClient.setQueryData(CLAVE_USUARIO, null)
    // Lo que se habia cargado de la cuenta no tiene que quedar en la memoria de la pagina.
    queryClient.removeQueries({ queryKey: [CLAVE_MIS_PEDIDOS] })
    queryClient.removeQueries({ queryKey: [CLAVE_PEDIDOS_ADMIN] })
    queryClient.removeQueries({ queryKey: [CLAVE_ARREPENTIMIENTOS_ADMIN] })
  }
}

export function useMisPedidos(pagina: number) {
  return useQuery({
    queryKey: [CLAVE_MIS_PEDIDOS, pagina],
    queryFn: async () => {
      const { data } = await api.GET('/usuarios/me/pedidos', {
        params: { query: { skip: (pagina - 1) * PEDIDOS_POR_PAGINA, limit: PEDIDOS_POR_PAGINA } },
      })
      if (!data) throw new Error('No se pudieron cargar tus pedidos')
      return data
    },
    placeholderData: keepPreviousData,
  })
}
