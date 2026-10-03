import createClient from 'openapi-fetch'

import type { components, paths } from './schema'

// La direccion de la API viene de una variable de entorno (ver .env.example).
// Ojo: todo lo que empieza con VITE_ queda dentro del codigo que baja el navegador,
// asi que ahi nunca va un secreto.
const baseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

// Los tipos de `paths` se generan desde el backend (npm run api:types): si un endpoint
// o un campo cambia alla, el front deja de compilar en lugar de fallar en produccion.
export const api = createClient<paths>({ baseUrl })

type Schemas = components['schemas']

export type Producto = Schemas['ProductoResponse']
export type Variante = Schemas['VarianteResponse']
export type Categoria = Schemas['CategoriaResponse']
