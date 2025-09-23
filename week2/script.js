
// --- UI bootstrap ---
window.addEventListener('load', async () => {
  const result = document.getElementById('result');
  try {
    result.textContent = 'Loading data...';
    await loadData();               // from data.js -> fills global `movies`
    populateMoviesDropdown();
    result.textContent = 'Select a movie and click "Get Recommendations".';
    result.className = '';
  } catch (e) {
    console.error(e);
    result.textContent = 'Failed to load data.';
    result.className = 'error';
  }
});

// --- Populate dropdown ---
function populateMoviesDropdown() {
  const select = document.getElementById('movie-select');
  while (select.options.length > 1) select.remove(1);

  const sorted = [...movies].sort((a,b)=>a.title.localeCompare(b.title));
  for (const m of sorted) {
    const opt = document.createElement('option');
    opt.value = String(m.id);
    opt.innerText = m.title;
    select.appendChild(opt);
  }
}

// --- Cosine similarity on binary genre sets ---
// Input: arrays of genre names (strings), e.g., ["Comedy","Romance"]
function cosineSimilarity(genresA, genresB) {
  if (!genresA || !genresB || genresA.length === 0 || genresB.length === 0) return 0;
  const setA = new Set(genresA);
  const setB = new Set(genresB);
  let intersectionSize = 0;
  for (const g of setA) if (setB.has(g)) intersectionSize++;
  // For binary vectors, cosine = |A ∩ B| / sqrt(|A| * |B|)
  const denom = Math.sqrt(setA.size * setB.size);
  return denom === 0 ? 0 : intersectionSize / denom;
}

// --- Main: get recommendations ---
function getRecommendations() {
  const result = document.getElementById('result');
  try {
    const select = document.getElementById('movie-select');
    const selectedId = parseInt(select.value, 10);
    if (Number.isNaN(selectedId)) {
      result.innerText = 'Please select a movie first.';
      result.className = 'error';
      return;
    }

    const likedMovie = movies.find(m => m.id === selectedId);
    if (!likedMovie) {
      result.innerText = 'Selected movie not found in dataset.';
      result.className = 'error';
      return;
    }

    // Compute cosine similarity to all other movies
    const scored = [];
    for (const m of movies) {
      if (m.id === likedMovie.id) continue;
      const score = cosineSimilarity(likedMovie.genres, m.genres);
      if (score > 0) scored.push({ ...m, score });
    }

    scored.sort((a,b)=> b.score - a.score);
    const topK = scored.slice(0, 10);

    if (topK.length === 0) {
      result.innerText = `No recommendations found for "${likedMovie.title}".`;
      result.className = 'error';
      return;
    }

    // Render
    const lines = topK.map((m,i)=> `${i+1}. ${m.title} (score: ${m.score.toFixed(3)})`);
    result.innerText = `You liked: "${likedMovie.title}"\n\nTop recommendations (cosine similarity):\n` + lines.join('\n');
    result.className = 'success';
  } catch (e) {
    console.error('Error in getRecommendations', e);
    result.innerText = 'An unexpected error occurred.';
    result.className = 'error';
  }
}
