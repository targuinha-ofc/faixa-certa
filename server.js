const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const port = Number(process.env.PORT) || 3000;
const host = '0.0.0.0';
const root = __dirname;
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8'
};

async function searchMusic(term) {
  const url = new URL('https://itunes.apple.com/search');
  url.searchParams.set('term', term);
  url.searchParams.set('entity', 'song');
  url.searchParams.set('attribute', 'songTerm');
  url.searchParams.set('limit', '20');
  url.searchParams.set('country', 'BR');

  const response = await fetch(url);
  if (!response.ok) throw new Error(`iTunes respondeu ${response.status}`);
  const data = await response.json();
  return data.results
    .filter(track => track.artworkUrl100 && track.trackViewUrl)
    .slice(0, 12);
}

function serveFile(request, response) {
  const requestedPath = request.url === '/' ? '/index.html' : request.url;
  const filePath = path.join(root, decodeURIComponent(requestedPath));
  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Página não encontrada');
    return;
  }
  response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(response);
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  if (requestUrl.pathname === '/api/search') {
    const term = requestUrl.searchParams.get('term')?.trim();
    if (!term || term.length > 100) {
      response.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ error: 'Informe uma palavra válida.' }));
      return;
    }
    try {
      const tracks = await searchMusic(term);
      response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' });
      response.end(JSON.stringify(tracks));
    } catch (error) {
      response.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ error: 'Não foi possível consultar o catálogo.' }));
    }
    return;
  }
  serveFile(request, response);
});

server.listen(port, host, () => console.log(`Faixa Certa rodando em http://${host}:${port}`));
