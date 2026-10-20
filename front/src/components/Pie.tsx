import type { ReactNode } from 'react'
import { Link } from 'react-router'

import logo from '../assets/logo.png'
import { enlaceDeWhatsapp, estaPendiente, type Red, TIENDA } from '../tienda'
import { IconoEmail, LogoDeRed } from './IconosRedes'

const NOMBRES_DE_REDES: Record<Red, string> = { instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook' }

const DIRECCIONES_DE_REDES: Record<Red, (usuario: string) => string> = {
  instagram: (usuario) => `https://www.instagram.com/${usuario}`,
  tiktok: (usuario) => `https://www.tiktok.com/@${usuario}`,
  facebook: (usuario) => `https://www.facebook.com/${usuario}`,
}

// La pagina oficial del formulario de reclamos (Ventanilla Unica Federal). Todo sitio que
// vende online tiene que tener este link con este texto (Resolucion 274/2021 de la
// Secretaria de Comercio Interior).
const DEFENSA_DEL_CONSUMIDOR = 'https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario'

// Se calcula una vez, al cargar la pagina.
const ANIO = new Date().getFullYear()

const estiloCirculo = 'flex h-11 w-11 items-center justify-center rounded-full bg-white text-tinta transition'

/** Un icono de red: con link si el dato esta completo, y marcado como pendiente si no. */
function BotonDeRed({ nombre, href, children }: { nombre: string; href?: string; children: ReactNode }) {
  if (!href) {
    return (
      <span
        role="img"
        aria-label={`${nombre} (falta completar)`}
        title={`${nombre}: falta completar`}
        className={`${estiloCirculo} border border-dashed border-borde-fuerte opacity-60`}
      >
        {children}
      </span>
    )
  }
  return (
    <a
      href={href}
      aria-label={`${nombre} de ${TIENDA.nombre}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`${estiloCirculo} shadow-tarjeta hover:bg-amarillo`}
    >
      {children}
    </a>
  )
}

const estiloTituloDeColumna = 'mb-3 font-titulos text-lg font-semibold text-tinta'
const estiloLink = 'text-texto hover:underline'

export function Pie() {
  const whatsapp = enlaceDeWhatsapp(TIENDA.whatsapp)
  const redes = TIENDA.redes.filter(({ usuario }) => usuario.trim() !== '')

  return (
    <footer className="border-t border-borde bg-arena text-sm">
      <div className="mx-auto max-w-6xl px-4 pb-6 pt-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="space-y-4">
            <img src={logo} alt={TIENDA.nombre} className="h-16 w-auto" />
            <p className="max-w-xs text-base text-texto-suave">{TIENDA.frase}</p>
            <div className="flex gap-2">
              {redes.map(({ red, usuario }) => (
                <BotonDeRed
                  key={red}
                  nombre={NOMBRES_DE_REDES[red]}
                  href={estaPendiente(usuario) ? undefined : DIRECCIONES_DE_REDES[red](usuario)}
                >
                  <LogoDeRed red={red} />
                </BotonDeRed>
              ))}
              <BotonDeRed nombre="WhatsApp" href={whatsapp}>
                <LogoDeRed red="whatsapp" />
              </BotonDeRed>
            </div>
          </div>

          <nav aria-label="Tienda">
            <h2 className={estiloTituloDeColumna}>Tienda</h2>
            <ul className="space-y-2">
              <li>
                <Link to="/" className={estiloLink}>
                  Productos
                </Link>
              </li>
              <li>
                <Link to="/sobre-mamunis" className={estiloLink}>
                  Sobre Mamunis
                </Link>
              </li>
              <li>
                <Link to="/mi-cuenta" className={estiloLink}>
                  Mi cuenta
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Ayuda">
            <h2 className={estiloTituloDeColumna}>Ayuda</h2>
            <ul className="space-y-2">
              <li>
                <Link to="/envios-y-pagos" className={estiloLink}>
                  Envíos y pagos
                </Link>
              </li>
              <li>
                <Link to="/cambios-y-devoluciones" className={estiloLink}>
                  Cambios y devoluciones
                </Link>
              </li>
              <li>
                <Link to="/terminos-y-privacidad" className={estiloLink}>
                  Términos y privacidad
                </Link>
              </li>
              <li className="pt-2">
                {/* La Resolucion 424/2020 pide que este a la vista desde la pagina de inicio y en un
                    lugar destacado "en cuanto a visibilidad y tamaño": por eso tiene forma de boton. */}
                <Link
                  to="/arrepentimiento"
                  className="inline-block rounded-full bg-tinta px-4 py-2 font-titulos text-base font-semibold text-fondo shadow-boton transition hover:bg-amarillo hover:text-tinta"
                >
                  Botón de arrepentimiento
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className={estiloTituloDeColumna}>Contacto</h2>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <LogoDeRed red="whatsapp" className="h-4 w-4 shrink-0" />
                {whatsapp ? (
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={estiloLink}>
                    {TIENDA.whatsapp}
                  </a>
                ) : (
                  <span>{TIENDA.whatsapp}</span>
                )}
              </li>
              <li className="flex items-center gap-2">
                <IconoEmail className="h-4 w-4 shrink-0" />
                {estaPendiente(TIENDA.email) ? (
                  <span>{TIENDA.email}</span>
                ) : (
                  <a href={`mailto:${TIENDA.email}`} className={`${estiloLink} break-all`}>
                    {TIENDA.email}
                  </a>
                )}
              </li>
              <li className="text-texto-suave">{TIENDA.horario}</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-borde pt-5 text-texto-suave">
          <p>
            © {ANIO} {TIENDA.nombre} · {TIENDA.razonSocial} · CUIT {TIENDA.cuit}
          </p>
          <a href={DEFENSA_DEL_CONSUMIDOR} target="_blank" rel="noopener noreferrer" className="underline hover:text-tinta">
            Defensa de las y los Consumidores. Para reclamos. Ingrese aquí
          </a>
        </div>
      </div>
    </footer>
  )
}
