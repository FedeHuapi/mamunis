import { Link } from 'react-router'

import { estiloBotonEnlace } from '../lib/estilos'

/**
 * El lugar de una pagina que todavia no se armo. Los links del pie ya apuntan a su
 * direccion definitiva, asi que cuando se escriba la pagina real solo se cambia la ruta.
 */
export function EnConstruccion({ titulo }: { titulo: string }) {
  return (
    <section aria-labelledby="titulo-en-construccion" className="mx-auto max-w-2xl py-12 text-center">
      <p className="text-sm font-bold uppercase tracking-wide text-texto-suave">Próximamente</p>
      <h1 id="titulo-en-construccion" className="mt-2 text-4xl font-semibold">
        {titulo}
      </h1>
      <p className="mt-4 text-lg text-texto-suave">Estamos armando esta sección. Mientras tanto, escribinos y te ayudamos.</p>
      <Link to="/" className={`mt-8 ${estiloBotonEnlace}`}>
        Ver productos
      </Link>
    </section>
  )
}
