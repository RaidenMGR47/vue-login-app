<template>
  <div>
    <h1>Gestionar Películas</h1>
    <router-link to="/add-movie" class="add-button">Añadir Nueva Película</router-link>

    <div v-if="movies.length > 0" class="movies-table-container">
      <table class="movies-table">
        <thead>
          <tr>
            <th>Póster</th>
            <th>Título</th>
            <th>Año</th>
            <th>Género</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="movie in movies" :key="movie.id">
            <td>
              <img :src="movie.poster || defaultPoster" class="poster-thumbnail" alt="Póster">
            </td>
            <td>{{ movie.title }}</td>
            <td>{{ movie.year }}</td>
            <td>{{ movie.genre }}</td>
            <td>
              <div class="actions">
                <!-- Enlace a la página de edición -->
                <router-link :to="{ name: 'editMovie', params: { id: movie.id } }" class="action-btn edit">Editar</router-link>
                <button @click="confirmDelete(movie)" class="action-btn delete">Eliminar</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else>No hay películas para gestionar. ¡Añade una!</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import store from '../store';

const movies = computed(() => store.state.value.movies);
const defaultPoster = 'https://placehold.co/100x150/666/FFF?text=N/A';

function confirmDelete(movie) {
  if (window.confirm(`¿Estás seguro de que quieres eliminar la película "${movie.title}"?`)) {
    store.deleteMovie(movie.id);
  }
}
</script>

<style scoped>
.add-button {
  display: inline-block;
  margin-bottom: 2rem;
  padding: 10px 15px;
  background-color: #28a745;
  color: white;
  text-decoration: none;
  border-radius: 5px;
}
.movies-table-container {
  overflow-x: auto;
}
.movies-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 4px 8px rgba(0,0,0,0.05);
}
.movies-table th, .movies-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #ddd;
  text-align: left;
}
.movies-table th {
  background-color: #f4f7f9;
}
.poster-thumbnail {
  width: 60px;
  height: 90px;
  object-fit: cover;
  border-radius: 4px;
}
.actions {
  display: flex;
  gap: 10px;
}
.action-btn {
  padding: 8px 12px;
  border-radius: 5px;
  text-decoration: none;
  color: white;
  border: none;
  cursor: pointer;
}
.edit { background-color: #007BFF; }
.delete { background-color: #dc3545; }
</style>
