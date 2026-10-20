import { findDraw } from '../states/index.js';

// Contrato puro; la fecha pertenece al sorteo, no se deduce del reloj de RD.
export function validateIdentity({ id, date, game, turn }) {
  const draw = findDraw(id);
  if (!draw || draw.turn !== turn || !draw.games.includes(game)) return false;
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [year, month, day] = date.split('-').map(Number);
  const normalized = new Date(Date.UTC(year, month - 1, day));
  return normalized.getUTCFullYear() === year &&
    normalized.getUTCMonth() === month - 1 &&
    normalized.getUTCDate() === day;
}
