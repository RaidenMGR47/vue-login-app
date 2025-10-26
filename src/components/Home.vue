<template>
  <div>
    <h1>Estrenos de la Semana</h1>

    <div v-if="movies.length > 0" class="movie-grid">
      <div v-for="movie in movies" :key="movie.id" class="movie-card">
        <img :src="movie.poster || defaultPoster" class="movie-poster" :alt="`Póster de ${movie.title}`">
        <div class="movie-info">
          <h3>{{ movie.title }}</h3>
          <p>{{ movie.genre }} • {{ movie.year }}</p>
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
const defaultPoster = 'https://placehold.co/400x600/666/FFF?text=Sin+Imagen';
</script>

<style scoped>
/* Puedes copiar los estilos de .movie-grid, .movie-card, etc. de SearchMovie.vue aquí */
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
}
.movie-poster {
  width: 100%;
  height: 330px;
  object-fit: cover;
}
.movie-info {
  padding: 1rem;
}
.movie-info h3 {
  margin: 0;
}
</style>
