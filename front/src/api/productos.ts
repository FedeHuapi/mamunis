import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { api } from './client'

export const PRODUCTOS_POR_PAGINA = 12

type FiltrosCatalogo = { pagina: number; categoriaId?: number }

export function useProductos({ pagina, categoriaId }: FiltrosCatalogo) {
  return useQuery({
    queryKey: ['productos', { pagina, categoriaId }],
    queryFn: async () => {
      const { data, error } = await api.GET('/productos/', {
        params: {
          query: {
            skip: (pagina - 1) * PRODUCTOS_POR_PAGINA,
            limit: PRODUCTOS_POR_PAGINA,
            categoria_id: categoriaId,
          },
        },
      })
      if (error) throw new Error('No se pudieron cargar los productos')
      return data
    },
    // Al cambiar de pagina se sigue mostrando la anterior hasta que llega la nueva,
    // en vez de vaciar la grilla y hacer saltar la pantalla.
    placeholderData: keepPreviousData,
  })
}

export function useProducto(id: number) {
  return useQuery({
    queryKey: ['producto', id],
    queryFn: async () => {
      const { data, error, response } = await api.GET('/productos/{producto_id}', {
        params: { path: { producto_id: id } },
      })
      if (response.status === 404) return null
      if (error) throw new Error('No se pudo cargar el producto')
      return data
    },
  })
}

export function useCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const { data, error } = await api.GET('/categorias/', { params: { query: { limit: 100 } } })
      if (error) throw new Error('No se pudieron cargar las categorias')
      return data.items
    },
    // Las categorias casi nunca cambian: no hace falta volver a pedirlas a cada rato.
    staleTime: 5 * 60 * 1000,
  })
}
