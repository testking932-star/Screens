export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);

    // Extract path after /clover-api
    const remotePath = url.pathname.replace('/clover-api', '') + url.search;

    // Handle OPTIONS preflight requests for CORS
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Max-Age': '86400',
            },
        });
    }

    // Determine target host based on X-Clover-Env header
    const envHeader = request.headers.get('X-Clover-Env') || 'prod';
    const baseUrl = envHeader === 'prod'
        ? 'https://api.clover.com/v3'
        : 'https://apisandbox.dev.clover.com/v3';

    const targetUrl = `${baseUrl.replace(/\/$/, '')}${remotePath}`;

    // Build headers to forward
    const forwardHeaders = new Headers();
    for (const [key, value] of request.headers.entries()) {
        if (!['host', 'content-length', 'connection', 'accept-encoding'].includes(key.toLowerCase())) {
            forwardHeaders.set(key, value);
        }
    }

    const init = {
        method: request.method,
        headers: forwardHeaders,
    };

    if (!['GET', 'HEAD'].includes(request.method)) {
        init.body = request.body;
    }

    try {
        const response = await fetch(targetUrl, init);

        const resHeaders = new Headers();
        for (const [key, value] of response.headers.entries()) {
            if (!['transfer-encoding', 'content-encoding', 'connection'].includes(key.toLowerCase())) {
                resHeaders.set(key, value);
            }
        }
        resHeaders.set('Access-Control-Allow-Origin', '*');

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: resHeaders,
        });
    } catch (err) {
        return new Response(`Cloudflare Worker Proxy Error: ${err.message}`, {
            status: 500,
            headers: {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*',
            },
        });
    }
}
