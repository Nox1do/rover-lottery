// Espacio de nombres exclusivo; jamás reutilizar claves de otros userscripts.
export const STORAGE_PREFIX = 'lotterynet:rover:v1:';
export function defaultSettings() {
  return { autoEnabled: false, releaseReady: false };
}
