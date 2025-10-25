<template>
  <div class="home-container">
    <h2>Estrenos de la semana</h2>

    <!-- Contenedor para las películas, se muestra solo si hay películas -->
    <div v-if="movies && movies.length > 0" class="movie-grid">
      <!--
        Iteramos sobre la lista reactiva de películas.
        - :movie="movie" pasa los datos de cada película al componente MovieCard.
        - :key="movie.id" es una clave única necesaria para que Vue optimice la lista.
      -->
      <MovieCard
        v-for="movie in movies"
        :key="movie.id"
        :movie="movie"
      />
    </div>

    <!-- Mensaje que se muestra si no hay películas en la lista -->
    <p v-else class="no-movies">
      No hay estrenos disponibles en este momento.
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue';
// 1. Importamos el store completo, no una función específica.
import store from '../store';
// 2. Importamos el componente que usaremos para mostrar cada película.
import MovieCard from './MovieCard.vue';

// 3. Creamos una referencia reactiva a la lista de películas del store.
//    'computed' asegura que esta variable se actualizará automáticamente
//    si la lista en 'store.state.value.movies' cambia.
const movies = computed(() => store.state.value.movies);
</script>

<style scoped>
/* 'scoped' significa que estos estilos solo se aplican a este componente */

.home-container h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #2c3e50;
}

.movie-grid {
  display: grid;
  /* Crea columnas flexibles que se adaptan al espacio disponible */
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 25px; /* Espacio entre las tarjetas de películas */
}

.no-movies {
  text-align: center;
  color: #6c757d;
  font-size: 1.2rem;
  margin-top: 3rem;
}
</style>
