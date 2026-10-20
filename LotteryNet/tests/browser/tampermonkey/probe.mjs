import {chromium} from 'playwright';
import path from 'node:path';
import {mkdir, writeFile} from 'node:fs/promises';
const base = path.resolve('test-results/tampermonkey');
await mkdir(base, {recursive: true});
const extension = path.join(base, 'extension');
const context = await chromium.launchPersistentContext(path.join(base, 'probe-profile'), {
  channel: 'chromium', headless: true,
  args: ['--disable-extensions-except=' + extension, '--load-extension=' + extension]
});
try {
  let worker = context.serviceWorkers()[0];
  if (!worker) worker = await context.waitForEvent('serviceworker', {timeout: 20000});
  const id = worker.url().split('/')[2];
  const page = await context.newPage();
  await page.goto('chrome://extensions/?id=' + id);
  const details = await page.locator('body').innerText();
  const toggles = await page.locator('cr-toggle').evaluateAll(elements => elements.map(element => ({
    id: element.id, aria: element.getAttribute('aria-label'), checked: element.getAttribute('checked')
  })));
  console.log('EXTENSION DETAILS', JSON.stringify({id, details, toggles}));
  const options = await context.newPage();
  await options.goto('chrome-extension://' + id + '/options.html#nav=utils');
  await options.waitForTimeout(1500);
  console.log('OPTIONS UI', (await options.locator('body').innerText()).slice(0,7000));
  console.log('FILE INPUTS', await options.locator('input[type=file]').count());
  await page.screenshot({path: path.join(base, 'extension-details.png')});
  await options.screenshot({path: path.join(base, 'options.png')});
  await writeFile(path.join(base, 'probe.json'), JSON.stringify({id, details, toggles}, null, 2));
} finally {await context.close();}
