const ORIGIN = 'https://ahaslides-product.github.io/ahaslides-design';
const PUBLIC = 'https://design.ahaslides.io';

export default {
  async fetch(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { allow: 'GET, HEAD' } });
    }
    const url = new URL(request.url);
    const upstream = await fetch(ORIGIN + url.pathname + url.search, {
      method: request.method,
      redirect: 'manual',
      cf: { cacheTtl: 600, cacheEverything: true },
    });
    const headers = new Headers(upstream.headers);
    const location = headers.get('location');
    if (location) {
      const target = new URL(location, ORIGIN + url.pathname);
      if (target.href.startsWith(ORIGIN)) {
        headers.set('location', PUBLIC + target.href.slice(ORIGIN.length));
      }
    }
    return new Response(upstream.body, { status: upstream.status, headers });
  },
};
