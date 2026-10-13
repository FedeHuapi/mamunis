/**
 * Saca un mensaje para mostrar de un error de la API, o usa el generico.
 *
 * La API manda `detail` como texto cuando el error es de negocio ("Stock insuficiente...")
 * y como lista cuando es de validacion. Solo el texto esta pensado para una persona.
 */
export function mensajeDeError(error: unknown, generico: string): string {
  const detalle = (error as { detail?: unknown } | undefined)?.detail
  return typeof detalle === 'string' ? detalle : generico
}
