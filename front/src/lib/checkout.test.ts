import { describe, expect, it } from 'vitest'

import { validarContacto } from './checkout'

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

  it.each(['1123456789', '+54 9 11 2345-6789', '(011) 4123-4567', '15 2345 6789'])(
    'acepta el telefono %j, escrito como la gente lo escribe',
    (telefono) => {
      expect(validarContacto({ ...VALIDOS, telefono })).not.toHaveProperty('telefono')
    },
  )

  it.each(['1234567', 'no tengo', '----------'])('rechaza el telefono %j', (telefono) => {
    expect(validarContacto({ ...VALIDOS, telefono })).toHaveProperty('telefono')
  })

  it('respeta los maximos del backend', () => {
    expect(validarContacto({ ...VALIDOS, nombre: 'a'.repeat(151) })).toHaveProperty('nombre')
    expect(validarContacto({ ...VALIDOS, telefono: '1'.repeat(51) })).toHaveProperty('telefono')
  })
})
