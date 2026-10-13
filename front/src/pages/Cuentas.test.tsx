import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '../api/client'
import { RequiereSesion } from '../components/RequiereSesion'
import { renderizarEnRuta } from '../test/render'
import { Ingresar } from './Ingresar'
import { MiCuenta } from './MiCuenta'
import { Registro } from './Registro'

vi.mock('../api/client', () => ({ api: { GET: vi.fn(), POST: vi.fn() } }))

const TOKEN = 'token-de-prueba'
const USUARIO = { id: 5, nombre: 'Ana', email: 'ana@ejemplo.com', es_admin: false, fecha_registro: '2026-10-01T10:00:00Z' }
const PEDIDO = {
  id: 41,
  estado: 'en_preparacion',
  nombre_contacto: 'Ana',
  email_contacto: 'ana@ejemplo.com',
  telefono_contacto: '11 2345-6789',
  direccion_envio: 'Calle Falsa 123',
  total: '10000.00',
  fecha_creacion: '2026-10-09T12:05:00Z',
  items: [{ id: 1, talla: '12', cantidad: 2, precio_unitario: '5000.00', producto: { id: 2, nombre: 'Remera Dino', imagen: null } }],
}

const respuesta = (status: number, data?: unknown, error?: unknown) =>
  ({ data, error, response: { status, ok: status < 400 } }) as never

/** La API de mentira: responde segun haya o no una sesion guardada, como la de verdad. */
function apiConSesion() {
  vi.mocked(api.GET).mockImplementation((async (ruta: string) => {
    if (ruta === '/usuarios/me') return localStorage.getItem('mamunis.sesion') ? respuesta(200, USUARIO) : respuesta(401)
    if (ruta === '/usuarios/me/pedidos') return respuesta(200, { total: 1, items: [PEDIDO] })
    return respuesta(404)
  }) as never)
}

beforeEach(() => {
  localStorage.clear()
  vi.mocked(api.GET).mockReset()
  vi.mocked(api.POST).mockReset()
  apiConSesion()
})

describe('Ingresar', () => {
  const renderizar = (url = '/ingresar') => renderizarEnRuta(<Ingresar />, { ruta: '/ingresar', url })

  async function completar(email = 'ana@ejemplo.com', password = 'claveSegura123') {
    await userEvent.type(await screen.findByLabelText('Email'), email)
    await userEvent.type(screen.getByLabelText('Contraseña'), password)
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
  }

  it('con datos correctos guarda la sesion y lleva a la cuenta', async () => {
    vi.mocked(api.POST).mockResolvedValue(respuesta(200, { access_token: TOKEN, token_type: 'bearer' }))
    const router = renderizar()

    await completar()

    await waitFor(() => expect(router.state.location.pathname).toBe('/mi-cuenta'))
    expect(localStorage.getItem('mamunis.sesion')).toBe(TOKEN)
    expect(api.POST).toHaveBeenCalledWith('/usuarios/login', {
      body: { email: 'ana@ejemplo.com', password: 'claveSegura123' },
    })
  })

  it('vuelve a la pagina desde la que se llego', async () => {
    vi.mocked(api.POST).mockResolvedValue(respuesta(200, { access_token: TOKEN, token_type: 'bearer' }))
    const router = renderizar('/ingresar?volver=/checkout')

    await completar()

    await waitFor(() => expect(router.state.location.pathname).toBe('/checkout'))
  })

  it('no manda a un sitio de afuera aunque la direccion lo pida', async () => {
    vi.mocked(api.POST).mockResolvedValue(respuesta(200, { access_token: TOKEN, token_type: 'bearer' }))
    const router = renderizar('/ingresar?volver=https://sitio-falso.com')

    await completar()

    await waitFor(() => expect(router.state.location.pathname).toBe('/mi-cuenta'))
  })

  it('con datos incorrectos muestra el aviso del backend y no guarda nada', async () => {
    vi.mocked(api.POST).mockResolvedValue(respuesta(401, undefined, { detail: 'Email o contraseña incorrectos' }))
    renderizar()

    await completar()

    expect(await screen.findByRole('alert')).toHaveTextContent('Email o contraseña incorrectos')
    expect(localStorage.getItem('mamunis.sesion')).toBeNull()
  })

  it('con demasiados intentos muestra el aviso de bloqueo', async () => {
    const aviso = 'Demasiados intentos fallidos. Probá de nuevo más tarde.'
    vi.mocked(api.POST).mockResolvedValue(respuesta(429, undefined, { detail: aviso }))
    renderizar()

    await completar()

    expect(await screen.findByRole('alert')).toHaveTextContent(aviso)
  })

  it('sin completar no llama a la API', async () => {
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Ingresar' }))

    expect(api.POST).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Email')).toHaveFocus()
  })

  it('quien ya ingreso es llevado directo a su cuenta', async () => {
    localStorage.setItem('mamunis.sesion', TOKEN)
    const router = renderizar()

    await waitFor(() => expect(router.state.location.pathname).toBe('/mi-cuenta'))
  })
})

