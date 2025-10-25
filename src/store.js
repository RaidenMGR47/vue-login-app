import { reactive, computed } from 'vue';

// --- Claves para LocalStorage (se recomienda cambiar la versión para evitar conflictos con datos antiguos) ---
const MOVIES_KEY = 'vue_movies_v2';
const PURCHASES_KEY = 'vue_purchases_v2';
const USERS_KEY = 'vue_users_v2';

// --- Estado Reactivo Centralizado ---
// Usamos reactive() para que Vue pueda rastrear los cambios en estos objetos.
// El estado se carga una sola vez al iniciar la aplicación.
const state = reactive({
  users: load(USERS_KEY),
  movies: load(MOVIES_KEY),
  purchases: load(PURCHASES_KEY),
  // El estado de la sesión NO se guarda en localStorage, es temporal.
  session: {
    username: null,
    isAdmin: false,
  },
});

// --- Funciones de Carga y Guardado (con valores iniciales) ---
function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data || []));
}

function load(key) {
  const raw = localStorage.getItem(key);
  try {
    const data = raw ? JSON.parse(raw) : [];

    // Si la llave es de películas y no hay datos, creamos datos de ejemplo.
    if (key === MOVIES_KEY && (!data || data.length === 0)) {
        const sampleMovies = getSampleMovies();
        save(key, sampleMovies); // Guardamos los datos de ejemplo
        return sampleMovies;
    }
    // Si la llave es de usuarios y no hay datos, creamos el admin.
    if (key === USERS_KEY && (!data || data.length === 0)) {
        // ADVERTENCIA: Contraseña en texto plano solo para fines de demostración. NUNCA hacer esto en producción.
        const adminUser = [{ username: 'admin', password: 'admin' }];
        save(key, adminUser); // Guardamos el admin
        return adminUser;
    }
    return data;
  } catch {
    return []; // Si hay un error de parseo, devolvemos un array vacío.
  }
}

function getSampleMovies() {
    return [
      { id: 'm1', title: 'Acción Extrema', year: 2025, genre: 'Acción', daysAvailable: ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'], price: 5.0 },
      { id: 'm2', title: 'Drama Nuevo', year: 2025, genre: 'Drama', daysAvailable: ['Lunes','Martes','Miércoles','Jueves','Viernes'], price: 4.0 }
    ];
}

// --- Helpers de Días (sin cambios, pero necesarios) ---
const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
function daysFromNumber(n) {
  const count = Math.max(0, Math.min(7, Number(n) || 0));
  return WEEK_DAYS.slice(0, count);
}

function normalizeDaysAvailable(movieOrDays) {
  const val = (movieOrDays && movieOrDays.daysAvailable !== undefined) ? movieOrDays.daysAvailable : movieOrDays;
  if (Array.isArray(val) && val.length > 0) return val.map(String);
  if (Array.isArray(val) && val.length === 0) return WEEK_DAYS; // Si está vacío, disponible todos los días
  if (typeof val === 'number') return daysFromNumber(val);
  if (typeof val === 'string') {
    const s = val.trim();
    if (s === '') return WEEK_DAYS;
    if (s.includes(',')) return s.split(',').map(x => x.trim());
    const num = parseInt(s, 10);
    if (!isNaN(num)) return daysFromNumber(num);
    return [s];
  }
  return WEEK_DAYS; // Por defecto, todos los días
}

// --- API del Store (Funciones que modifican el estado) ---
// La clave es que ahora exportamos un ÚNICO objeto por defecto.
export default {
  // Exponemos el estado de forma reactiva y de solo lectura para los componentes
  state: computed(() => state),

  // --- Películas ---
  addMovie(movie) {
    const newMovie = {
      ...movie,
      id: 'm' + Date.now(),
      daysAvailable: normalizeDaysAvailable(movie.daysAvailable)
    };
    state.movies.push(newMovie); // Modificamos el estado reactivo
    save(MOVIES_KEY, state.movies); // Persistimos en localStorage
    return newMovie;
  },

  // --- Compras ---
  addPurchase(purchase) {
    const newPurchase = {
        ...purchase,
        code: `TCK-${Date.now().toString(36).toUpperCase()}`,
        datePurchased: new Date().toISOString()
    };
    state.purchases.push(newPurchase);
    save(PURCHASES_KEY, state.purchases);
    return newPurchase;
  },
  getPurchaseByCode: (code) => state.purchases.find(p => p.code === code) || null,
  getPurchasesForUser: (username) => state.purchases.filter(p => p.username === username).sort((a, b) => new Date(b.datePurchased) - new Date(a.datePurchased)),

  // --- Usuarios y Sesión ---
  login(username, password) {
    const user = state.users.find(u => u.username === username);
    if (user && user.password === password) { // Comprobación insegura
        state.session.username = username;
        state.session.isAdmin = username === 'admin';
        return true;
    }
    return false;
  },
  logout() {
    state.session.username = null;
    state.session.isAdmin = false;
  },
  register(username, password) {
    if (!username || !password) throw new Error('Usuario o contraseña inválidos');
    const exists = state.users.some(u => u.username === username);
    if (exists) return false;
    state.users.push({ username, password });
    save(USERS_KEY, state.users);
    return true;
  },
  removeCurrentUser() {
      const username = state.session.username;
      if (!username || username === 'admin') return false;

      // Eliminar usuario y sus compras
      state.users = state.users.filter(u => u.username !== username);
      state.purchases = state.purchases.filter(p => p.username !== username);

      save(USERS_KEY, state.users);
      save(PURCHASES_KEY, state.purchases);

      this.logout(); // Cierra la sesión
      return true;
  }
};
