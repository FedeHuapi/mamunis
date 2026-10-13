import type { Variante } from '../api/client'

// Los mismos talles que acepta el backend (TALLAS en models/producto.py).
export const TALLES = ['10', '12', '14', '16']

export type DatosDeProducto = { nombre: string; descripcion: string; precio: string; categoriaId: string }
export type ErroresDeProducto = Partial<Record<keyof DatosDeProducto | 'talles', string>>

/** Lo que se escribio en la casilla de stock de cada talle. Vacio = ese talle no se ofrece. */
export type StocksEscritos = Record<string, string>

// Los mismos maximos que acepta el backend.
const MAXIMO_NOMBRE_PRODUCTO = 150
const MAXIMO_NOMBRE_CATEGORIA = 100
const PRECIO_MAXIMO = 99_999_999.99
const STOCK_MAXIMO = 99_999

// Solo numeros, con hasta dos decimales. A proposito no acepta "15.000": con punto de
// miles se guardaria como quince pesos.
const FORMA_DE_PRECIO = /^\d+([.,]\d{1,2})?$/

/** Deja el precio como lo espera la API: "1500,50" pasa a "1500.50". */
export function normalizarPrecio(precio: string): string {
  return precio.trim().replace(',', '.')
}

/** Lee una cantidad de stock: un entero de cero para arriba. Cualquier otra cosa no vale. */
export function leerStock(texto: string): number | undefined {
  const limpio = texto.trim()
  if (!/^\d+$/.test(limpio)) return undefined
  const numero = Number(limpio)
  return numero <= STOCK_MAXIMO ? numero : undefined
}

/** Los talles que se van a crear con el producto: los que tienen algo escrito. */
export function variantesDesdeStocks(stocks: StocksEscritos): { talla: string; stock: number }[] {
  return TALLES.flatMap((talla) => {
    const stock = leerStock(stocks[talla] ?? '')
    return stock === undefined ? [] : [{ talla, stock }]
  })
}

/**
 * Revisa el formulario de un producto antes de mandarlo. Como en el resto del sitio, es
 * para corregir rapido: la validacion que cuenta la vuelve a hacer el backend.
 */
export function validarProducto(datos: DatosDeProducto, stocks: StocksEscritos = {}): ErroresDeProducto {
  const errores: ErroresDeProducto = {}
  const nombre = datos.nombre.trim()
  const precio = datos.precio.trim()

  if (!nombre) errores.nombre = 'Escribí el nombre del producto.'
  else if (nombre.length > MAXIMO_NOMBRE_PRODUCTO) errores.nombre = 'El nombre es demasiado largo.'

  if (!precio) errores.precio = 'Escribí el precio.'
  else if (!FORMA_DE_PRECIO.test(precio)) errores.precio = 'Escribí el precio solo con números, sin puntos de miles. Por ejemplo: 15000.'
  else if (Number(normalizarPrecio(precio)) <= 0) errores.precio = 'El precio tiene que ser mayor que cero.'
  else if (Number(normalizarPrecio(precio)) > PRECIO_MAXIMO) errores.precio = 'El precio es demasiado alto.'

  if (!datos.categoriaId) errores.categoriaId = 'Elegí una categoría.'

  const stockMalEscrito = TALLES.some((talla) => (stocks[talla] ?? '').trim() !== '' && leerStock(stocks[talla]) === undefined)
  if (stockMalEscrito) errores.talles = 'El stock de cada talle tiene que ser un número entero, de 0 para arriba.'

  return errores
}

export function validarNombreDeCategoria(nombre: string): string | undefined {
  const limpio = nombre.trim()
  if (!limpio) return 'Escribí el nombre de la categoría.'
  if (limpio.length > MAXIMO_NOMBRE_CATEGORIA) return 'El nombre es demasiado largo.'
  return undefined
}

export function stockTotal(variantes: Variante[]): number {
  return variantes.reduce((total, variante) => total + variante.stock, 0)
}

// Los mismos limites que el backend (services/imagenes.py).
const FORMATOS_DE_IMAGEN = ['image/jpeg', 'image/png', 'image/webp']
const TAMANO_MAXIMO_DE_IMAGEN = 5 * 1024 * 1024
export const FORMATOS_ACEPTADOS = FORMATOS_DE_IMAGEN.join(',')

/**
 * Avisa temprano si una foto no va a ser aceptada, para no subir 20 MB en vano. No es una
 * defensa: el backend revisa el contenido real del archivo, no lo que dice el navegador.
 */
export function revisarImagen(archivo: { type: string; size: number }): string | undefined {
  if (!FORMATOS_DE_IMAGEN.includes(archivo.type)) return 'La foto tiene que ser JPG, PNG o WebP.'
  if (archivo.size > TAMANO_MAXIMO_DE_IMAGEN) return 'La foto no puede pesar más de 5 MB.'
  return undefined
}
