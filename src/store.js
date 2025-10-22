// ...existing code...
const MOVIES_KEY = 'vue_movies_v1';
const PURCHASES_KEY = 'vue_purchases_v1';
const USERS_KEY = 'vue_users_v1';

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

// ...existing code...

/* Helpers for days */
const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function daysFromNumber(n) {
  const count = Math.max(0, Math.min(7, Number(n) || 0));
  return WEEK_DAYS.slice(0, count);
}

function normalizeDaysAvailable(movieOrDays) {
  // Accept either the whole movie object or a direct value
  const val = (movieOrDays && movieOrDays.daysAvailable !== undefined) ? movieOrDays.daysAvailable : movieOrDays;

  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'number') return daysFromNumber(val);
  if (typeof val === 'string') {
    const s = val.trim();
    if (s === '') return [];
    if (s.includes(',')) return s.split(',').map(x => x.trim());
    const num = parseInt(s, 10);
    if (!isNaN(num)) return daysFromNumber(num);
    return [s];
  }
  return [];
}

/* Movies */
export function loadMovies() {
  const movies = load(MOVIES_KEY);
  if (!movies || movies.length === 0) {
    const sample = [
      {
        id: 'm1',
        title: 'Acción Extrema',
        year: 2025,
        genre: 'Acción',
        daysAvailable: ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'],
        price: 5.0
      },
      {
        id: 'm2',
        title: 'Drama Nuevo',
        year: 2025,
        genre: 'Drama',
        daysAvailable: ['Lunes','Martes','Miércoles','Jueves','Viernes'],
        price: 4.0
      }
    ];
    save(MOVIES_KEY, sample);
    return sample;
  }
  // Normalizar datos existentes (si vienen como número o string)
  movies.forEach(m => {
    m.daysAvailable = normalizeDaysAvailable(m);
  });
  return movies;
}

export function getMovies() {
  // usar la función que aplica seed y normaliza días
  return loadMovies();
}

export function addMovie(movie) {
  const movies = load(MOVIES_KEY);
  movie.id = 'm' + Date.now() + Math.floor(Math.random() * 900);
  // Normalizar daysAvailable antes de guardar
  movie.daysAvailable = normalizeDaysAvailable(movie);
  movies.push(movie);
  save(MOVIES_KEY, movies);
  return movie;
}

// ...existing code...

/* Purchases */
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

export function removePurchasesForUser(username) {
  const purchases = load(PURCHASES_KEY);
  const remaining = purchases.filter(p => p.username !== username);
  save(PURCHASES_KEY, remaining);
  return true;
}

/* Users (seed admin if none) */
export function getUsers() {
  let users = load(USERS_KEY);
  if (!users || users.length === 0) {
    // seed default administrator (username: admin, password: admin)
    users = [{ username: 'admin', password: 'admin' }];
    save(USERS_KEY, users);
  }
  return users;
}

export function getUser(username) {
  const users = getUsers();
  return users.find(u => u.username === username) || null;
}

export function addUser(user) {
  // user: { username, password }
  if (!user || !user.username) throw new Error('Usuario inválido');
  const users = getUsers();
  const exists = users.find(u => u.username === user.username);
  if (exists) return false; // ya existe
  users.push({ username: user.username, password: String(user.password) });
  save(USERS_KEY, users);
  return true;
}

export function removeUser(username) {
  if (!username) return false;
  // nunca permitir eliminar la cuenta admin
  if (String(username).toLowerCase() === 'admin') return false;
  const users = getUsers();
  const remaining = users.filter(u => u.username !== username);
  save(USERS_KEY, remaining);
  return true;
}

export function authenticateUser(username, password) {
  if (!username) return false;
  const users = getUsers();
  const u = users.find(x => x.username === username);
  if (!u) return false;
  return String(u.password) === String(password);
}

/* Helpers */
function generateCode() {
  const r = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TCK-${Date.now().toString(36).toUpperCase()}-${r}`;
}
