import { useQuery } from '@tanstack/react-query'

import { api } from './client'

export const PRODUCTOS_POR_PAGINA = 12

export function useProductos(pagina: number) {
  return useQuery({
    queryKey: ['productos', pagina],
    queryFn: async () => {
      const { data, error } = await api.GET('/productos/', {
        params: { query: { skip: (pagina - 1) * PRODUCTOS_POR_PAGINA, limit: PRODUCTOS_POR_PAGINA } },
      })
      if (error) throw new Error('No se pudieron cargar los productos')
      return data
    },
  })
}
