
// King's Music — Backend Proxy for JioSaavn API
// Netlify Function: /.netlify/functions/api/*

const UPSTREAMS = [
  'https://jiosaavn-api-ts.vercel.app',
  'https://jiosaavn-api-privatecvc2.vercel.app',
  'https://saavnapi-nine.vercel.app'
];

const TIMEOUT_MS = 7000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Max-Age': '86400'
};

async function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json', 'User-Agent': 'KingsMusic/2.0' }
    });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Extract path after /api
  let path = event.path || '';
  path = path.replace(/^\/\.netlify\/functions\/api/, '');
  path = path.replace(/^\/api/, '');
  if (!path.startsWith('/')) path = '/' + path;
  if (path === '/') path = '';

  const query = event.rawQuery ? '?' + event.rawQuery : '';

  // Try each upstream
  let lastError = null;
  for (const upstream of UPSTREAMS) {
    try {
      const targetUrl = upstream + path + query;
      const res = await fetchWithTimeout(targetUrl, TIMEOUT_MS);

      if (!res.ok) {
        lastError = `HTTP ${res.status} from ${upstream}`;
        continue;
      }

      const body = await res.text();

      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=300, s-maxage=600',
          'X-Proxy-Source': upstream.replace(/https?:\/\//, '')
        },
        body
      };
    } catch (err) {
      lastError = err.message || 'Network error';
      continue;
    }
  }

  return {
    statusCode: 502,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      success: false,
      error: 'All upstreams failed',
      detail: lastError
    })
  };
};