describe('Registro', () => {
  const renderizar = () => renderizarEnRuta(<Registro />, { ruta: '/registro', url: '/registro' })

  async function completar(repetir = 'claveSegura123') {
    await userEvent.type(await screen.findByLabelText('Nombre'), 'Ana')
    await userEvent.type(screen.getByLabelText('Email'), 'ana@ejemplo.com')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'claveSegura123')
    await userEvent.type(screen.getByLabelText('Repetí la contraseña'), repetir)
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
  }

  it('crea la cuenta, inicia la sesion y lleva a la cuenta', async () => {
    vi.mocked(api.POST).mockImplementation((async (ruta: string) =>
      ruta === '/usuarios/' ? respuesta(201, USUARIO) : respuesta(200, { access_token: TOKEN, token_type: 'bearer' })) as never)
    const router = renderizar()

    await completar()

    await waitFor(() => expect(router.state.location.pathname).toBe('/mi-cuenta'))
    expect(localStorage.getItem('mamunis.sesion')).toBe(TOKEN)
    // La contrasena repetida es solo para la pantalla: no viaja.
    expect(api.POST).toHaveBeenNthCalledWith(1, '/usuarios/', {
      body: { nombre: 'Ana', email: 'ana@ejemplo.com', password: 'claveSegura123' },
    })
  })

  it('si las contraseñas no coinciden no llama a la API', async () => {
    renderizar()

    await completar('claveSegura124')

    expect(api.POST).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Repetí la contraseña')).toHaveAccessibleDescription('Las dos contraseñas no coinciden.')
  })

  it('si el email ya tiene cuenta muestra el aviso del backend', async () => {
    vi.mocked(api.POST).mockResolvedValue(respuesta(409, undefined, { detail: 'Ya existe una cuenta con ese email' }))
    renderizar()

    await completar()

    expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe una cuenta con ese email')
    expect(localStorage.getItem('mamunis.sesion')).toBeNull()
  })
})

describe('Mi cuenta', () => {
  const renderizar = () =>
    renderizarEnRuta(<RequiereSesion>{(usuario) => <MiCuenta usuario={usuario} />}</RequiereSesion>, {
      ruta: '/mi-cuenta',
      url: '/mi-cuenta',
    })

  it('sin sesion manda a ingresar y recuerda a donde se queria ir', async () => {
    const router = renderizar()

    await waitFor(() => expect(router.state.location.pathname).toBe('/ingresar'))
    expect(router.state.location.search).toBe('?volver=%2Fmi-cuenta')
    expect(api.GET).not.toHaveBeenCalled()
  })

  it('con sesion muestra los datos y los pedidos con su estado', async () => {
    localStorage.setItem('mamunis.sesion', TOKEN)

    renderizar()

    expect(await screen.findByRole('heading', { name: 'Hola, Ana' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Pedido N.º 41' })).toBeInTheDocument()
    expect(screen.getByText('En preparación')).toBeInTheDocument()
    expect(screen.getByText('2 × Remera Dino, talle 12')).toBeInTheDocument()
  })

  it('si el token vencio, cierra la sesion y manda a ingresar', async () => {
    localStorage.setItem('mamunis.sesion', TOKEN)
    vi.mocked(api.GET).mockResolvedValue(respuesta(401))

    const router = renderizar()

    await waitFor(() => expect(router.state.location.pathname).toBe('/ingresar'))
    expect(localStorage.getItem('mamunis.sesion')).toBeNull()
  })

  it('salir borra la sesion', async () => {
    localStorage.setItem('mamunis.sesion', TOKEN)
    const router = renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Salir' }))

    expect(localStorage.getItem('mamunis.sesion')).toBeNull()
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })
})
