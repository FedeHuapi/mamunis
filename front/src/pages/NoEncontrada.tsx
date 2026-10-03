import { Link } from 'react-router'

export function NoEncontrada() {
  return (
    <section className="py-16 text-center">
      <h1 className="text-3xl font-extrabold">No encontramos esa página</h1>
      <Link to="/" className="mt-4 inline-block font-semibold text-marca-oscuro underline">
        Volver a los productos
      </Link>
    </section>
  )
}
