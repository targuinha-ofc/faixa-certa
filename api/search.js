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

module.exports = async function handler(request, response) {
  const term = request.query.term?.trim();
  if (!term || term.length > 100) {
    response.status(400).json({ error: 'Informe uma palavra válida.' });
    return;
  }

  try {
    const tracks = await searchMusic(term);
    response.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    response.status(200).json(tracks);
  } catch (error) {
    response.status(502).json({ error: 'Não foi possível consultar o catálogo.' });
  }
};
