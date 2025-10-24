export default async function handler(request) {
  try {
    const url = new URL(request.url);
    const target = url.searchParams.get('url');
    if (!target) {
      return new Response('Missing "url" query parameter', { status: 400 });
    }

    if (!/^https?:\/\//i.test(target)) {
      return new Response('Invalid URL scheme', { status: 400 });
    }

    const fetchOptions = {
      method: 'GET',
      headers: {
        'User-Agent': request.headers.get('user-agent') || 'Vercel-Proxy',
        'Accept': request.headers.get('accept') || '*/*'
      },
    };

    const res = await fetch(target, fetchOptions);

    const contentType = res.headers.get('content-type') || 'application/octet-stream';

    if (contentType.includes('text/html')) {
      let body = await res.text();

      body = body.replace(
        /(?:href|src)=["'](https?:\/\/[^"']+)["']/gi,
        (m, group1) => {
          const proxied = `/api/proxy?url=${encodeURIComponent(group1)}`;
          return m.replace(group1, proxied);
        }
      );

      return new Response(body, {
        status: res.status,
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(res.body, {
      status: res.status,
      headers,
    });
  } catch (err) {
    console.error('Proxy error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
