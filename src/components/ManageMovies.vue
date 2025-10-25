<template>
  <div class="manage-container">
    <div class="header">
      <h2>Gestionar Películas</h2>
      <router-link to="/add-movie" class="add-button">Añadir Nueva Película</router-link>
    </div>

    <div v-if="movies.length > 0" class="movies-table">
      <table>
        <thead>
          <tr>
            <th>Título</th>
            <th>Año</th>
            <th>Género</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="movie in movies" :key="movie.id">
            <td>{{ movie.title }}</td>
            <td>{{ movie.year }}</td>
            <td>{{ movie.genre }}</td>
            <td class="actions">
              <!-- El botón de editar nos lleva a la ruta dinámica de edición -->
              <router-link :to="`/edit-movie/${movie.id}`" class="action-btn edit-btn">Editar</router-link>
              <!-- El botón de eliminar llama a nuestra función del store -->
              <button @click="handleDelete(movie.id, movie.title)" class="action-btn delete-btn">Eliminar</button>
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
import { useRouter } from 'vue-router';

const router = useRouter();
const movies = computed(() => store.state.value.movies);

const handleDelete = (id, title) => {
  // ¡Siempre pide confirmación para acciones destructivas!
  if (confirm(`¿Estás seguro de que quieres eliminar la película "${title}"? Esta acción no se puede deshacer.`)) {
    store.deleteMovie(id);
  }
};
</script>

<style scoped>
/* Estilos para que la tabla se vea profesional */
.manage-container { max-width: 900px; margin: 2rem auto; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.add-button { background-color: #28a745; color: white; padding: 0.6rem 1rem; text-decoration: none; border-radius: 5px; }
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: 12px; border-bottom: 1px solid #ddd; }
th { background-color: #f8f9fa; }
.actions { display: flex; gap: 10px; }
.action-btn { padding: 0.4rem 0.8rem; border: none; border-radius: 5px; color: white; cursor: pointer; text-decoration: none; }
.edit-btn { background-color: #007bff; }
.delete-btn { background-color: #dc3545; }
</style>
