import { reactive, computed } from 'vue';
import bcrypt from 'bcryptjs';

// --- Claves para LocalStorage ---
const MOVIES_KEY = 'vue_movies_v2';
const PURCHASES_KEY = 'vue_purchases_v2';
const USERS_KEY = 'vue_users_v2_hashed';

const state = reactive({
  users: load(USERS_KEY),
  movies: load(MOVIES_KEY),
  purchases: load(PURCHASES_KEY),
  session: {
    username: null,
    isAdmin: false,
  },
});

// --- Funciones de Carga y Guardado ---
function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data || []));
}

function load(key) {
  const raw = localStorage.getItem(key);
  try {
    const data = raw ? JSON.parse(raw) : [];
    if (key === USERS_KEY && (!data || data.length === 0)) {
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync('admin', salt);
        const adminUser = [{ username: 'admin', password: hashedPassword }];
        save(key, adminUser);
        return adminUser;
    }
    if (key === MOVIES_KEY && (!data || data.length === 0)) {
        const sampleMovies = getSampleMovies();
        save(key, sampleMovies);
        return sampleMovies;
    }
    return data;
  } catch {
    return [];
  }
}

function getSampleMovies() {
    return [
      { id: 'm1', title: 'Acción Extrema', year: 2025, genre: 'Acción', daysAvailable: ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'], price: 5.0 },
      { id: 'm2', title: 'Drama Nuevo', year: 2025, genre: 'Drama', daysAvailable: ['Lunes','Martes','Miércoles','Jueves','Viernes'], price: 4.0 }
    ];
}

// ... (Aquí irían los helpers de días, si los necesitas) ...

// --- API del Store (Funciones que modifican el estado) ---
export default {
  state: computed(() => state),

  // --- Películas (CRUD completo) ---
  addMovie(movie) {
    const newMovie = { ...movie, id: 'm' + Date.now() };
    state.movies.push(newMovie);
    save(MOVIES_KEY, state.movies);
    return newMovie;
  },
  getMovieById(id) {
    return state.movies.find(movie => movie.id === id) || null;
  },
  updateMovie(updatedMovie) {
    const index = state.movies.findIndex(movie => movie.id === updatedMovie.id);
    if (index !== -1) {
      state.movies[index] = updatedMovie;
      save(MOVIES_KEY, state.movies);
    }
  },
  deleteMovie(id) {
    state.movies = state.movies.filter(movie => movie.id !== id);
    save(MOVIES_KEY, state.movies);
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

  // --- Usuarios y Sesión (con hashing) ---
  login(username, password) {
    const user = state.users.find(u => u.username === username);
    if (!user) return false;
    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (passwordMatch) {
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
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    state.users.push({ username, password: hashedPassword });
    save(USERS_KEY, state.users);
    return true;
  },
  removeCurrentUser() {
      const username = state.session.username;
      if (!username || username === 'admin') return false;
      state.users = state.users.filter(u => u.username !== username);
      state.purchases = state.purchases.filter(p => p.username !== username);
      save(USERS_KEY, state.users);
      save(PURCHASES_KEY, state.purchases);
      this.logout();
      return true;
  }
};
