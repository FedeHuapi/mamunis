import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'

import { SelectorTalle } from './SelectorTalle'

const VARIANTES = [
  { id: 2, talla: '12', stock: 0 },
  { id: 1, talla: '10', stock: 5 },
  { id: 3, talla: '14', stock: 2 },
]

it('muestra los talles ordenados', () => {
  render(<SelectorTalle variantes={VARIANTES} onSeleccionar={() => {}} />)

  const talles = screen.getAllByRole('radio').map((radio) => radio.closest('label')?.textContent)
  expect(talles).toEqual(['10', '12 (sin stock)', '14'])
})

it('avisa la eleccion al hacer clic en un talle con stock', async () => {
  const onSeleccionar = vi.fn()
  render(<SelectorTalle variantes={VARIANTES} onSeleccionar={onSeleccionar} />)

  await userEvent.click(screen.getByRole('radio', { name: '14' }))

  expect(onSeleccionar).toHaveBeenCalledWith(3)
})

it('un talle sin stock no se puede elegir', async () => {
  const onSeleccionar = vi.fn()
  render(<SelectorTalle variantes={VARIANTES} onSeleccionar={onSeleccionar} />)

  const sinStock = screen.getByRole('radio', { name: /^12/ })
  await userEvent.click(sinStock)

  expect(sinStock).toBeDisabled()
  expect(onSeleccionar).not.toHaveBeenCalled()
})

it('se puede elegir con el teclado', async () => {
  const onSeleccionar = vi.fn()
  render(<SelectorTalle variantes={VARIANTES} seleccionada={1} onSeleccionar={onSeleccionar} />)

  await userEvent.tab()
  await userEvent.keyboard('{ArrowRight}')

  expect(onSeleccionar).toHaveBeenCalledWith(3) // saltea el 12, que no tiene stock
})

it('marca el talle elegido', () => {
  render(<SelectorTalle variantes={VARIANTES} seleccionada={1} onSeleccionar={() => {}} />)

  expect(screen.getByRole('radio', { name: '10' })).toBeChecked()
})
