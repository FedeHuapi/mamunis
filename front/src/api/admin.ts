/*
  Las llamadas del panel de administracion.

  Todas llevan el token de la sesion (lo agrega client.ts) y el backend revisa en cada una
  que la cuenta sea administradora. Que el panel este escondido para el resto es solo
  comodidad: la proteccion real esta del lado del servidor.
*/
import { keepPreviousData, type QueryKey, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, type Categoria, type Producto, type Variante } from './client'
import { mensajeDeError } from './errores'
import type { Pedido } from './pedidos'
import { borrarToken } from './token'
import { CLAVE_PEDIDOS_ADMIN, CLAVE_USUARIO } from './usuarios'

export const PEDIDOS_POR_PAGINA = 10

const CLAVES_PRODUCTOS: QueryKey[] = [['productos'], ['producto']]
const CLAVES_CATEGORIAS: QueryKey[] = [['categorias'], ...CLAVES_PRODUCTOS]
// Cancelar un pedido devuelve el stock, asi que tambien cambian los productos.
const CLAVES_PEDIDOS: QueryKey[] = [[CLAVE_PEDIDOS_ADMIN], ...CLAVES_PRODUCTOS]

type Respuesta<T> = { data?: T; error?: unknown; response: Response }

/** Espera la respuesta de la API y la convierte en el dato, o en un error con un mensaje para mostrar. */
async function exigir<T>(llamada: Promise<Respuesta<T>>, generico: string): Promise<T> {
  const { data, error, response } = await llamada
  if (response.status === 401) {
    borrarToken()
    throw new Error('Tu sesión venció. Volvé a ingresar.')
  }
  // Un error 5xx es una falla del servidor: su texto no esta pensado para mostrarse.
  if (response.status >= 500) throw new Error(generico)
  if (!response.ok) throw new Error(mensajeDeError(error, generico))
  return data as T
}

/**
 * Un cambio hecho desde el panel. Al terminar, bien o mal, se vuelven a pedir los datos
 * afectados y la cuenta: si la sesion vencio en el medio, el panel se cierra solo.
 */
function useCambio<TDatos, TResultado>(mutationFn: (datos: TDatos) => Promise<TResultado>, claves: QueryKey[]) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSettled: () => {
      for (const queryKey of [...claves, CLAVE_USUARIO]) queryClient.invalidateQueries({ queryKey })
    },
  })
}

// --- Pedidos ---

type FiltrosDePedidos = { pagina: number; estado?: Pedido['estado'] }

export function usePedidosAdmin({ pagina, estado }: FiltrosDePedidos) {
  return useQuery({
    queryKey: [CLAVE_PEDIDOS_ADMIN, { pagina, estado }],
    queryFn: () =>
      exigir(
        api.GET('/pedidos/', {
          params: { query: { estado, skip: (pagina - 1) * PEDIDOS_POR_PAGINA, limit: PEDIDOS_POR_PAGINA } },
        }),
        'No se pudieron cargar los pedidos.',
      ),
    placeholderData: keepPreviousData,
  })
}

export function useCambiarEstado() {
  return useCambio(
    ({ pedidoId, estado }: { pedidoId: number; estado: Pedido['estado'] }) =>
      exigir(
        api.PATCH('/pedidos/{pedido_id}/estado', { params: { path: { pedido_id: pedidoId } }, body: { estado } }),
        'No se pudo cambiar el estado del pedido.',
      ),
    CLAVES_PEDIDOS,
  )
}

// --- Productos ---

export type ProductoParaGuardar = {
  id?: number
  nombre: string
  descripcion: string | null
  precio: string
  categoria_id: number
  /** Solo al crear: despues los talles se manejan uno por uno. */
  variantes?: { talla: string; stock: number }[]
}

