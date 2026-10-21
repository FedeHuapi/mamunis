import { Link } from 'react-router'

import logo from '../assets/logo.png'
import { estiloBotonEnlace, estiloBotonEnlaceSecundario } from '../lib/estilos'
import { estaPendiente, PORTADA } from '../tienda'

/** Una foto de la portada, o el logo sobre arena mientras no haya una. */
function Foto({ src, descripcion, className }: { src: string | null; descripcion: string; className: string }) {
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-arena ${className}`}>
        <img src={logo} alt="" className="w-2/5 max-w-48 opacity-90" />
      </div>
    )
  }
  return <img src={src} alt={descripcion} className={`object-cover ${className}`} />
}

/** La franja grande del principio: lo primero que ve quien entra a la tienda. */
export function Bienvenida() {
  return (
    <section
      aria-labelledby="titulo-bienvenida"
      className="mb-14 grid items-center gap-8 overflow-hidden rounded-[28px] bg-amarillo-suave p-6 md:grid-cols-[1.1fr_1fr] md:p-12"
    >
      <div>
        {PORTADA.etiqueta && (
          <p className="text-sm font-bold uppercase tracking-wide text-texto-suave">{PORTADA.etiqueta}</p>
        )}
        <h1 id="titulo-bienvenida" className="mt-3 text-4xl font-semibold leading-tight md:text-5xl">
          {PORTADA.titulo}
        </h1>
        <p className="mt-4 max-w-md text-lg text-texto-suave">{PORTADA.bajada}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          {/* Un link comun (no de React Router): baja hasta la grilla, en la misma pagina. */}
          <a href="#productos" className={estiloBotonEnlace}>
            Ver productos
          </a>
          <Link to="/sobre-mamunis" className={estiloBotonEnlaceSecundario}>
            Conocé la marca
          </Link>
        </div>
      </div>
      <Foto
        src={PORTADA.foto}
        descripcion={PORTADA.descripcionDeLaFoto}
        className="aspect-[4/3] w-full rounded-3xl md:aspect-[4/5] md:max-h-[460px]"
      />
    </section>
  )
}

/** Un adelanto de la historia de la marca, al final de la portada. */
export function SobreMamunisResumen() {
  const { sobre } = PORTADA
  return (
    <section
      aria-labelledby="titulo-sobre-resumen"
      className="mt-16 grid items-center gap-8 rounded-[28px] bg-white p-6 shadow-tarjeta md:grid-cols-[1fr_2fr] md:p-12"
    >
      <Foto src={sobre.foto} descripcion={sobre.descripcionDeLaFoto} className="aspect-square w-full rounded-3xl" />
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-texto-suave">Sobre Mamunis</p>
        <h2 id="titulo-sobre-resumen" className="mt-2 text-3xl font-semibold leading-tight">
          {sobre.titulo}
        </h2>
        <p className={`mt-4 text-lg leading-relaxed ${estaPendiente(sobre.texto) ? 'text-texto-suave' : ''}`}>{sobre.texto}</p>
        <Link to="/sobre-mamunis" className="mt-6 inline-block font-titulos text-lg font-semibold underline hover:text-texto-suave">
          Conocer la historia
        </Link>
      </div>
    </section>
  )
}
