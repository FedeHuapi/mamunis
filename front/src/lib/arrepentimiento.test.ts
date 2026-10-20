import { describe, expect, it } from 'vitest'

import { diasDesde, leerNumeroDePedido, validarArrepentimiento } from './arrepentimiento'

const MINIMO = { nombre: 'Ana Pérez', email: 'ana@ejemplo.com', telefono: '', numeroPedido: '', motivo: '' }

describe('validarArrepentimiento', () => {
  it('alcanza con nombre y email: lo demas es opcional', () => {
    expect(validarArrepentimiento(MINIMO)).toEqual({})
  })

  it('marca nombre y email si faltan', () => {
    expect(Object.keys(validarArrepentimiento({ ...MINIMO, nombre: ' ', email: '' }))).toEqual(['nombre', 'email'])
  })

  it('si escribe un telefono, tiene que ser valido', () => {
    expect(validarArrepentimiento({ ...MINIMO, telefono: '123' })).toHaveProperty('telefono')
    expect(validarArrepentimiento({ ...MINIMO, telefono: '11 2345 6789' })).toEqual({})
  })

  it('el motivo tiene un maximo de 1000 caracteres', () => {
    expect(validarArrepentimiento({ ...MINIMO, motivo: 'a'.repeat(1001) })).toHaveProperty('motivo')
  })
})

describe('leerNumeroDePedido', () => {
  it.each([
    ['41', 41],
    [' 41 ', 41],
    ['N.º 41', 41],
    ['#41', 41],
    ['n 7', 7],
  ])('lee %j', (texto, esperado) => {
    expect(leerNumeroDePedido(texto)).toBe(esperado)
  })

  it.each(['', 'cuarenta', '0', '-3', '4.1', '1234567890'])('no acepta %j', (texto) => {
    expect(leerNumeroDePedido(texto)).toBeUndefined()
  })
})

describe('diasDesde', () => {
  const hoy = new Date(2026, 9, 20, 15, 0)

  it('cuenta dias de calendario, no horas', () => {
    expect(diasDesde(new Date(2026, 9, 20, 9, 0).toISOString(), hoy)).toBe(0)
    expect(diasDesde(new Date(2026, 9, 19, 23, 59).toISOString(), hoy)).toBe(1)
    expect(diasDesde(new Date(2026, 9, 10, 8, 0).toISOString(), hoy)).toBe(10)
  })
})
