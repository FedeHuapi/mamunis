import { screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { renderizarEnRuta } from '../test/render'
import { enlaceDeWhatsapp, estaPendiente, TIENDA } from '../tienda'
import { Pie } from './Pie'

const ORIGINAL = structuredClone(TIENDA)

afterEach(() => {
  Object.assign(TIENDA, structuredClone(ORIGINAL))
})

describe('enlaceDeWhatsapp', () => {
  it.each([
    ['11 2345-6789', 'https://wa.me/5491123456789'],
    ['+54 9 351 234 5678', 'https://wa.me/5493512345678'],
    ['011 15 2345 6789', 'https://wa.me/5491123456789'],
  ])('arma el link para %j', (numero, esperado) => {
    expect(enlaceDeWhatsapp(numero)).toBe(esperado)
  })

  it.each(['[11 2345 6789]', '', '1234'])('no arma link con %j', (numero) => {
    expect(enlaceDeWhatsapp(numero)).toBeUndefined()
  })
})

it('estaPendiente reconoce lo que esta entre corchetes', () => {
  expect(estaPendiente('[CUIT]')).toBe(true)
  expect(estaPendiente('30-12345678-9')).toBe(false)
})

describe('Pie', () => {
  it('con los datos sin completar los muestra, pero sin links', () => {
    renderizarEnRuta(<Pie />)

    expect(screen.getByText('[11 2345 6789]')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Instagram (falta completar)' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Instagram/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /WhatsApp/ })).not.toBeInTheDocument()
  })

  it('con los datos completos arma los links a las redes y a WhatsApp', () => {
    TIENDA.whatsapp = '11 2345-6789'
    TIENDA.email = 'hola@mamunis.com.ar'
    TIENDA.redes = [
      { red: 'instagram', usuario: 'mamunis.ropa' },
      { red: 'tiktok', usuario: 'mamunis' },
      { red: 'facebook', usuario: '' },
    ]

    renderizarEnRuta(<Pie />)

    expect(screen.getByRole('link', { name: 'Instagram de Mamunis' })).toHaveAttribute('href', 'https://www.instagram.com/mamunis.ropa')
    expect(screen.getByRole('link', { name: 'TikTok de Mamunis' })).toHaveAttribute('href', 'https://www.tiktok.com/@mamunis')
    expect(screen.getByRole('link', { name: 'WhatsApp de Mamunis' })).toHaveAttribute('href', 'https://wa.me/5491123456789')
    expect(screen.getByRole('link', { name: 'hola@mamunis.com.ar' })).toHaveAttribute('href', 'mailto:hola@mamunis.com.ar')
    // Una red sin usuario no aparece.
    expect(screen.queryByText(/Facebook/)).not.toBeInTheDocument()
  })

  it('los links a otros sitios abren en otra pestaña sin darle acceso a esta', () => {
    TIENDA.redes = [{ red: 'instagram', usuario: 'mamunis.ropa' }]
    renderizarEnRuta(<Pie />)

    for (const link of screen.getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('http'))) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    }
  })

  it('tiene el link obligatorio a Defensa del Consumidor, con el texto exacto', () => {
    renderizarEnRuta(<Pie />)

    expect(screen.getByRole('link', { name: 'Defensa de las y los Consumidores. Para reclamos. Ingrese aquí' })).toHaveAttribute(
      'href',
      'https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario',
    )
  })

  it('tiene el botón de arrepentimiento y los links de ayuda', () => {
    renderizarEnRuta(<Pie />)

    const ayuda = within(screen.getByRole('navigation', { name: 'Ayuda' }))
    expect(ayuda.getByRole('link', { name: 'Botón de arrepentimiento' })).toHaveAttribute('href', '/arrepentimiento')
    expect(ayuda.getByRole('link', { name: 'Envíos y pagos' })).toHaveAttribute('href', '/envios-y-pagos')
  })
})
