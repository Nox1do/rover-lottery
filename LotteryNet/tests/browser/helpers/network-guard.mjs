/** Test-only boundary: static responses or abort, never forward a request.
 * Covers this extension-free Playwright context's HTTP and WebSocket traffic.
 * Not an OS firewall or a guarantee about Tampermonkey background requests.
 */
export async function installNetworkGuard(context, resources) {
  const blocked = [];
  const served = [];
  const metadata = (url, method) => {
    const parsed = new URL(url);
    return {method, origin: parsed.origin, path: parsed.pathname};
  };
  await context.route('**/*', async route => {
    const request = route.request();
    const resource = resources.get(request.url());
    if (request.method() === 'GET' && resource) {
      served.push(metadata(request.url(), 'GET'));
      await route.fulfill({status: 200, ...resource});
      return;
    }
    blocked.push(metadata(request.url(), request.method()));
    await route.abort('blockedbyclient');
  });
  await context.routeWebSocket('**/*', socket => {
    blocked.push(metadata(socket.url(), 'WEBSOCKET'));
    socket.close({code: 1000, reason: 'LotteryNet isolated QA'});
  });
  return {blocked, served};
}
