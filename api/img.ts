// api/img.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import fetch from 'node-fetch'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url = req.query.url as string
    if (!url) {
      res.status(400).send('Missing url')
      return
    }

    const upstream = await fetch(url, { method: 'GET' })
    if (!upstream.ok) {
      res.status(upstream.status).send(`Upstream error: ${upstream.statusText}`)
      return
    }

    // Repassa o content-type original (importante para imagens)
    const ct = upstream.headers.get('content-type') || 'application/octet-stream'
    res.setHeader('Content-Type', ct)

    // CORS liberado para o navegador aceitar
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range')

    // Cache razoável (opcional)
    res.setHeader('Cache-Control', 'public, max-age=300')

    const buf = Buffer.from(await upstream.arrayBuffer())
    res.status(200).send(buf)
  } catch (e: any) {
    res.status(500).send(`Proxy error: ${e?.message || e}`)
  }
}
