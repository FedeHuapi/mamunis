import { describe, expect, it } from 'vitest'

import {
  leerStock,
  normalizarPrecio,
  revisarImagen,
  stockTotal,
  validarNombreDeCategoria,
  validarProducto,
  variantesDesdeStocks,
} from './admin'
import { estadosSiguientes } from './pedidos'

const PRODUCTO = { nombre: 'Remera Dino', descripcion: '', precio: '15000', categoriaId: '1' }

describe('validarProducto', () => {
  it('acepta datos correctos', () => {
    expect(validarProducto(PRODUCTO)).toEqual({})
  })

  it('marca lo que falta', () => {
    const errores = validarProducto({ nombre: ' ', descripcion: '', precio: '', categoriaId: '' })
    expect(Object.keys(errores)).toEqual(['nombre', 'precio', 'categoriaId'])
  })

  it.each(['15000', '15000,5', '15000.50', '1'])('acepta el precio %j', (precio) => {
    expect(validarProducto({ ...PRODUCTO, precio })).toEqual({})
  })

  // "15.000" se guardaria como quince pesos: se rechaza en vez de adivinar.
  it.each(['15.000', '$15000', '15 000', '-5', '0', '0,00', 'gratis', '1.234.567', '100000000'])(
    'rechaza el precio %j',
    (precio) => {
      expect(validarProducto({ ...PRODUCTO, precio })).toHaveProperty('precio')
    },
  )

  it('rechaza un stock que no es un entero', () => {
    expect(validarProducto(PRODUCTO, { '10': '3', '12': 'dos' })).toHaveProperty('talles')
    expect(validarProducto(PRODUCTO, { '10': '-1' })).toHaveProperty('talles')
    expect(validarProducto(PRODUCTO, { '10': '3', '12': '' })).toEqual({})
  })
})

it('normalizarPrecio cambia la coma por punto', () => {
  expect(normalizarPrecio(' 1500,50 ')).toBe('1500.50')
})

describe('leerStock', () => {
  it.each([
    ['0', 0],
    [' 12 ', 12],
    ['99999', 99999],
  ])('lee %j', (texto, esperado) => {
    expect(leerStock(texto)).toBe(esperado)
  })

  it.each(['', '-1', '1.5', 'tres', '100000', '1e3'])('no acepta %j', (texto) => {
    expect(leerStock(texto)).toBeUndefined()
  })
})

it('variantesDesdeStocks arma solo los talles con algo escrito, incluido el cero', () => {
  expect(variantesDesdeStocks({ '10': '3', '12': '', '16': '0' })).toEqual([
    { talla: '10', stock: 3 },
    { talla: '16', stock: 0 },
  ])
})

it('stockTotal suma todos los talles', () => {
  expect(stockTotal([{ id: 1, talla: '10', stock: 2 }, { id: 2, talla: '12', stock: 5 }])).toBe(7)
  expect(stockTotal([])).toBe(0)
})

it('validarNombreDeCategoria exige un nombre de hasta 100 caracteres', () => {
  expect(validarNombreDeCategoria('Remeras')).toBeUndefined()
  expect(validarNombreDeCategoria('   ')).toBeDefined()
  expect(validarNombreDeCategoria('a'.repeat(101))).toBeDefined()
})

describe('revisarImagen', () => {
  it('acepta jpg, png y webp de hasta 5 MB', () => {
    expect(revisarImagen({ type: 'image/jpeg', size: 5 * 1024 * 1024 })).toBeUndefined()
    expect(revisarImagen({ type: 'image/png', size: 10 })).toBeUndefined()
    expect(revisarImagen({ type: 'image/webp', size: 10 })).toBeUndefined()
  })

  it('rechaza otros formatos y fotos pesadas', () => {
    expect(revisarImagen({ type: 'application/pdf', size: 10 })).toBeDefined()
    expect(revisarImagen({ type: 'image/svg+xml', size: 10 })).toBeDefined()
    expect(revisarImagen({ type: 'image/jpeg', size: 5 * 1024 * 1024 + 1 })).toBeDefined()
  })
})

describe('estadosSiguientes', () => {
  it('sigue los pasos del backend', () => {
    expect(estadosSiguientes('pendiente')).toEqual(['confirmado', 'cancelado'])
    expect(estadosSiguientes('en_preparacion')).toEqual(['enviado', 'cancelado'])
  })

  it('un pedido enviado ya no se puede cancelar', () => {
    expect(estadosSiguientes('enviado')).toEqual(['entregado'])
  })

  it('entregado y cancelado son finales', () => {
    expect(estadosSiguientes('entregado')).toEqual([])
    expect(estadosSiguientes('cancelado')).toEqual([])
  })
})
