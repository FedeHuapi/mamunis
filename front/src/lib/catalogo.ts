import type { Variante } from '../api/client'

export function totalDePaginas(total: number, porPagina: number): number {
  return Math.max(1, Math.ceil(total / porPagina))
}

/**
 * Lee un numero entero positivo de la URL (?pagina=2, ?categoria=5).
 * Cualquier otra cosa (texto, negativos, decimales, vacio) se trata como "no vino".
 */
export function leerEnteroPositivo(valor: string | null): number | undefined {
  if (valor === null || !/^\d+$/.test(valor)) return undefined
  const numero = Number(valor)
  return numero > 0 ? numero : undefined
}

/** Ordena los talles de menor a mayor: "10" antes que "12" (como texto, "10" < "2"). */
export function ordenarPorTalla(variantes: Variante[]): Variante[] {
  return [...variantes].sort((a, b) => {
    const numeroA = Number(a.talla)
    const numeroB = Number(b.talla)
    if (Number.isNaN(numeroA) || Number.isNaN(numeroB)) return a.talla.localeCompare(b.talla)
    return numeroA - numeroB
  })
}
