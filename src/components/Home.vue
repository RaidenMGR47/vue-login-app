<template>
  <div>
    <h2>Estrenos de la semana</h2>
    <div v-if="movies.length === 0">No hay estrenos.</div>
    <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;">
      <MovieCard v-for="m in movies" :key="m.id" :movie="m" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { getMovies } from '../store.js';
import MovieCard from './MovieCard.vue';

const movies = ref(getMovies());
</script>
