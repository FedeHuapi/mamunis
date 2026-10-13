/** Lleva el cursor al primer campo con error, en el orden en que aparecen en pantalla. */
export function enfocarPrimerError<T extends string>(orden: T[], errores: Partial<Record<T, string>>): boolean {
  const primero = orden.find((campo) => errores[campo])
  if (!primero) return false
  document.getElementById(primero)?.focus()
  return true
}
