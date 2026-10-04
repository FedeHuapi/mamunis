import { expect, it } from 'vitest'

import { formatearPrecio } from './formato'

it('formatea en pesos argentinos, sin decimales', () => {
  // Intl separa el signo del numero con un espacio especial (no separable).
  expect(formatearPrecio('5000.00').replace(/\s/g, ' ')).toBe('$ 5.000')
  expect(formatearPrecio('12500.50').replace(/\s/g, ' ')).toBe('$ 12.501')
})
