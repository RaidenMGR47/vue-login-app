<template>
  <div>
    <h1 class="main-title">Estrenos de la Semana</h1>

    <!-- CUADRÍCULA DE PELÍCULAS -->
    <div v-if="movies.length > 0" class="movie-grid">
      <div v-for="movie in movies" :key="movie.id" class="movie-card">
        <img :src="movie.poster || defaultPoster" class="movie-poster" :alt="`Póster de ${movie.title}`">
        <div class="movie-info">
          <h3>{{ movie.title }}</h3>
          <p class="movie-details">{{ movie.genre }} • {{ movie.year }}</p>
          <p class="movie-price"><strong>${{ movie.price.toFixed(2) }}</strong></p>

          <!-- Información de salas disponibles -->
          <div class="hall-availability">
            <template v-if="getAvailableHalls(movie.id).length > 0">
              <p class="halls-available">
                <strong>🎬 Salas:</strong> {{ getAvailableHalls(movie.id).join(', ') }}
              </p>
            </template>
            <template v-else>
              <p class="no-halls">
                <strong>⚠️ No hay salas disponibles</strong>
              </p>
            </template>
          </div>

          <!-- Botón de comprar SÓLO para usuarios logueados -->
          <router-link v-if="isLoggedIn" to="/search" class="buy-button-card">
            Comprar Entradas
          </router-link>
          <div v-else class="login-prompt-small">
            <router-link to="/login">Inicia sesión</router-link> para comprar
          </div>
        </div>
      </div>
    </div>
    <p v-else>No hay estrenos disponibles en este momento.</p>
  </div>
</template>

<script setup>
defineOptions({ name: 'HomeView' });

import { computed, onMounted } from 'vue';
import store from '../store';

const movies = computed(() => store.state.value.movies);
const session = computed(() => store.state.value.session);
const screenings = computed(() => store.state.value.screenings);
const halls = computed(() => store.state.value.halls);

// Creamos una computada para saber fácilmente si el usuario está logueado
const isLoggedIn = computed(() => !!session.value.username);

const defaultPoster = 'https://placehold.co/400x600/666/FFF?text=Sin+Imagen';

// Cargar screenings y halls al montar el componente
onMounted(() => {
  store.fetchScreenings();
  store.fetchHalls();
});

// Función para obtener las salas disponibles para una película
function getAvailableHalls(movieId) {
  // Obtener todos los screenings de esta película
  const movieScreenings = screenings.value.filter(s => s.movieId === movieId);

  if (movieScreenings.length === 0) {
    return [];
  }

  // Obtener IDs únicos de salas
  const hallIds = [...new Set(movieScreenings.map(s => s.hallId))];

  // Obtener los nombres de las salas
  return hallIds.map(hallId => {
    const hall = halls.value.find(h => h.id === hallId);
    return hall ? hall.name : null;
  }).filter(name => name !== null);
}
</script>

<style scoped>
.main-title {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2.5em;
  color: #2c3e50;
}

/* Estilos de la Cuadrícula de Películas - TAMAÑO ORIGINAL */
.movie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
}

.movie-card {
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
  background: white;
}

.movie-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
}

/* TAMAÑO ORIGINAL DE LAS PORTADAS - 330px de altura */
.movie-poster {
  width: 100%;
  height: 330px; /* Tamaño original */
  object-fit: cover;
}

.movie-info {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.movie-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.2em;
  color: #2c3e50;
  line-height: 1.3;
}

.movie-details {
  color: #555;
  margin-bottom: 0.5rem;
  flex-grow: 1;
}

.movie-price {
  color: #27ae60;
  font-size: 1.1em;
  margin-bottom: 1rem;
}

.hall-availability {
  margin-bottom: 1rem;
  padding: 0.5rem;
  border-radius: 5px;
  background-color: #f8f9fa;
}

.halls-available {
  margin: 0;
  color: #28a745;
  font-size: 0.9em;
  line-height: 1.4;
}

.no-halls {
  margin: 0;
  color: #ff8c00;
  font-size: 0.9em;
  line-height: 1.4;
}

.buy-button-card {
  display: block;
  text-align: center;
  background-color: #28a745;
  color: white;
  padding: 10px;
  border-radius: 5px;
  text-decoration: none;
  margin-top: auto;
  transition: background-color 0.2s;
}

.buy-button-card:hover {
  background-color: #218838;
  color: white;
}

.login-prompt-small {
  text-align: center;
  color: #6c757d;
  font-size: 0.9em;
  margin-top: auto;
  padding: 0.5rem;
}

.login-prompt-small a {
  color: #007BFF;
  text-decoration: none;
  font-weight: 600;
}

.login-prompt-small a:hover {
  text-decoration: underline;
}
</style>
