import { describe, expect, it } from 'vitest'

import { leerEnteroPositivo, ordenarPorTalla, totalDePaginas } from './catalogo'

describe('totalDePaginas', () => {
  it.each([
    [0, 1],
    [1, 1],
    [12, 1],
    [13, 2],
    [37, 4],
  ])('con %i productos hay %i paginas', (total, esperado) => {
    expect(totalDePaginas(total, 12)).toBe(esperado)
  })
})

describe('leerEnteroPositivo', () => {
  it.each([
    ['3', 3],
    ['12', 12],
  ])('acepta %s', (valor, esperado) => {
    expect(leerEnteroPositivo(valor)).toBe(esperado)
  })

  it.each([null, '', '0', '-1', '2.5', 'abc', '3abc', ' 3'])('ignora %j', (valor) => {
    expect(leerEnteroPositivo(valor)).toBeUndefined()
  })
})

describe('ordenarPorTalla', () => {
  it('ordena como numeros y no como texto', () => {
    const variantes = [
      { id: 1, talla: '16', stock: 1 },
      { id: 2, talla: '10', stock: 1 },
      { id: 3, talla: '4', stock: 1 },
    ]

    expect(ordenarPorTalla(variantes).map((v) => v.talla)).toEqual(['4', '10', '16'])
  })

  it('no modifica la lista original', () => {
    const variantes = [
      { id: 1, talla: '12', stock: 1 },
      { id: 2, talla: '10', stock: 1 },
    ]

    ordenarPorTalla(variantes)

    expect(variantes[0].talla).toBe('12')
  })
})
