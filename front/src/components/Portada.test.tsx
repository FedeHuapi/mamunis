import { screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'

import { renderizarEnRuta } from '../test/render'
import { PORTADA } from '../tienda'
import { Bienvenida, SobreMamunisResumen } from './Portada'

const ORIGINAL = structuredClone(PORTADA)

afterEach(() => {
  Object.assign(PORTADA, structuredClone(ORIGINAL))
})

it('la bienvenida lleva a la grilla y a la historia de la marca', () => {
  renderizarEnRuta(<Bienvenida />)

  expect(screen.getByRole('heading', { level: 1, name: PORTADA.titulo })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Ver productos' })).toHaveAttribute('href', '#productos')
  expect(screen.getByRole('link', { name: 'Conocé la marca' })).toHaveAttribute('href', '/sobre-mamunis')
})

it('sin foto muestra el logo, que es decorativo', () => {
  renderizarEnRuta(<Bienvenida />)

  // El logo de relleno no se anuncia: el titulo ya dice de que se trata.
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
})

it('con foto la muestra con su descripcion', () => {
  PORTADA.foto = 'https://res.cloudinary.com/x/portada.jpg'
  PORTADA.descripcionDeLaFoto = 'Dos chicos jugando con buzos de la temporada'

  renderizarEnRuta(<Bienvenida />)

  expect(screen.getByRole('img', { name: 'Dos chicos jugando con buzos de la temporada' })).toHaveAttribute(
    'src',
    'https://res.cloudinary.com/x/portada.jpg',
  )
})

it('el adelanto de la historia lleva a su pagina', () => {
  renderizarEnRuta(<SobreMamunisResumen />)

  expect(screen.getByRole('heading', { level: 2, name: PORTADA.sobre.titulo })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Conocer la historia' })).toHaveAttribute('href', '/sobre-mamunis')
})
