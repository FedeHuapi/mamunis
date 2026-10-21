import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '../api/client'
import { renderizarEnRuta } from '../test/render'
import { Arrepentimiento } from './Arrepentimiento'

vi.mock('../api/client', () => ({ api: { GET: vi.fn(), POST: vi.fn() } }))

const respuesta = (status: number, data?: unknown, error?: unknown) =>
  ({ data, error, response: { status, ok: status < 400 } }) as never

beforeEach(() => {
  vi.mocked(api.POST).mockReset()
})

async function completarMinimo() {
  await userEvent.type(screen.getByLabelText('Nombre y apellido'), 'Ana Pérez')
  await userEvent.type(screen.getByLabelText('Email'), 'ana@ejemplo.com')
}

describe('Botón de arrepentimiento', () => {
  it('no pide cuenta: se usa sin sesion', () => {
    renderizarEnRuta(<Arrepentimiento />)

    expect(screen.getByRole('heading', { name: 'Botón de arrepentimiento' })).toBeInTheDocument()
    expect(screen.queryByLabelText(/contraseña/i)).not.toBeInTheDocument()
  })

  it('con nombre y email alcanza, y muestra el codigo de la solicitud', async () => {
    vi.mocked(api.POST).mockResolvedValue(respuesta(201, { codigo: 'ARR-7K3QX9MD', fecha_creacion: '2026-10-20T15:00:00Z' }))
    renderizarEnRuta(<Arrepentimiento />)

    await completarMinimo()
    await userEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

    expect(await screen.findByRole('heading', { name: 'Recibimos tu solicitud' })).toBeInTheDocument()
    expect(screen.getByText('ARR-7K3QX9MD')).toBeInTheDocument()
    expect(api.POST).toHaveBeenCalledWith('/arrepentimientos/', {
      body: { nombre: 'Ana Pérez', email: 'ana@ejemplo.com', telefono: null, numero_pedido: null, motivo: null },
    })
  })

  it('manda el numero de pedido como numero aunque se escriba "N.º 41"', async () => {
    vi.mocked(api.POST).mockResolvedValue(respuesta(201, { codigo: 'ARR-AAAAAAAA', fecha_creacion: '2026-10-20T15:00:00Z' }))
    renderizarEnRuta(<Arrepentimiento />)

    await completarMinimo()
    await userEvent.type(screen.getByLabelText('Número de pedido (opcional)'), 'N.º 41')
    await userEvent.type(screen.getByLabelText('Motivo (opcional)'), 'No me quedó')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

    await screen.findByRole('heading', { name: 'Recibimos tu solicitud' })
    expect(api.POST).toHaveBeenCalledWith('/arrepentimientos/', {
      body: { nombre: 'Ana Pérez', email: 'ana@ejemplo.com', telefono: null, numero_pedido: 41, motivo: 'No me quedó' },
    })
  })

  it('sin nombre ni email no manda nada', async () => {
    renderizarEnRuta(<Arrepentimiento />)

    await userEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

    expect(api.POST).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Nombre y apellido')).toHaveFocus()
  })

  it('si hay demasiadas solicitudes seguidas, muestra el aviso del backend', async () => {
    const aviso = 'Hiciste muchas solicitudes seguidas. Probá de nuevo más tarde o escribinos por WhatsApp.'
    vi.mocked(api.POST).mockResolvedValue(respuesta(429, undefined, { detail: aviso }))
    renderizarEnRuta(<Arrepentimiento />)

    await completarMinimo()
    await userEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(aviso)
  })

  it('ante una falla del servidor no muestra su texto tecnico', async () => {
    vi.mocked(api.POST).mockResolvedValue(respuesta(500, undefined, { detail: 'Error interno del servidor' }))
    renderizarEnRuta(<Arrepentimiento />)

    await completarMinimo()
    await userEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('No pudimos registrar tu solicitud')
    expect(within(alerta).queryByText(/interno/)).not.toBeInTheDocument()
  })
})
