<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>Gestionar Películas</h1>
      <router-link to="/add-movie" class="btn btn-success">
        <i class="bi bi-plus-circle me-2"></i>Añadir Nueva Película
      </router-link>
    </div>

    <div v-if="movies.length > 0" class="table-responsive">
      <table class="table table-striped table-hover">
        <thead class="table-dark">
          <tr>
            <th>Póster</th>
            <th>Título</th>
            <th>Año</th>
            <th>Género</th>
            <th>Precio</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="movie in movies" :key="movie.id">
            <td>
              <img :src="movie.poster || defaultPoster" class="poster-thumbnail" alt="Póster">
            </td>
            <td class="fw-bold">{{ movie.title }}</td>
            <td>{{ movie.year }}</td>
            <td><span class="badge bg-secondary">{{ movie.genre }}</span></td>
            <td>${{ movie.price.toFixed(2) }}</td>
            <td>
              <div class="btn-group" role="group">
                <!-- Botón Editar con icono -->
                <router-link
                  :to="{ name: 'editMovie', params: { id: movie.id } }"
                  class="btn btn-outline-primary btn-sm"
                  title="Editar película"
                >
                  <i class="bi bi-pencil-square me-1"></i>Editar
                </router-link>

                <!-- Botón Eliminar con icono -->
                <button
                  @click="confirmDelete(movie)"
                  class="btn btn-outline-danger btn-sm"
                  title="Eliminar película"
                >
                  <i class="bi bi-trash me-1"></i>Eliminar
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="text-center py-5">
      <div class="alert alert-info">
        <i class="bi bi-info-circle me-2"></i>
        No hay películas para gestionar. ¡Añade una!
      </div>
    </div>
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
.poster-thumbnail {
  width: 60px;
  height: 90px;
  object-fit: cover;
  border-radius: 4px;
}

.btn-group {
  gap: 0.25rem;
}

.table th {
  border-top: none;
}
</style>
