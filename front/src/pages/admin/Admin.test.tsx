import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '../../api/client'
import { RequiereAdmin } from '../../components/RequiereAdmin'
import { renderizarEnRuta } from '../../test/render'
import { AdminArrepentimientos } from './AdminArrepentimientos'
import { AdminCategorias } from './AdminCategorias'
import { AdminPedidos } from './AdminPedidos'
import { AdminProducto } from './AdminProducto'
import { AdminProductos } from './AdminProductos'

vi.mock('../../api/client', () => ({ api: { GET: vi.fn(), POST: vi.fn(), PATCH: vi.fn(), DELETE: vi.fn() } }))

const ADMIN = { id: 1, nombre: 'Fede', email: 'fede@ejemplo.com', es_admin: true, fecha_registro: '2026-10-01T10:00:00Z' }
const CATEGORIAS = [
  { id: 1, nombre: 'Remeras', descripcion: null },
  { id: 2, nombre: 'Buzos', descripcion: 'Para el frío' },
]
const PRODUCTO = {
  id: 7,
  nombre: 'Remera Dino',
  descripcion: 'De algodón',
  precio: '15000.00',
  categoria_id: 1,
  imagen: null,
  categoria: CATEGORIAS[0],
  variantes: [
    { id: 71, talla: '12', stock: 4 },
    { id: 70, talla: '10', stock: 0 },
  ],
}
const PEDIDO = {
  id: 41,
  estado: 'pendiente',
  nombre_contacto: 'Ana Pérez',
  email_contacto: 'ana@ejemplo.com',
  telefono_contacto: '11 2345-6789',
  direccion_envio: 'Calle Falsa 123',
  total: '30000.00',
  fecha_creacion: '2026-10-09T12:05:00Z',
  items: [{ id: 1, talla: '12', cantidad: 2, precio_unitario: '15000.00', producto: { id: 7, nombre: 'Remera Dino', imagen: null } }],
}

const SOLICITUDES = [
  {
    id: 2,
    codigo: 'ARR-BBBBBBBB',
    nombre: 'Beto Gómez',
    email: 'beto@ejemplo.com',
    telefono: null,
    numero_pedido: 999,
    motivo: null,
    estado: 'recibida',
    fecha_creacion: '2026-10-20T12:00:00Z',
    pedido: null,
  },
  {
    id: 1,
    codigo: 'ARR-AAAAAAAA',
    nombre: 'Ana Pérez',
    email: 'ana@ejemplo.com',
    telefono: '11 2345 6789',
    numero_pedido: 41,
    motivo: 'No me quedó',
    estado: 'en_proceso',
    fecha_creacion: '2026-10-19T12:00:00Z',
    pedido: { id: 41, estado: 'entregado', total: '30000.00', fecha_creacion: '2026-10-15T12:00:00Z' },
  },
]

const respuesta = (status: number, data?: unknown, error?: unknown) =>
  ({ data, error, response: { status, ok: status < 400 } }) as never

/** La API de mentira. `usuario` es quien tiene la sesion iniciada. */
function apiDePrueba(usuario: typeof ADMIN | null = ADMIN) {
  vi.mocked(api.GET).mockImplementation((async (ruta: string) => {
    if (ruta === '/usuarios/me') return usuario ? respuesta(200, usuario) : respuesta(401)
    if (ruta === '/categorias/') return respuesta(200, { total: 2, items: CATEGORIAS })
    if (ruta === '/productos/') return respuesta(200, { total: 1, items: [PRODUCTO] })
    if (ruta === '/productos/{producto_id}') return respuesta(200, PRODUCTO)
    if (ruta === '/pedidos/') return respuesta(200, { total: 1, items: [PEDIDO] })
    if (ruta === '/arrepentimientos/') return respuesta(200, { total: 2, items: SOLICITUDES })
    return respuesta(404)
  }) as never)
}

/** Hace que la API devuelva el producto con otro stock en el talle 12, como despues de una venta. */
function apiConStock(stock: number) {
  const anterior = vi.mocked(api.GET).getMockImplementation()!
  vi.mocked(api.GET).mockImplementation((async (ruta: string, ...resto: unknown[]) => {
    if (ruta !== '/productos/{producto_id}') return (anterior as (...args: unknown[]) => unknown)(ruta, ...resto)
    return respuesta(200, { ...PRODUCTO, variantes: [{ id: 71, talla: '12', stock }, PRODUCTO.variantes[1]] })
  }) as never)
}

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('mamunis.sesion', 'token-de-prueba')
  for (const metodo of [api.GET, api.POST, api.PATCH, api.DELETE]) vi.mocked(metodo).mockReset()
  apiDePrueba()
})

