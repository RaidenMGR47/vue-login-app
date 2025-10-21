const MOVIES_KEY = 'vue_movies_v1';
const PURCHASES_KEY = 'vue_purchases_v1';

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data || []));
}

function load(key) {
  const raw = localStorage.getItem(key);
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function loadMovies() {
  const movies = load(MOVIES_KEY);
  if (!movies || movies.length === 0) {
    // datos iniciales de ejemplo
    const sample = [
      { id: 'm1', title: 'Acción Extrema', year: 2025, genre: 'Acción', daysAvailable: 7, price: 5.0 },
      { id: 'm2', title: 'Drama Nuevo', year: 2025, genre: 'Drama', daysAvailable: 5, price: 4.0 }
    ];
    save(MOVIES_KEY, sample);
    return sample;
  }
  return movies;
}

export function getMovies() {
  return load(MOVIES_KEY);
}

export function addMovie(movie) {
  const movies = load(MOVIES_KEY);
  movie.id = 'm' + Date.now() + Math.floor(Math.random() * 900);
  movies.push(movie);
  save(MOVIES_KEY, movies);
  return movie;
}

export function addPurchase(purchase) {
  const purchases = load(PURCHASES_KEY);
  purchase.code = generateCode();
  purchase.datePurchased = new Date().toISOString();
  purchases.push(purchase);
  save(PURCHASES_KEY, purchases);
  return purchase;
}

export function getPurchaseByCode(code) {
  const purchases = load(PURCHASES_KEY);
  return purchases.find(p => p.code === code) || null;
}

export function getPurchasesForUser(username) {
  const purchases = load(PURCHASES_KEY);
  return purchases.filter(p => p.username === username);
}

function generateCode() {
  const r = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TCK-${Date.now().toString(36).toUpperCase()}-${r}`;
}
