const pesos = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

// La API manda los precios como texto ("5000.00") para no perder decimales.
export function formatearPrecio(precio: string): string {
  return pesos.format(Number(precio))
}