describe('quien puede entrar al panel', () => {
  const renderizar = () =>
    renderizarEnRuta(
      <RequiereAdmin>
        <p>el panel</p>
      </RequiereAdmin>,
      { ruta: '/admin', url: '/admin' },
    )

  it('una cuenta administradora lo ve', async () => {
    renderizar()

    expect(await screen.findByText('el panel')).toBeInTheDocument()
  })

  it('sin sesion manda a ingresar y recuerda a donde se queria ir', async () => {
    localStorage.clear()
    const router = renderizar()

    await waitFor(() => expect(router.state.location.pathname).toBe('/ingresar'))
    expect(router.state.location.search).toBe('?volver=%2Fadmin')
  })

  it('una cuenta comun ve "pagina no encontrada", no el panel', async () => {
    apiDePrueba({ ...ADMIN, es_admin: false })
    renderizar()

    expect(await screen.findByRole('heading', { name: 'No encontramos esa página' })).toBeInTheDocument()
    expect(screen.queryByText('el panel')).not.toBeInTheDocument()
  })
})

describe('Pedidos', () => {
  const renderizar = (url = '/admin/pedidos') => renderizarEnRuta(<AdminPedidos />, { ruta: '/admin/pedidos', url })

  it('muestra cada pedido con sus datos de contacto y solo los pasos posibles', async () => {
    renderizar()

    const tarjeta = (await screen.findByRole('heading', { name: 'Pedido N.º 41' })).closest('li')!
    expect(within(tarjeta).getByText('Ana Pérez')).toBeInTheDocument()
    expect(within(tarjeta).getByText('11 2345-6789')).toBeInTheDocument()
    expect(within(tarjeta).getByText(/2 × Remera Dino, talle 12/)).toBeInTheDocument()
    expect(within(tarjeta).getByRole('button', { name: 'Confirmar' })).toBeInTheDocument()
    expect(within(tarjeta).getByRole('button', { name: 'Cancelar pedido' })).toBeInTheDocument()
    expect(within(tarjeta).queryByRole('button', { name: 'Marcar como enviado' })).not.toBeInTheDocument()
  })

  it('filtra por estado y lo deja en la direccion', async () => {
    const router = renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Enviado' }))

    expect(router.state.location.search).toBe('?estado=enviado')
    await waitFor(() =>
      expect(api.GET).toHaveBeenCalledWith('/pedidos/', { params: { query: { estado: 'enviado', skip: 0, limit: 10 } } }),
    )
  })

  it('ignora un estado inventado en la direccion', async () => {
    renderizar('/admin/pedidos?estado=regalado')

    await screen.findByRole('heading', { name: 'Pedido N.º 41' })
    expect(api.GET).toHaveBeenCalledWith('/pedidos/', { params: { query: { estado: undefined, skip: 0, limit: 10 } } })
  })

  it('confirmar un pedido llama a la API con el estado nuevo', async () => {
    vi.mocked(api.PATCH).mockResolvedValue(respuesta(200, { ...PEDIDO, estado: 'confirmado' }))
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Confirmar' }))

    expect(api.PATCH).toHaveBeenCalledWith('/pedidos/{pedido_id}/estado', {
      params: { path: { pedido_id: 41 } },
      body: { estado: 'confirmado' },
    })
  })

  it('cancelar pregunta antes, y decir que no no cancela nada', async () => {
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar pedido' }))
    expect(screen.getByRole('button', { name: 'No' })).toHaveFocus()
    await userEvent.click(screen.getByRole('button', { name: 'No' }))

    expect(api.PATCH).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Cancelar pedido' })).toBeInTheDocument()
  })

  it('cancelar con confirmacion llama a la API', async () => {
    vi.mocked(api.PATCH).mockResolvedValue(respuesta(200, { ...PEDIDO, estado: 'cancelado' }))
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar pedido' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sí, cancelar' }))

    expect(api.PATCH).toHaveBeenCalledWith('/pedidos/{pedido_id}/estado', {
      params: { path: { pedido_id: 41 } },
      body: { estado: 'cancelado' },
    })
  })

  it('si el backend rechaza el cambio, muestra su aviso', async () => {
    const aviso = "No se puede pasar un pedido de 'cancelado' a 'confirmado'"
    vi.mocked(api.PATCH).mockResolvedValue(respuesta(409, undefined, { detail: aviso }))
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(aviso)
  })

  it('si la sesion vencio, la cierra y avisa', async () => {
    vi.mocked(api.PATCH).mockResolvedValue(respuesta(401, undefined, { detail: 'No autenticado' }))
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Tu sesión venció')
    expect(localStorage.getItem('mamunis.sesion')).toBeNull()
  })
})

