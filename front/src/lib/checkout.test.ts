import { describe, expect, it } from 'vitest'

import { numeroNacional, validarContacto } from './checkout'

const VALIDOS = {
  nombre: 'Ana Pérez',
  email: 'ana@ejemplo.com',
  telefono: '11 2345-6789',
  direccion: 'Calle Falsa 123, Buenos Aires',
}

describe('validarContacto', () => {
  it('no devuelve errores con datos correctos', () => {
    expect(validarContacto(VALIDOS)).toEqual({})
  })

  it('marca todos los campos vacios', () => {
    const errores = validarContacto({ nombre: '', email: '', telefono: '', direccion: '' })

    expect(Object.keys(errores)).toEqual(['nombre', 'email', 'telefono', 'direccion'])
  })

  it('un campo con solo espacios cuenta como vacio', () => {
    expect(validarContacto({ ...VALIDOS, nombre: '   ', direccion: ' \n ' })).toHaveProperty('nombre')
    expect(validarContacto({ ...VALIDOS, direccion: ' \n ' })).toHaveProperty('direccion')
  })

  it.each(['ana', 'ana@', '@ejemplo.com', 'ana@ejemplo', 'ana perez@ejemplo.com'])('rechaza el email %j', (email) => {
    expect(validarContacto({ ...VALIDOS, email })).toHaveProperty('email')
  })

  it.each(['1123456789', '+54 9 11 2345-6789', '(011) 4123-4567', '011 15 2345 6789', '0351 15 234 5678'])(
    'acepta el telefono %j, escrito como la gente lo escribe',
    (telefono) => {
      expect(validarContacto({ ...VALIDOS, telefono })).not.toHaveProperty('telefono')
    },
  )

  // Los mismos casos que back/tests/test_datos_de_contacto.py.
  it.each(['123456789', '1234567890', '15 2345 6789', '2345 6789', '1111111111', 'no tengo', '11 2345 6789 0000'])(
    'rechaza el telefono %j',
    (telefono) => {
      expect(validarContacto({ ...VALIDOS, telefono })).toHaveProperty('telefono')
    },
  )

  it.each([
    ['+54 9 11 2345-6789', '1123456789'],
    ['011 15 2345 6789', '1123456789'],
    ['0351 15 234 5678', '3512345678'],
    ['02944 15 123456', '2944123456'],
  ])('numeroNacional lleva %j a %j', (escrito, esperado) => {
    expect(numeroNacional(escrito)).toBe(esperado)
  })

  it.each(['123456', 'asdf', 'Calle Falsa', '12 34'])('rechaza la direccion %j', (direccion) => {
    expect(validarContacto({ ...VALIDOS, direccion })).toHaveProperty('direccion')
  })

  it.each(['Mitre 45', 'Los Álamos s/n', 'Ruta 40 km 2000 S/N, Bariloche'])('acepta la direccion %j', (direccion) => {
    expect(validarContacto({ ...VALIDOS, direccion })).not.toHaveProperty('direccion')
  })

  it('rechaza un nombre sin letras', () => {
    expect(validarContacto({ ...VALIDOS, nombre: '123' })).toHaveProperty('nombre')
  })

  it('respeta los maximos del backend', () => {
    expect(validarContacto({ ...VALIDOS, nombre: 'a'.repeat(151) })).toHaveProperty('nombre')
    expect(validarContacto({ ...VALIDOS, telefono: '1'.repeat(51) })).toHaveProperty('telefono')
    expect(validarContacto({ ...VALIDOS, direccion: `Mitre 45 ${'a'.repeat(300)}` })).toHaveProperty('direccion')
  })
})