/** Crea el producto, o lo modifica si viene con id. */
export function useGuardarProducto() {
  return useCambio(
    ({ id, variantes, ...datos }: ProductoParaGuardar): Promise<Producto> =>
      id === undefined
        ? exigir(api.POST('/productos/', { body: { ...datos, variantes: variantes ?? [] } }), 'No se pudo crear el producto.')
        : exigir(
            api.PATCH('/productos/{producto_id}', { params: { path: { producto_id: id } }, body: datos }),
            'No se pudo guardar el producto.',
          ),
    CLAVES_PRODUCTOS,
  )
}

export function useEliminarProducto() {
  return useCambio(
    (productoId: number) =>
      exigir(
        api.DELETE('/productos/{producto_id}', { params: { path: { producto_id: productoId } } }),
        'No se pudo eliminar el producto.',
      ),
    CLAVES_PRODUCTOS,
  )
}

export function useSubirImagen() {
  return useCambio(
    ({ productoId, archivo }: { productoId: number; archivo: File }): Promise<Producto> =>
      exigir(
        api.POST('/productos/{producto_id}/imagen', {
          params: { path: { producto_id: productoId } },
          // Un archivo no viaja como JSON sino como formulario; el navegador arma el encabezado.
          body: { archivo: archivo as unknown as string },
          bodySerializer: () => {
            const formulario = new FormData()
            formulario.append('archivo', archivo)
            return formulario
          },
        }),
        'No se pudo subir la foto.',
      ),
    CLAVES_PRODUCTOS,
  )
}

export function useAgregarTalle() {
  return useCambio(
    ({ productoId, talla, stock }: { productoId: number; talla: string; stock: number }): Promise<Variante> =>
      exigir(
        api.POST('/productos/{producto_id}/variantes', {
          params: { path: { producto_id: productoId } },
          body: { talla, stock },
        }),
        'No se pudo agregar el talle.',
      ),
    CLAVES_PRODUCTOS,
  )
}

type TalleDeProducto = { productoId: number; varianteId: number }

export function useCambiarStock() {
  return useCambio(
    ({ productoId, varianteId, stock, stockAnterior }: TalleDeProducto & { stock: number; stockAnterior: number }): Promise<Variante> =>
      exigir(
        api.PATCH('/productos/{producto_id}/variantes/{variante_id}', {
          params: { path: { producto_id: productoId, variante_id: varianteId } },
          // Con el stock que se vio, el backend detecta si hubo una venta en el medio y no la pisa.
          body: { stock, stock_anterior: stockAnterior },
        }),
        'No se pudo guardar el stock.',
      ),
    CLAVES_PRODUCTOS,
  )
}

export function useEliminarTalle() {
  return useCambio(
    ({ productoId, varianteId }: TalleDeProducto) =>
      exigir(
        api.DELETE('/productos/{producto_id}/variantes/{variante_id}', {
          params: { path: { producto_id: productoId, variante_id: varianteId } },
        }),
        'No se pudo quitar el talle.',
      ),
    CLAVES_PRODUCTOS,
  )
}

// --- Categorias ---

export type CategoriaParaGuardar = { id?: number; nombre: string; descripcion: string | null }

/** Crea la categoria, o la modifica si viene con id. */
export function useGuardarCategoria() {
  return useCambio(
    ({ id, ...datos }: CategoriaParaGuardar): Promise<Categoria> =>
      id === undefined
        ? exigir(api.POST('/categorias/', { body: datos }), 'No se pudo crear la categoría.')
        : exigir(
            api.PATCH('/categorias/{categoria_id}', { params: { path: { categoria_id: id } }, body: datos }),
            'No se pudo guardar la categoría.',
          ),
    CLAVES_CATEGORIAS,
  )
}

export function useEliminarCategoria() {
  return useCambio(
    (categoriaId: number) =>
      exigir(
        api.DELETE('/categorias/{categoria_id}', { params: { path: { categoria_id: categoriaId } } }),
        'No se pudo eliminar la categoría. Si tiene productos, primero pasalos a otra.',
      ),
    CLAVES_CATEGORIAS,
  )
}