describe('Productos', () => {
  it('lista los productos con el stock de cada talle, ordenado', async () => {
    renderizarEnRuta(<AdminProductos />, { ruta: '/admin/productos', url: '/admin/productos' })

    expect(await screen.findByRole('heading', { name: 'Remera Dino' })).toBeInTheDocument()
    expect(screen.getByText('Talle 10: 0 · Talle 12: 4')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Editar Remera Dino' })).toHaveAttribute('href', '/admin/productos/7')
  })
})

describe('Producto nuevo', () => {
  const renderizar = () =>
    renderizarEnRuta(<AdminProducto />, { ruta: '/admin/productos/nuevo', url: '/admin/productos/nuevo' })

  async function completar(precio = '15000,50') {
    await userEvent.type(await screen.findByLabelText('Nombre'), 'Buzo Oso')
    await userEvent.type(screen.getByLabelText('Precio'), precio)
    await userEvent.selectOptions(await screen.findByLabelText('Categoría'), await screen.findByRole('option', { name: 'Buzos' }))
  }

  it('crea el producto con sus talles y pasa a su pantalla de edicion', async () => {
    vi.mocked(api.POST).mockResolvedValue(respuesta(201, { ...PRODUCTO, id: 9 }))
    const router = renderizar()

    await completar()
    await userEvent.type(screen.getByLabelText('Talle 10'), '3')
    await userEvent.type(screen.getByLabelText('Talle 14'), '0')
    await userEvent.click(screen.getByRole('button', { name: 'Crear producto' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/productos/9'))
    expect(api.POST).toHaveBeenCalledWith('/productos/', {
      body: {
        nombre: 'Buzo Oso',
        descripcion: null,
        precio: '15000.50',
        categoria_id: 2,
        variantes: [
          { talla: '10', stock: 3 },
          { talla: '14', stock: 0 },
        ],
      },
    })
  })

  it('no manda un precio escrito con punto de miles', async () => {
    renderizar()

    await completar('15.000')
    await userEvent.click(screen.getByRole('button', { name: 'Crear producto' }))

    expect(api.POST).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Precio')).toHaveFocus()
    expect(screen.getByLabelText('Precio')).toHaveAccessibleDescription(/sin puntos de miles/)
  })

  it('sin completar no llama a la API', async () => {
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Crear producto' }))

    expect(api.POST).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Nombre')).toHaveFocus()
  })
})

describe('Editar producto', () => {
  const renderizar = (url = '/admin/productos/7') => renderizarEnRuta(<AdminProducto />, { ruta: '/admin/productos/:id', url })

  it('muestra los datos actuales y guarda solo los cambios basicos', async () => {
    vi.mocked(api.PATCH).mockResolvedValue(respuesta(200, PRODUCTO))
    renderizar()

    const precio = await screen.findByLabelText('Precio')
    expect(precio).toHaveValue('15000')
    expect(screen.getByLabelText('Nombre')).toHaveValue('Remera Dino')
    await userEvent.clear(precio)
    await userEvent.type(precio, '18000')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('Cambios guardados.')).toBeInTheDocument()
    expect(api.PATCH).toHaveBeenCalledWith('/productos/{producto_id}', {
      params: { path: { producto_id: 7 } },
      body: { nombre: 'Remera Dino', descripcion: 'De algodón', precio: '18000', categoria_id: 1 },
    })
  })

  it('guarda el stock de un talle', async () => {
    vi.mocked(api.PATCH).mockResolvedValue(respuesta(200, { id: 71, talla: '12', stock: 9 }))
    renderizar()

    const stock = await screen.findByLabelText('Talle 12')
    const fila = stock.closest('li')!
    expect(within(fila).getByRole('button', { name: 'Guardar stock' })).toBeDisabled()
    await userEvent.clear(stock)
    await userEvent.type(stock, '9')
    await userEvent.click(within(fila).getByRole('button', { name: 'Guardar stock' }))

    expect(api.PATCH).toHaveBeenCalledWith('/productos/{producto_id}/variantes/{variante_id}', {
      params: { path: { producto_id: 7, variante_id: 71 } },
      body: { stock: 9, stock_anterior: 4 },
    })
  })

  it('si hubo una venta mientras se editaba, avisa y muestra el stock real', async () => {
    const aviso = 'El stock cambió mientras lo editabas: ahora hay 2. Revisalo y guardá de nuevo.'
    vi.mocked(api.PATCH).mockResolvedValue(respuesta(409, undefined, { detail: aviso }))
    renderizar()

    const stock = await screen.findByLabelText('Talle 12')
    await userEvent.clear(stock)
    await userEvent.type(stock, '9')
    // La pantalla se refresca en segundo plano (como al volver a la pestaña) y ya trae la venta: 4 pasa a 2.
    apiConStock(2)
    const pedidosDelProducto = () => vi.mocked(api.GET).mock.calls.filter(([ruta]) => ruta === '/productos/{producto_id}').length
    const antes = pedidosDelProducto()
    window.dispatchEvent(new Event('visibilitychange'))
    await waitFor(() => expect(pedidosDelProducto()).toBeGreaterThan(antes))
    expect(stock).toHaveValue('9') // lo escrito no se pierde con el refresco
    await userEvent.click(within(stock.closest('li')!).getByRole('button', { name: 'Guardar stock' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(aviso)
    // Se mando el 4 que se vio al empezar a escribir, no un valor refrescado despues.
    expect(api.PATCH).toHaveBeenCalledWith('/productos/{producto_id}/variantes/{variante_id}', {
      params: { path: { producto_id: 7, variante_id: 71 } },
      body: { stock: 9, stock_anterior: 4 },
    })
    await waitFor(() => expect(screen.getByLabelText('Talle 12')).toHaveValue('2'))
  })

  it('solo ofrece agregar los talles que faltan', async () => {
    vi.mocked(api.POST).mockResolvedValue(respuesta(201, { id: 72, talla: '14', stock: 2 }))
    renderizar()

    const selector = await screen.findByLabelText('Agregar talle')
    expect(within(selector).getAllByRole('option').map((opcion) => opcion.textContent)).toEqual(['14', '16'])
    await userEvent.clear(screen.getByLabelText('Stock'))
    await userEvent.type(screen.getByLabelText('Stock'), '2')
    await userEvent.click(screen.getByRole('button', { name: 'Agregar' }))

    expect(api.POST).toHaveBeenCalledWith('/productos/{producto_id}/variantes', {
      params: { path: { producto_id: 7 } },
      body: { talla: '14', stock: 2 },
    })
  })

  it('sube una foto como formulario, no como JSON', async () => {
    vi.mocked(api.POST).mockResolvedValue(respuesta(200, { ...PRODUCTO, imagen: 'https://res.cloudinary.com/x/dino.png' }))
    renderizar()
    const foto = new File(['contenido'], 'dino.png', { type: 'image/png' })

    await userEvent.upload(await screen.findByLabelText('Subir una foto'), foto)

    await waitFor(() => expect(api.POST).toHaveBeenCalled())
    const [ruta, opciones] = vi.mocked(api.POST).mock.calls[0] as unknown as [string, { bodySerializer: () => FormData }]
    expect(ruta).toBe('/productos/{producto_id}/imagen')
    expect(opciones.bodySerializer().get('archivo')).toBe(foto)
  })

  it('no sube un archivo que no es una foto', async () => {
    renderizar()
    const pdf = new File(['contenido'], 'factura.pdf', { type: 'application/pdf' })

    await userEvent.upload(await screen.findByLabelText('Subir una foto'), pdf, { applyAccept: false })

    expect(await screen.findByRole('alert')).toHaveTextContent('La foto tiene que ser JPG, PNG o WebP.')
    expect(api.POST).not.toHaveBeenCalled()
  })

  it('eliminar pregunta antes y, si el backend no deja, muestra por que', async () => {
    const aviso = 'No se puede eliminar: está en algún carrito o pedido'
    vi.mocked(api.DELETE).mockResolvedValue(respuesta(409, undefined, { detail: aviso }))
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar producto' }))
    expect(api.DELETE).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(aviso)
    expect(api.DELETE).toHaveBeenCalledWith('/productos/{producto_id}', { params: { path: { producto_id: 7 } } })
  })

  it('con un numero que no es valido muestra "pagina no encontrada"', async () => {
    renderizar('/admin/productos/abc')

    expect(await screen.findByRole('heading', { name: 'No encontramos esa página' })).toBeInTheDocument()
  })
})

describe('Categorias', () => {
  const renderizar = () => renderizarEnRuta(<AdminCategorias />, { ruta: '/admin/categorias', url: '/admin/categorias' })

  it('crea una categoria y limpia el formulario', async () => {
    vi.mocked(api.POST).mockResolvedValue(respuesta(201, { id: 3, nombre: 'Pijamas', descripcion: null }))
    renderizar()
    const formulario = within(screen.getByRole('region', { name: 'Nueva categoría' }))

    await userEvent.type(formulario.getByLabelText('Nombre'), ' Pijamas ')
    await userEvent.click(formulario.getByRole('button', { name: 'Crear categoría' }))

    await waitFor(() => expect(formulario.getByLabelText('Nombre')).toHaveValue(''))
    expect(api.POST).toHaveBeenCalledWith('/categorias/', { body: { nombre: 'Pijamas', descripcion: null } })
  })

  it('sin nombre no llama a la API', async () => {
    renderizar()

    await userEvent.click(screen.getByRole('button', { name: 'Crear categoría' }))

    expect(api.POST).not.toHaveBeenCalled()
  })

  it('si el nombre ya existe muestra el aviso del backend', async () => {
    const aviso = 'Ya existe una categoría con ese nombre'
    vi.mocked(api.POST).mockResolvedValue(respuesta(409, undefined, { detail: aviso }))
    renderizar()
    const formulario = within(screen.getByRole('region', { name: 'Nueva categoría' }))

    await userEvent.type(formulario.getByLabelText('Nombre'), 'Remeras')
    await userEvent.click(formulario.getByRole('button', { name: 'Crear categoría' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(aviso)
  })

  it('edita una categoria existente', async () => {
    vi.mocked(api.PATCH).mockResolvedValue(respuesta(200, { ...CATEGORIAS[1], nombre: 'Buzos y camperas' }))
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Editar Buzos' }))
    const fila = within(screen.getByDisplayValue('Buzos').closest('li')!)
    await userEvent.type(fila.getByLabelText('Nombre'), ' y camperas')
    await userEvent.click(fila.getByRole('button', { name: 'Guardar' }))

    await waitFor(() =>
      expect(api.PATCH).toHaveBeenCalledWith('/categorias/{categoria_id}', {
        params: { path: { categoria_id: 2 } },
        body: { nombre: 'Buzos y camperas', descripcion: 'Para el frío' },
      }),
    )
  })

  it('eliminar pregunta antes de borrar', async () => {
    vi.mocked(api.DELETE).mockResolvedValue(respuesta(204))
    renderizar()

    const fila = within((await screen.findByRole('heading', { name: 'Remeras' })).closest('li')!)
    await userEvent.click(fila.getByRole('button', { name: 'Eliminar' }))
    expect(api.DELETE).not.toHaveBeenCalled()
    await userEvent.click(fila.getByRole('button', { name: 'Sí, eliminar' }))

    expect(api.DELETE).toHaveBeenCalledWith('/categorias/{categoria_id}', { params: { path: { categoria_id: 1 } } })
  })
})

describe('Arrepentimientos', () => {
  const renderizar = () =>
    renderizarEnRuta(<AdminArrepentimientos />, { ruta: '/admin/arrepentimientos', url: '/admin/arrepentimientos' })

  it('muestra cada solicitud con su pedido, o avisa si no se pudo vincular', async () => {
    renderizar()

    const vinculada = within((await screen.findByRole('heading', { name: 'ARR-AAAAAAAA' })).closest('li')!)
    expect(vinculada.getByText(/Pedido N.º 41/)).toBeInTheDocument()
    expect(vinculada.getByText('No me quedó')).toBeInTheDocument()

    const sinVincular = within(screen.getByRole('heading', { name: 'ARR-BBBBBBBB' }).closest('li')!)
    expect(sinVincular.getByText(/Escribió el pedido N.º 999, pero no coincide/)).toBeInTheDocument()
  })

  it('cambia el estado de una solicitud', async () => {
    vi.mocked(api.PATCH).mockResolvedValue(respuesta(200, { ...SOLICITUDES[0], estado: 'resuelta' }))
    renderizar()

    const tarjeta = within((await screen.findByRole('heading', { name: 'ARR-BBBBBBBB' })).closest('li')!)
    await userEvent.click(tarjeta.getByRole('button', { name: 'Marcar como resuelta' }))

    expect(api.PATCH).toHaveBeenCalledWith('/arrepentimientos/{arrepentimiento_id}/estado', {
      params: { path: { arrepentimiento_id: 2 } },
      body: { estado: 'resuelta' },
    })
  })
})
