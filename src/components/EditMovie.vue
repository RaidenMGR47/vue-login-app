<template>
  <div class="edit-movie-page">
    <!-- Contenedor de la tarjeta, se muestra solo cuando los datos de la película se han cargado -->
    <div v-if="movie" class="edit-movie-card">

      <!-- Título dinámico que da contexto al usuario -->
      <h2 class="card-title">Editando: <span>{{ originalTitle }}</span></h2>

      <form @submit.prevent="saveChanges">

        <!-- Título -->
        <div class="form-group">
          <label for="title">Título de la Película</label>
          <input id="title" v-model="movie.title" type="text" required />
        </div>

        <!-- Rejilla para Año y Género -->
        <div class="form-grid">
          <div class="form-group">
            <label for="year">Año</label>
            <input id="year" v-model.number="movie.year" type="number" :min="1900" :max="new Date().getFullYear() + 1" required />
          </div>
          <div class="form-group">
            <label for="genre">Género</label>
            <input id="genre" v-model="movie.genre" type="text" required />
          </div>
        </div>

        <!-- Precio -->
        <div class="form-group">
          <label for="price">Precio de Entrada ($)</label>
          <input id="price" v-model.number="movie.price" type="number" step="0.01" min="0" required />
        </div>

        <!-- Días Disponibles (con checkboxes estilizados) -->
        <div class="form-group">
          <label>Días Disponibles</label>
          <div class="days-selector">
            <div v-for="day in weekDays" :key="day">
              <input
                type="checkbox"
                :id="`edit-${day}`"
                :value="day"
                v-model="movie.daysAvailable"
                class="day-checkbox"
              >
              <label :for="`edit-${day}`" class="day-label">{{ day }}</label>
            </div>
          </div>
        </div>

        <!-- Botones de Acción -->
        <div class="form-actions">
          <button type="submit" class="action-button save-button">Guardar Cambios</button>
          <router-link to="/manage-movies" class="action-button cancel-button">Cancelar</router-link>
        </div>

      </form>
    </div>

    <!-- Mensaje de carga o si la película no se encuentra -->
    <div v-else class="loading-message">
      <p>Cargando datos de la película...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import store from '../store';

const route = useRoute();
const router = useRouter();
const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const movie = ref(null);
const originalTitle = ref(''); // Para mantener el título original en el encabezado

onMounted(() => {
  const movieId = route.params.id;
  const movieData = store.getMovieById(movieId);

  if (movieData) {
    // Creamos una copia profunda para la edición
    movie.value = JSON.parse(JSON.stringify(movieData));
    originalTitle.value = movieData.title; // Guardamos el título original
  } else {
    // Si no se encuentra la película, redirigir a la página de gestión
    router.push('/manage-movies');
  }
});

const saveChanges = () => {
  if (movie.value) {
    store.updateMovie(movie.value);
    router.push('/manage-movies'); // Volver a la lista después de guardar
  }
};
</script>

<style scoped>
/* Copiamos los estilos base de AddMovie para consistencia */
.edit-movie-page {
  display: flex;
  justify-content: center;
  padding: 2rem;
  box-sizing: border-box;
}

.edit-movie-card {
  width: 100%;
  max-width: 600px;
  padding: 2.5rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.card-title {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
  font-weight: 300; /* Hacemos el texto un poco más ligero */
}

/* El título de la película se resalta */
.card-title span {
  font-weight: 600;
  color: #42b983; /* Usamos el color de Vue para destacar */
}

.form-group { margin-bottom: 1.5rem; }
.form-group label { display: block; margin-bottom: 0.5rem; color: #555; font-weight: 500; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }

input[type="text"],
input[type="number"] {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s, box-shadow 0.3s;
  box-sizing: border-box;
}

input[type="text"]:focus,
input[type="number"]:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.2);
}

/* Estilos para los checkboxes personalizados (idénticos a AddMovie) */
.days-selector { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 0.5rem; }
.day-checkbox { display: none; }
.day-label { padding: 0.5rem 1rem; border: 1px solid #ccc; border-radius: 20px; cursor: pointer; transition: all 0.2s ease-in-out; user-select: none; }
.day-checkbox:checked + .day-label { background-color: #42b983; color: white; border-color: #42b983; }

/* Contenedor para los botones de acción */
.form-actions {
  display: flex;
  justify-content: flex-end; /* Alinea los botones a la derecha */
  gap: 1rem;
  margin-top: 2.5rem;
  border-top: 1px solid #eee; /* Línea separadora sutil */
  padding-top: 1.5rem;
}

.action-button {
  padding: 0.7rem 1.5rem;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  text-decoration: none;
  transition: background-color 0.3s, transform 0.1s;
}

.action-button:hover {
  transform: translateY(-2px); /* Pequeño efecto de levantamiento */
}

.save-button {
  background-color: #28a745; /* Verde para la acción principal */
}

.cancel-button {
  background-color: #6c757d; /* Gris para la acción secundaria */
}

.loading-message {
  text-align: center;
  margin-top: 4rem;
  color: #666;
}
</style>
