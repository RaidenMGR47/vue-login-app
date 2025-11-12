import { reactive, computed } from 'vue';
import axios from 'axios';

// Configuración de la API base (ajusta según tu configuración de XAMPP)
const API_BASE = 'http://localhost/vue-login-app/backend/vue-cine-api';

// Cliente Axios configurado
const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  }
});

const state = reactive({
  users: [],
  movies: [],
  purchases: [],
  session: {
    username: null,
    isAdmin: false,
  },
});

// --- Funciones de API ---
async function apiCall(endpoint, data = null, method = 'GET') {
  try {
    const config = {
      method,
      url: endpoint
    };

    if (data) {
      if (method === 'GET') {
        config.params = data;
      } else {
        config.data = data;
      }
    }

    const response = await apiClient(config);
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// --- Funciones de carga inicial ---
async function loadInitialData() {
  try {
    // Cargar películas
    const moviesData = await apiCall('/movies.php');
    state.movies = moviesData.data?.movies || [];

  } catch (error) {
    console.error('Error loading initial data:', error);
    // Datos por defecto en caso de error
    state.movies = getSampleMovies();
  }
}

// Cargar datos iniciales al iniciar
loadInitialData();

function getSampleMovies() {
  return [
    {
      id: 'm1',
      title: 'Acción Extrema',
      year: 2025,
      genre: 'Acción',
      daysAvailable: ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'],
      price: 5.0,
      poster: 'https://placehold.co/400x600/333/FFF?text=Acción+Extrema'
    },
    {
      id: 'm2',
      title: 'Drama Nuevo',
      year: 2025,
      genre: 'Drama',
      daysAvailable: ['Lunes','Martes','Miércoles','Jueves','Viernes'],
      price: 4.0,
      poster: 'https://placehold.co/400x600/555/FFF?text=Drama+Nuevo'
    }
  ];
}

// --- API del Store (Funciones que modifican el estado) ---
export default {
  state: computed(() => state),

  // --- Películas (CRUD completo) ---
  async addMovie(movie) {
    try {
      const result = await apiCall('/movies.php', movie, 'POST');
      if (result.success) {
        state.movies.push(result.data.movie);
        return result.data.movie;
      }
      throw new Error(result.message || 'Error al añadir película');
    } catch (error) {
      console.error('Error adding movie:', error);
      throw error;
    }
  },

  getMovieById(id) {
    return state.movies.find(movie => movie.id === id) || null;
  },

  async updateMovie(updatedMovie) {
    try {
      const result = await apiCall('/movies.php', updatedMovie, 'PUT');
      if (result.success) {
        const index = state.movies.findIndex(movie => movie.id === updatedMovie.id);
        if (index !== -1) {
          state.movies[index] = updatedMovie;
        }
        return true;
      }
      throw new Error(result.message || 'Error al actualizar película');
    } catch (error) {
      console.error('Error updating movie:', error);
      throw error;
    }
  },

  async deleteMovie(id) {
    try {
      const result = await apiCall('/movies.php', { id }, 'DELETE');
      if (result.success) {
        state.movies = state.movies.filter(movie => movie.id !== id);
        return true;
      }
      throw new Error(result.message || 'Error al eliminar película');
    } catch (error) {
      console.error('Error deleting movie:', error);
      throw error;
    }
  },

  // --- Compras ---
  async addPurchase(purchase) {
    try {
      const result = await apiCall('/purchases.php', purchase, 'POST');
      if (result.success) {
        state.purchases.push(result.data.purchase);
        return result.data.purchase;
      }
      throw new Error(result.message || 'Error al registrar compra');
    } catch (error) {
      console.error('Error adding purchase:', error);
      throw error;
    }
  },

  async getPurchaseByCode(code) {
    try {
      const result = await apiCall('/purchases.php', { code });
      return result.data?.purchase || null;
    } catch (error) {
      console.error('Error fetching purchase:', error);
      return null;
    }
  },

  async getPurchasesForUser(username) {
    try {
      const result = await apiCall('/purchases.php', { username });
      return result.data?.purchases || [];
    } catch (error) {
      console.error('Error fetching user purchases:', error);
      return [];
    }
  },

  // --- Usuarios y Sesión ---
  async login(username, password) {
    try {
      const result = await apiCall('/auth.php', {
        username,
        password,
        action: 'login'
      }, 'POST');

      console.log('Login result:', result); // Para debug

      if (result.success) {
        // CORRECCIÓN CLAVE: Acceder correctamente a los datos
        state.session.username = username;
        state.session.isAdmin = result.data?.isAdmin || username === 'admin';
        console.log('Session after login:', state.session); // Para debug
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  },

  logout() {
    state.session.username = null;
    state.session.isAdmin = false;
  },

  async register(username, password) {
    try {
      if (!username || !password) throw new Error('Usuario o contraseña inválidos');

      const result = await apiCall('/auth.php', {
        username,
        password,
        action: 'register'
      }, 'POST');

      if (result.success) {
        return true;
      } else {
        throw new Error(result.message || 'Error en el registro');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  async removeCurrentUser() {
    try {
      const username = state.session.username;
      if (!username || username === 'admin') return false;

      const result = await apiCall('/auth.php', {
        username,
        action: 'delete'
      }, 'DELETE');

      if (result.success) {
        this.logout();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing user:', error);
      return false;
    }
  }
};
