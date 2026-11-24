import path from 'node:path';

export function resolveManagerTarget(browser, environment = {}) {
  if (browser === 'chromium') return {browser, controller: 'controller.mjs', directory: 'tampermonkey'};
  if (browser !== 'firefox') throw Error('Unsupported manager browser: ' + browser);
  for (const key of ['FIREFOX_PATH', 'GECKODRIVER_PATH']) {
    if (!environment[key]) throw Error(key + ' is required');
    if (!path.isAbsolute(environment[key])) throw Error(key + ' must be absolute');
  }
  return {browser, controller: 'controller-firefox.mjs', directory: 'tampermonkey-firefox',
    executablePath: environment.FIREFOX_PATH, geckodriverPath: environment.GECKODRIVER_PATH};
}
