const form = document.querySelector('#searchForm');
const queryInput = document.querySelector('#query');
const button = document.querySelector('#submitButton');
const title = document.querySelector('#title');
const count = document.querySelector('#count');
const status = document.querySelector('#status');
const results = document.querySelector('#results');
const platformPanel = document.querySelector('#platformPanel');
const platformBackdrop = document.querySelector('#platformBackdrop');
const panelClose = document.querySelector('#panelClose');
const platformTitle = document.querySelector('#platformTitle');
const platformArtist = document.querySelector('#platformArtist');
const spotifyLink = document.querySelector('#spotifyLink');
const youtubeLink = document.querySelector('#youtubeLink');
const appleLink = document.querySelector('#appleLink');

function closePlatformPanel() {
  platformPanel.hidden = true;
  platformBackdrop.hidden = true;
}

function openPlatformPanel(track) {
  const search = encodeURIComponent(`${track.trackName} ${track.artistName}`);
  platformTitle.textContent = track.trackName;
  platformArtist.textContent = track.artistName;
  spotifyLink.href = `https://open.spotify.com/search/${search}`;
  youtubeLink.href = `https://www.youtube.com/results?search_query=${search}`;
  appleLink.href = track.trackViewUrl;
  platformPanel.hidden = false;
  platformBackdrop.hidden = false;
  panelClose.focus();
}

function renderTracks(tracks, term) {
  results.innerHTML = tracks.map((track, index) => `
    <article class="track">
      <div class="art-wrap">
        <img class="art" src="${track.artworkUrl100.replace('100x100', '600x600')}" alt="Capa de ${track.collectionName}" loading="lazy">
        <span class="rank">${String(index + 1).padStart(2, '0')}</span>
      </div>
      <h3 title="${track.trackName}">${track.trackName}</h3>
      <p class="artist" title="${track.artistName}">${track.artistName}</p>
      <div class="meta"><span>${track.primaryGenreName || 'Música'}</span><a class="play" href="${track.trackViewUrl}" data-track-index="${index}">OUVIR ↗</a></div>
    </article>`).join('');
  title.textContent = `Resultados para “${term}”`;
  count.textContent = `${tracks.length} FAIXAS ENCONTRADAS`;
  status.textContent = '';
}

async function searchTracks(term) {
  button.disabled = true;
  button.textContent = 'BUSCANDO...';
  results.innerHTML = '';
  title.textContent = 'Procurando faixas';
  count.textContent = '';
  status.textContent = 'Consultando o acervo musical...';
  try {
    const response = await fetch(`/api/search?term=${encodeURIComponent(term)}`);
    if (!response.ok) throw new Error('Falha na busca');
    const tracks = await response.json();
    if (!tracks.length) {
      title.textContent = 'Nada encontrado';
      status.innerHTML = `Não encontramos faixas para <strong>“${term}”</strong>. Tente outra palavra.`;
      return;
    }
    renderTracks(tracks, term);
  } catch (error) {
    title.textContent = 'Busca indisponível';
    status.textContent = 'Não foi possível conectar ao catálogo agora. Confira sua internet e tente novamente.';
  } finally {
    button.disabled = false;
    button.textContent = 'BUSCAR FAIXAS';
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const term = queryInput.value.trim();
  if (term) searchTracks(term);
});

results.addEventListener('click', event => {
  const playLink = event.target.closest('.play');
  if (!playLink) return;
  event.preventDefault();
  const track = currentTracks[Number(playLink.dataset.trackIndex)];
  if (track) openPlatformPanel(track);
});

let currentTracks = [];
const originalRenderTracks = renderTracks;
renderTracks = (tracks, term) => {
  currentTracks = tracks;
  originalRenderTracks(tracks, term);
};

panelClose.addEventListener('click', closePlatformPanel);
platformBackdrop.addEventListener('click', closePlatformPanel);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !platformPanel.hidden) closePlatformPanel();
});
