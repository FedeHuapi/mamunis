// Las piezas que se repiten en todo el sitio. Los colores y las sombras salen de
// src/index.css; aca se arma con ellos cada tipo de boton, campo, tarjeta o aviso.
// Para cambiar como se ve, por ejemplo, todo boton secundario, se cambia aca y listo.

/** El boton oscuro: la accion principal de una zona ("Guardar", "Agregar"). */
export const estiloBotonLleno =
  'rounded-full bg-tinta px-4 py-2 font-titulos font-semibold text-fondo shadow-boton transition hover:bg-amarillo hover:text-tinta disabled:cursor-not-allowed disabled:bg-borde disabled:text-texto-suave disabled:shadow-none'

/** El boton claro, para acciones secundarias ("Editar", "Volver"). */
export const estiloBotonSecundario =
  'rounded-full border border-borde bg-white px-4 py-2 font-titulos font-semibold text-tinta transition hover:bg-arena disabled:cursor-not-allowed disabled:text-texto-suave disabled:hover:bg-white'

/** Un link con forma de boton grande, para invitar a seguir ("Ver productos"). */
export const estiloBotonEnlace =
  'inline-block rounded-full bg-tinta px-6 py-3 font-titulos text-lg font-semibold text-fondo shadow-boton transition hover:bg-amarillo hover:text-tinta'

/** Los botones redondos chicos, como el + y el - de las cantidades. */
export const estiloBotonRedondo =
  'flex h-10 w-10 items-center justify-center rounded-full border border-borde bg-white font-titulos text-xl font-semibold transition hover:bg-arena disabled:cursor-not-allowed disabled:text-texto-suave disabled:hover:bg-white'

export const estiloCampoChico =
  'rounded-xl border border-borde-fuerte bg-white px-3 py-2 aria-invalid:border-2 aria-invalid:border-dashed aria-invalid:border-tinta disabled:bg-arena disabled:text-texto-suave'

/** Una caja blanca con una sombra leve, para agrupar contenido. */
export const estiloTarjeta = 'rounded-3xl bg-white p-5 shadow-tarjeta'

/** Un error o algo que hay que mirar. El borde punteado lo distingue sin depender del color. */
export const estiloAviso = 'rounded-2xl border border-dashed border-tinta bg-amarillo-suave p-4 font-semibold'

/** Una nota tranquila, sin urgencia (por ejemplo, "Podés comprar sin cuenta"). */
export const estiloNota = 'rounded-2xl bg-amarillo-suave p-4'

/** Un sello chico sobre una foto o al lado de un titulo ("Nuevo", el estado de un pedido). */
export const estiloSello = 'rounded-full bg-amarillo px-3 py-1 text-sm font-bold text-tinta'

/** Las pastillas de los filtros y del menu del panel. La elegida va en oscuro. */
export function estiloChip(activo: boolean): string {
  return `rounded-full px-4 py-1.5 font-semibold transition ${
    activo ? 'bg-tinta text-fondo' : 'bg-arena text-tinta hover:bg-amarillo-suave'
  }`
}
