import { florida } from './florida.js';
import { louisiana } from './louisiana.js';
import { ohio } from './ohio.js';
import { tennessee } from './tennessee.js';
import { indiana } from './indiana.js';

export const DRAWS = Object.freeze([...florida, ...louisiana, ...ohio, ...tennessee, ...indiana]);
export function findDraw(id) {
  return DRAWS.find((draw) => draw.id === id) ?? null;
}
