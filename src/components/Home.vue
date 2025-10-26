<template>
  <div>
    <h1 class="main-title">Estrenos de la Semana</h1>

    <!-- SECCIÓN DE ACCIONES (CONDICIONAL) -->
    <div class="actions-container">
      <!-- Mensaje y botones para usuarios logueados -->
      <div v-if="isLoggedIn" class="call-to-action">
        <h2>Bienvenido, {{ session.username }}</h2>
        <p>¿Qué te apetece hacer hoy?</p>
        <div class="action-buttons">
          <router-link to="/search" class="action-button primary">Buscar y Comprar</router-link>
          <router-link to="/receipt" class="action-button secondary">Ver Mis Recibos</router-link>
        </div>
      </div>

      <!-- Mensaje para visitantes (no logueados) -->
      <div v-else class="login-prompt">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
        <h2>Inicia sesión para una mejor experiencia</h2>
        <p>
          Debes <router-link to="/login">iniciar sesión</router-link> o
          <router-link to="/register">crear una cuenta</router-link> para poder comprar entradas y ver tu historial de recibos.
        </p>
      </div>
    </div>

    <!-- CUADRÍCULA DE PELÍCULAS -->
    <div v-if="movies.length > 0" class="movie-grid">
      <div v-for="movie in movies" :key="movie.id" class="movie-card">
        <img :src="movie.poster || defaultPoster" class="movie-poster" :alt="`Póster de ${movie.title}`">
        <div class="movie-info">
          <h3>{{ movie.title }}</h3>
          <p class="movie-details">{{ movie.genre }} • {{ movie.year }}</p>

          <!-- Botón de comprar SÓLO para usuarios logueados -->
          <router-link v-if="isLoggedIn" to="/search" class="buy-button-card">
            Comprar
          </router-link>
        </div>
      </div>
    </div>
    <p v-else>No hay estrenos disponibles en este momento.</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import store from '../store';

const movies = computed(() => store.state.value.movies);
const session = computed(() => store.state.value.session);

// Creamos una computada para saber fácilmente si el usuario está logueado
const isLoggedIn = computed(() => !!session.value.username);

const defaultPoster = 'https://placehold.co/400x600/666/FFF?text=Sin+Imagen';
</script>

<style scoped>
.main-title {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2.5em;
}

/* Contenedor de Acciones */
.actions-container {
  margin-bottom: 3rem;
}
.call-to-action, .login-prompt {
  text-align: center;
  padding: 2rem;
  border-radius: 12px;
  background-color: white;
  box-shadow: 0 8px 16px rgba(0,0,0,0.07);
}
.call-to-action h2 {
  margin-top: 0;
}
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}
.action-button {
  padding: 12px 25px;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  transition: transform 0.2s;
}
.action-button:hover {
  transform: translateY(-2px);
}
.action-button.primary {
  background-color: #007BFF;
  color: white;
}
.action-button.secondary {
  background-color: #f0f0f0;
  color: #333;
}

/* Mensaje para Iniciar Sesión */
.login-prompt {
  border: 2px dashed #007BFF;
  background-color: #f0f7ff;
}
.login-prompt svg {
  color: #007BFF;
  margin-bottom: 1rem;
}
.login-prompt h2 {
  color: #0056b3;
  margin-top: 0;
}
.login-prompt a {
  font-weight: 600;
  color: #007BFF;
}

/* Estilos de la Cuadrícula de Películas (ajustados) */
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
}
.movie-poster {
  width: 100%;
  height: 330px;
  object-fit: cover;
}
.movie-info {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1; /* Esto es clave para que el botón se vaya al fondo */
}
.movie-info h3 {
  margin: 0 0 0.5rem 0;
}
.movie-details {
  color: #555;
  flex-grow: 1; /* Ocupa el espacio disponible, empujando el botón hacia abajo */
}
.buy-button-card {
  display: block;
  text-align: center;
  background-color: #28a745;
  color: white;
  padding: 10px;
  border-radius: 5px;
  text-decoration: none;
  margin-top: 1rem; /* Espacio por encima del botón */
  transition: background-color 0.2s;
}
.buy-button-card:hover {
  background-color: #218838;
}
</style>
