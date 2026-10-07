import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'
import type { components } from './schema'

export type Carrito = components['schemas']['CarritoResponse']
export type ItemDeCarrito = components['schemas']['CarritoItemResponse']

/*
  El carrito vive en el backend. El navegador solo guarda su identificador (session_id),
  que el backend genera al azar. Quien tenga ese identificador puede ver y modificar el
  carrito, asi que funciona como una llave: no es grave (un carrito no tiene datos
  personales ni de pago), pero por eso no se pone en la URL ni se muestra en pantalla.
*/
const CLAVE_SESION = 'mamunis.carrito'
const CLAVE_CONSULTA = ['carrito']

// localStorage puede no estar disponible (modo privado estricto, almacenamiento bloqueado).
function leerSesion(): string | null {
  try {
    return localStorage.getItem(CLAVE_SESION)
  } catch {
    return null
  }
}

function guardarSesion(sesion: string) {
  try {
    localStorage.setItem(CLAVE_SESION, sesion)
  } catch {
    // Sin almacenamiento, el carrito dura lo que dure la pestana abierta.
  }
}

function borrarSesion() {
  try {
    localStorage.removeItem(CLAVE_SESION)
  } catch {
    // Nada que borrar.
  }
}

/** Saca un mensaje para mostrar de un error de la API, o usa el generico. */
function mensajeDeError(error: unknown, generico: string): string {
  const detalle = (error as { detail?: unknown } | undefined)?.detail
  return typeof detalle === 'string' ? detalle : generico
}

async function obtenerCarrito(): Promise<Carrito | null> {
  const sesion = leerSesion()
  if (!sesion) return null

  const { data, response } = await api.GET('/carrito/{session_id}', { params: { path: { session_id: sesion } } })
  // El carrito guardado ya no existe (o el identificador esta roto): se empieza de cero.
  if (response.status === 404 || response.status === 422) {
    borrarSesion()
    return null
  }
  if (!data) throw new Error('No se pudo cargar el carrito')
  return data
}

async function crearSesion(): Promise<string> {
  const { data } = await api.POST('/carrito/')
  if (!data) throw new Error('No se pudo crear el carrito')
  guardarSesion(data.session_id)
  return data.session_id
}

function sesionActual(): string {
  const sesion = leerSesion()
  if (!sesion) throw new Error('No hay un carrito')
  return sesion
}

export function useCarrito() {
  return useQuery({ queryKey: CLAVE_CONSULTA, queryFn: obtenerCarrito })
}

export function cantidadDeUnidades(carrito: Carrito | null | undefined): number {
  return carrito?.items.reduce((total, item) => total + item.cantidad, 0) ?? 0
}

export function useAgregarAlCarrito() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ varianteId, cantidad }: { varianteId: number; cantidad: number }) => {
      const agregar = (sesion: string) =>
        api.POST('/carrito/{session_id}/items', {
          params: { path: { session_id: sesion } },
          body: { variante_id: varianteId, cantidad },
        })

      // El carrito se crea recien cuando hace falta: quien solo mira no genera uno.
      let respuesta = await agregar(leerSesion() ?? (await crearSesion()))
      if (respuesta.response.status === 404 && !respuesta.data) {
        // El carrito guardado ya no existe: se crea uno nuevo y se reintenta una vez.
        borrarSesion()
        respuesta = await agregar(await crearSesion())
      }
      if (!respuesta.data) throw new Error(mensajeDeError(respuesta.error, 'No se pudo agregar al carrito'))
      return respuesta.data
    },
    onSuccess: (carrito) => queryClient.setQueryData(CLAVE_CONSULTA, carrito),
  })
}

export function useCambiarCantidad() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ itemId, cantidad }: { itemId: number; cantidad: number }) => {
      const { data, error } = await api.PATCH('/carrito/{session_id}/items/{item_id}', {
        params: { path: { session_id: sesionActual(), item_id: itemId } },
        body: { cantidad },
      })
      if (!data) throw new Error(mensajeDeError(error, 'No se pudo cambiar la cantidad'))
      return data
    },
    // El total lo calcula el backend: se vuelve a pedir el carrito en vez de sumarlo aca.
    onSettled: () => queryClient.invalidateQueries({ queryKey: CLAVE_CONSULTA }),
  })
}

export function useQuitarDelCarrito() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (itemId: number) => {
      const { response } = await api.DELETE('/carrito/{session_id}/items/{item_id}', {
        params: { path: { session_id: sesionActual(), item_id: itemId } },
      })
      if (!response.ok && response.status !== 404) throw new Error('No se pudo quitar el producto')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: CLAVE_CONSULTA }),
  })
}
