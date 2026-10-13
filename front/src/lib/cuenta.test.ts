import { describe, expect, it } from 'vitest'

import { rutaParaVolver, validarIngreso, validarRegistro } from './cuenta'

const REGISTRO = { nombre: 'Ana', email: 'ana@ejemplo.com', password: 'claveSegura123', repetirPassword: 'claveSegura123' }

describe('validarIngreso', () => {
  it('acepta email y contraseña completos', () => {
    expect(validarIngreso({ email: 'ana@ejemplo.com', password: 'x' })).toEqual({})
  })

  it('marca lo que falta', () => {
    expect(Object.keys(validarIngreso({ email: '', password: '' }))).toEqual(['email', 'password'])
  })

  it('no opina sobre el largo de la contraseña: eso es asunto del registro', () => {
    expect(validarIngreso({ email: 'ana@ejemplo.com', password: 'abc' })).toEqual({})
  })
})

describe('validarRegistro', () => {
  it('acepta datos correctos', () => {
    expect(validarRegistro(REGISTRO)).toEqual({})
  })

  it('exige al menos 8 caracteres de contraseña', () => {
    expect(validarRegistro({ ...REGISTRO, password: '1234567', repetirPassword: '1234567' })).toHaveProperty('password')
    expect(validarRegistro({ ...REGISTRO, password: '12345678', repetirPassword: '12345678' })).toEqual({})
  })

  it('respeta el maximo de 72 caracteres del backend', () => {
    const larga = 'a'.repeat(73)
    expect(validarRegistro({ ...REGISTRO, password: larga, repetirPassword: larga })).toHaveProperty('password')
  })

  it('avisa si las dos contraseñas no coinciden', () => {
    expect(validarRegistro({ ...REGISTRO, repetirPassword: 'claveSegura124' })).toHaveProperty('repetirPassword')
  })

  it('no recorta la contraseña: un espacio es parte de ella', () => {
    expect(validarRegistro({ ...REGISTRO, password: '1234567 ', repetirPassword: '1234567 ' })).toEqual({})
  })
})

describe('rutaParaVolver', () => {
  it.each(['/checkout', '/mi-cuenta', '/productos/3', '/?categoria=2&pagina=3'])('acepta la direccion interna %j', (ruta) => {
    expect(rutaParaVolver(ruta)).toBe(ruta)
  })

  it.each([
    'https://sitio-falso.com',
    '//sitio-falso.com',
    '/\\sitio-falso.com',
    'javascript:alert(1)',
    'sitio-falso.com',
    '',
    null,
  ])('rechaza %j y manda a la cuenta', (ruta) => {
    expect(rutaParaVolver(ruta)).toBe('/mi-cuenta')
  })
})
