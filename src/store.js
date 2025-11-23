import { reactive, computed } from 'vue'
import axios from 'axios'

// Configuración de la API base (ajusta según tu configuración de XAMPP)
const API_BASE = 'http://localhost/vue-login-app/backend/vue-cine-api'

// Cliente Axios configurado
const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

const state = reactive({
  users: [],
  movies: [],
  purchases: [],
  halls: [], // Salas de cine
  screenings: [], // Funciones programadas
  session: {
    username: null,
    isAdmin: false,
    avatar: null,
  },
})

// --- Funciones de API ---
async function apiCall(endpoint, data = null, method = 'GET') {
  try {
    const config = {
      method,
      url: endpoint,
    }

    if (data) {
      if (method === 'GET') {
        config.params = data
      } else {
        config.data = data
      }
    }

    const response = await apiClient(config)
    return response.data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

// --- Funciones de carga inicial ---
async function loadInitialData() {
  try {
    // Cargar películas
    const moviesData = await apiCall('/movies.php')
    state.movies = moviesData.data?.movies || []
  } catch (error) {
    console.error('Error loading initial data:', error)
    // Datos por defecto en caso de error
    state.movies = getSampleMovies()
  }
}

// Cargar datos iniciales al iniciar
loadInitialData()

function getSampleMovies() {
  return [
    {
      id: 'm1',
      title: 'Acción Extrema',
      year: 2025,
      genre: 'Acción',
      duration: 120,
      daysAvailable: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
      price: 5.0,
      poster: 'https://placehold.co/400x600/333/FFF?text=Acción+Extrema',
    },
    {
      id: 'm2',
      title: 'Drama Nuevo',
      year: 2025,
      genre: 'Drama',
      duration: 105,
      daysAvailable: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
      price: 4.0,
      poster: 'https://placehold.co/400x600/555/FFF?text=Drama+Nuevo',
    },
  ]
}

// --- API del Store (Funciones que modifican el estado) ---
export default {
  state: computed(() => state),

  // --- Películas (CRUD completo) ---
  async addMovie(movie) {
    try {
      const result = await apiCall('/movies.php', movie, 'POST')
      if (result.success) {
        state.movies.push(result.data.movie)
        return result.data.movie
      }
      throw new Error(result.message || 'Error al añadir película')
    } catch (error) {
      console.error('Error adding movie:', error)
      throw error
    }
  },

  getMovieById(id) {
    return state.movies.find((movie) => movie.id === id) || null
  },

  async updateMovie(updatedMovie) {
    try {
      const result = await apiCall('/movies.php', updatedMovie, 'PUT')
      if (result.success) {
        const index = state.movies.findIndex((movie) => movie.id === updatedMovie.id)
        if (index !== -1) {
          state.movies[index] = updatedMovie
        }
        return true
      }
      throw new Error(result.message || 'Error al actualizar película')
    } catch (error) {
      console.error('Error updating movie:', error)
      throw error
    }
  },

  async deleteMovie(id) {
    try {
      const result = await apiCall('/movies.php', { id }, 'DELETE')
      if (result.success) {
        state.movies = state.movies.filter((movie) => movie.id !== id)
        return true
      }
      throw new Error(result.message || 'Error al eliminar película')
    } catch (error) {
      console.error('Error deleting movie:', error)
      throw error
    }
  },

  // --- Salas (Halls) ---
  async fetchHalls() {
    try {
      const result = await apiCall('/halls.php');
      if (result.success) {
        state.halls = result.data.halls || [];
        return state.halls;
      }
      return [];
    } catch (error) {
      console.error('Error fetching halls:', error);
      return [];
    }
  },

  async addHall(hall) {
    try {
      const result = await apiCall('/halls.php', hall, 'POST')
      if (result.success) {
        state.halls.push(result.data.hall)
        return result.data.hall
      }
      throw new Error(result.message || 'Error al añadir sala')
    } catch (error) {
      console.error('Error adding hall:', error)
      throw error
    }
  },

  async deleteHall(id) {
    try {
      const result = await apiCall('/halls.php', { id }, 'DELETE')
      if (result.success) {
        state.halls = state.halls.filter((h) => h.id !== id)
        return true
      }
      throw new Error(result.message || 'Error al eliminar sala')
    } catch (error) {
      console.error('Error deleting hall:', error)
      throw error
    }
  },

  // --- Funciones (Screenings) ---
  async fetchScreenings() {
    try {
      const result = await apiCall('/screenings.php')
      if (result.success) {
        state.screenings = result.data.screenings || []
        return state.screenings
      }
      return []
    } catch (error) {
      console.error('Error fetching screenings:', error)
      return []
    }
  },

  async addScreening(screening) {
    try {
      // Validación de conflictos antes de enviar (opcional, el backend también valida)
      const conflict = this.checkSchedulingConflict(
        screening.hallId,
        screening.startTime,
        screening.duration,
      )
      if (conflict) {
        throw new Error('Conflicto de horario: Ya existe una función en esta sala a esta hora.')
      }

      const result = await apiCall('/screenings.php', screening, 'POST')
      if (result.success) {
        state.screenings.push(result.data.screening)
        return result.data.screening
      }
      throw new Error(result.message || 'Error al programar la función')
    } catch (error) {
      console.error('Error adding screening:', error)
      throw error
    }
  },

  checkSchedulingConflict(hallId, newStartTimeStr, durationMinutes) {
    const newStart = new Date(newStartTimeStr)
    const newEnd = new Date(newStart.getTime() + durationMinutes * 60000)

    return state.screenings.some((s) => {
      if (s.hallId !== hallId) return false

      const existingStart = new Date(s.startTime)
      const existingEnd = new Date(existingStart.getTime() + s.duration * 60000)

      // Verificar superposición estricta
      // (StartA < EndB) and (EndA > StartB)
      return (
        newStart.getTime() < existingEnd.getTime() && newEnd.getTime() > existingStart.getTime()
      )
    })
  },

  // --- Compras ---
  async addPurchase(purchase) {
    try {
      const result = await apiCall('/purchases.php', purchase, 'POST')
      if (result.success) {
        state.purchases.push(result.data.purchase)
        return result.data.purchase
      }
      throw new Error(result.message || 'Error al registrar compra')
    } catch (error) {
      console.error('Error adding purchase:', error)
      throw error
    }
  },

  async getPurchaseByCode(code) {
    try {
      const result = await apiCall('/purchases.php', { code })
      return result.data?.purchase || null
    } catch (error) {
      console.error('Error fetching purchase:', error)
      return null
    }
  },

  async getPurchasesForUser(username) {
    try {
      const result = await apiCall('/purchases.php', { username })
      return result.data?.purchases || []
    } catch (error) {
      console.error('Error fetching user purchases:', error)
      return []
    }
  },

  async fetchAdminStats() {
    try {
      const result = await apiCall('/stats.php')
      if (result.success) {
        return result.stats
      }
      throw new Error(result.message || 'Error al obtener estadísticas')
    } catch (error) {
      console.error('Error fetching admin stats:', error)
      throw error
    }
  },

  // --- Usuarios y Sesión ---
  async login(username, password) {
    try {
      const result = await apiCall(
        '/auth.php',
        {
          username,
          password,
          action: 'login',
        },
        'POST',
      )

      console.log('Login result:', result) // Para debug

      if (result.success) {
        // CORRECCIÓN CLAVE: Acceder correctamente a los datos
        state.session.username = username
        state.session.isAdmin = result.data?.isAdmin || username === 'admin'
        // Normalizar avatar: si viene como ruta relativa, convertir a URL completa
        const returnedAvatar = result.data?.avatar || null
        if (returnedAvatar) {
          if (returnedAvatar.startsWith('http') || returnedAvatar.startsWith('data:')) {
            state.session.avatar = returnedAvatar
          } else {
            state.session.avatar = API_BASE + '/' + returnedAvatar
          }
        } else {
          state.session.avatar = null
        }
        console.log('Session after login:', state.session) // Para debug
        return true
      }
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  },

  logout() {
    state.session.username = null
    state.session.isAdmin = false
    state.session.avatar = null
  },

  async register(username, password) {
    try {
      if (!username || !password) throw new Error('Usuario o contraseña inválidos')

      const result = await apiCall(
        '/auth.php',
        {
          username,
          password,
          action: 'register',
        },
        'POST',
      )

      if (result.success) {
        return true
      } else {
        throw new Error(result.message || 'Error en el registro')
      }
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  },

  async updateAvatar(avatarData) {
    try {
      const username = state.session.username
      if (!username) throw new Error('No user logged in')

      const result = await apiCall(
        '/auth.php',
        {
          username,
          avatar: avatarData,
          action: 'updateAvatar',
        },
        'POST',
      )

      if (result.success) {
        state.session.avatar = avatarData
        return true
      }
      throw new Error(result.message || 'Error updating avatar')
    } catch (error) {
      console.error('Error updating avatar:', error)
      throw error
    }
  },

  async changePassword(currentPassword, newPassword, confirmPassword) {
    try {
      const username = state.session.username
      if (!username) throw new Error('No user logged in')

      if (!currentPassword || !newPassword) throw new Error('Campos de contraseña requeridos')
      if (newPassword !== confirmPassword) throw new Error('Las contraseñas no coinciden')
      if (newPassword.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres')

      const result = await apiCall(
        '/auth.php',
        {
          action: 'changePassword',
          username,
          currentPassword,
          newPassword,
        },
        'POST',
      )

      if (result.success) {
        return true
      }
      throw new Error(result.message || 'Error al cambiar la contraseña')
    } catch (error) {
      console.error('changePassword error:', error)
      throw error
    }
  },

  async uploadAvatar(file) {
    try {
      const username = state.session.username
      if (!username) throw new Error('No user logged in')

      const form = new FormData()
      form.append('username', username)
      form.append('avatar', file)

      // Usamos apiClient pero pasamos formData; axios detecta multipart
      const response = await apiClient.post('/upload_avatar.php', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      if (response.data && response.data.success) {
        // Construimos valor final del avatar (puede venir como data URI o path)
        const avatarPath = response.data.data?.avatar || response.data.avatar
        let finalAvatar = null
        if (typeof avatarPath === 'string') {
          if (avatarPath.startsWith('http') || avatarPath.startsWith('data:')) {
            finalAvatar = avatarPath
          } else {
            finalAvatar = API_BASE + '/' + avatarPath
          }
        }
        state.session.avatar = finalAvatar
        return { ok: true, avatar: finalAvatar }
      }
      return { ok: false, message: response.data?.message || 'Error' }
    } catch (error) {
      console.error('uploadAvatar error:', error)
      throw error
    }
  },

  async removeCurrentUser() {
    try {
      const username = state.session.username
      if (!username || username === 'admin') return false

      const result = await apiCall(
        '/auth.php',
        {
          username,
          action: 'delete',
        },
        'DELETE',
      )

      if (result.success) {
        this.logout()
        return true
      }
      return false
    } catch (error) {
      console.error('Error removing user:', error)
      return false
    }
  },
}
