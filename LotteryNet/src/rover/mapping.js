/**
 * Mapea únicamente los resultados primarios de 3 y 4 dígitos.
 * null significa que el juego no está disponible; los ceros iniciales se preservan.
 * El resultado contiene 5 valores ordenados; esta función NO toca el DOM.
 */
export function mapRoverFields({ p3 = null, p4 = null } = {}) {
  const fields = [null, null, null, null, null];
  if (p3 !== null) {
    if (typeof p3 !== 'string' || !/^\d{3}$/.test(p3)) {
      throw new TypeError('El juego 3 debe ser una cadena de exactamente 3 dígitos');
    }
    fields[0] = p3.slice(-2);
    fields[3] = p3;
  }
  if (p4 !== null) {
    if (typeof p4 !== 'string' || !/^\d{4}$/.test(p4)) {
      throw new TypeError('El juego 4 debe ser una cadena de exactamente 4 dígitos');
    }
    fields[1] = p4.slice(0, 2);
    fields[2] = p4.slice(-2);
    fields[4] = p4;
  }
  return Object.freeze(fields);
}
