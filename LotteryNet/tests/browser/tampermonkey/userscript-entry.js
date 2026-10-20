/* Test-only entry, installed through the real manager; never imported by src/. */
import {runTenDrawCases} from '../helpers/ten-draw-cases.js';

const publish = data => {
  const result = document.createElement('pre');
  result.id = 'lnr-tm-qa-result';
  result.textContent = JSON.stringify(data);
  document.body.appendChild(result);
};
const request = (url, method = 'GET') => new Promise(resolve => {
  GM_xmlhttpRequest({url, method, timeout: 3500,
    onload: response => resolve({ok: response.status === 200, status: response.status, text: response.responseText}),
    onerror: () => resolve({ok: false, error: 'network-error'}),
    ontimeout: () => resolve({ok: false, error: 'timeout'}),
    onabort: () => resolve({ok: false, error: 'aborted'})});
});

(async () => {
  try {
    if (typeof GM_info === 'undefined' || GM_info.scriptHandler !== 'Tampermonkey')
      throw Error('A real Tampermonkey installation is required');
    const manager = {handler: GM_info.scriptHandler, version: GM_info.version,
      scriptVersion: GM_info.script.version, sandboxMode: GM_info.sandboxMode,
      grants: GM_info.script.grant};
    const phase = new URL(location.href).searchParams.get('phase');
    if (!['preflight', 'isolated'].includes(phase)) throw Error('Unknown QA phase');
    const key = 'lnr-tm-qa-' + Date.now();
    GM_setValue(key, 'qa-value');
    const stored = GM_getValue(key) === 'qa-value';
    GM_deleteValue(key);
    const deleted = GM_getValue(key, 'missing') === 'missing';
    if (!stored || !deleted) throw Error('Real GM storage check failed');
    const local = await request(location.origin + '/gm-ok');
    if (!local.ok || local.text !== 'local-ok') throw Error('GM background request to local fixture failed');
    const external = await request(__LOTTERYNET_OUTSIDE_CANARY__ + '/gm-' + phase, 'POST');
    if (phase === 'preflight') {
      if (!external.ok) throw Error('GM canary must be reachable before isolation');
      publish({status: 'PASS', phase, manager, storage: {stored, deleted}, localGmGet: true, outsideGmPost: external});
      return;
    }
    if (external.ok) throw Error('GM background request escaped the network namespace');
    const cases = __LOTTERYNET_QA_CASES__;
    const htmlByUrl = {};
    for (const item of cases) {
      const response = await request(location.origin + '/fixtures/' + item.fixture);
      if (!response.ok) throw Error('Captured fixture unavailable: ' + item.fixture);
      htmlByUrl[item.url] = response.text;
    }
    const output = await runTenDrawCases({cases, htmlByUrl, date: '2026-10-19', postFillObservationMs: 500});
    publish({status: 'PASS', phase, manager, storage: {stored, deleted}, localGmGet: true,
      outsideGmPost: external, output, postFillObservationMs: 500});
  } catch (error) { publish({status: 'FAIL', error: error.message}); }
})();
