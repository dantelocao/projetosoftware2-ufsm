// api/img.ts  (Vercel Edge Function)
export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  const corsBase: Record<string, string> = {
    // libere o localhost durante dev; em produção pode trocar por seu domínio
    'Access-Control-Allow-Origin': '*', // ou "http://localhost:5173"
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Range',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range',
  };

  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsBase });
  }

  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  if (!url) {
    return new Response(JSON.stringify({ error: 'Missing url' }), {
      status: 400,
      headers: { 'content-type': 'application/json', ...corsBase },
    });
  }

  const range = req.headers.get('range') ?? undefined;
  const upstream = await fetch(url, {
    headers: range ? { range } : undefined,
    cache: 'no-store',
  });

  if (!upstream.ok && upstream.status !== 206) {
    return new Response(JSON.stringify({ error: `Upstream ${upstream.status}` }), {
      status: upstream.status,
      headers: { 'content-type': 'application/json', ...corsBase },
    });
  }

  // Copia alguns headers úteis do upstream
  const h = new Headers(corsBase);
  const ct = upstream.headers.get('content-type');
  const cl = upstream.headers.get('content-length');
  const cr = upstream.headers.get('content-range');
  const ar = upstream.headers.get('accept-ranges');

  if (ct) h.set('Content-Type', ct);
  if (cl) h.set('Content-Length', cl);
  if (cr) h.set('Content-Range', cr);
  if (ar) h.set('Accept-Ranges', ar);
  h.set('Cache-Control', 'public, max-age=60');

  return new Response(upstream.body, {
    status: upstream.status,
    headers: h,
  });
}
