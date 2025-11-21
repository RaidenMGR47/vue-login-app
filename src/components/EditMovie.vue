<template>
  <div class="edit-movie-container">
    <div v-if="movie" class="form-card">
      <h1 class="form-title">Editando Película</h1>
      <p class="form-subtitle">Modifica los detalles de "{{ originalTitle }}" y guarda los cambios.</p>

      <form @submit.prevent="submitUpdate">
        <div class="form-layout">
          <!-- Columna Izquierda: Póster -->
          <div class="poster-section">
            <label for="poster" class="poster-label">
              <input id="poster" type="file" @change="handleImageUpload" accept="image/png, image/jpeg, image/jpg" class="file-input">

              <div class="poster-image-container">
                <!-- Muestra la nueva imagen si existe, si no, la original de la película -->
                <img :src="posterPreview || movie.poster" alt="Vista previa del póster" class="poster-preview">
                <div class="poster-overlay"><span>Cambiar Imagen</span></div>
              </div>
            </label>
          </div>

          <!-- Columna Derecha: Detalles -->
          <div class="details-section">
            <div class="form-group">
              <label for="title">Título de la Película</label>
              <input id="title" v-model="movie.title" type="text" required>
            </div>

            <div class="details-grid">
              <div class="form-group">
                <label for="year">Año</label>
                <input id="year" v-model.number="movie.year" type="number" required>
              </div>
              <div class="form-group">
                <label for="genre">Género</label>
                <input id="genre" v-model="movie.genre" type="text" required>
              </div>
              <div class="form-group">
                <label for="duration">Duración (min)</label>
                <input id="duration" v-model.number="movie.duration" type="number" min="1" required>
              </div>
            </div>

            <div class="form-group">
              <label for="price">Precio de Entrada ($)</label>
              <input id="price" v-model.number="movie.price" type="number" step="0.01" required>
            </div>


          </div>
        </div>

        <div class="form-actions">
          <router-link to="/manage-movies" class="cancel-link">Cancelar</router-link>
          <button type="submit" class="submit-button" :disabled="isLoading">
            {{ isLoading ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>
      </form>
    </div>
    <div v-else class="loading-state">
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



const movie = ref(null);
const originalTitle = ref('');
const posterPreview = ref('');
const isLoading = ref(false);

onMounted(() => {
  const movieId = route.params.id;
  const movieData = store.getMovieById(movieId);

  if (movieData) {
    // Creamos una copia reactiva para el formulario
    movie.value = { ...movieData };

    // Guardamos el título original para mostrarlo en el encabezado
    originalTitle.value = movieData.title;
  } else {
    // Si la película no existe por alguna razón, volvemos a la página de gestión
    router.push('/manage-movies');
  }
});

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validar tamaño del archivo (máximo 2MB)
  const maxSize = 2 * 1024 * 1024; // 2MB en bytes
  if (file.size > maxSize) {
    alert('La imagen es demasiado grande. Por favor, selecciona una imagen menor a 2MB.');
    event.target.value = ''; // Limpiar el input
    return;
  }

  // Validar tipo de archivo
  if (!file.type.startsWith('image/')) {
    alert('Por favor, selecciona un archivo de imagen válido (JPEG, PNG, etc.).');
    event.target.value = ''; // Limpiar el input
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    posterPreview.value = e.target.result;
    movie.value.poster = e.target.result;
  };
  reader.onerror = () => {
    alert('Error al leer el archivo. Por favor, intenta con otra imagen.');
    event.target.value = ''; // Limpiar el input
  };
  reader.readAsDataURL(file);
}

async function submitUpdate() {
  if (movie.value) {
    isLoading.value = true;
    try {
      await store.updateMovie(movie.value);
      alert('¡Película actualizada con éxito!');
      router.push('/manage-movies');
    } catch (error) {
      alert('Error al actualizar la película: ' + error.message);
    } finally {
      isLoading.value = false;
    }
  }
}
</script>

<style scoped>
/* LOS ESTILOS SON EXACTAMENTE LOS MISMOS QUE EN AddMovie.vue PARA MANTENER LA CONSISTENCIA */
.edit-movie-container {
  max-width: 900px;
  margin: 0 auto;
}
.loading-state {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
}
.form-card {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
}
.form-title {
  font-size: 2em;
  font-weight: 700;
  margin-bottom: 0.5rem;
}
.form-subtitle {
  font-size: 1.1em;
  color: #6c757d;
  margin-bottom: 2.5rem;
}

/* Layout Principal del Formulario */
.form-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2.5rem;
}

/* Columna del Póster */
.poster-section { text-align: center; }
.file-input { display: none; }
.poster-label { cursor: pointer; }
.poster-image-container { position: relative; border-radius: 8px; overflow: hidden; }
.poster-preview { display: block; width: 100%; height: auto; border: 2px solid #eee; border-radius: 8px;}
.poster-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); color: white; display: flex; justify-content: center; align-items: center; font-weight: 600; opacity: 0; transition: opacity 0.3s; }
.poster-image-container:hover .poster-overlay { opacity: 1; }

/* Columna de Detalles */
.details-section { display: flex; flex-direction: column; }
.form-group { margin-bottom: 1.5rem; }
.form-group label { display: block; font-weight: 600; margin-bottom: 0.5rem; }
.form-group input { width: 100%; padding: 12px 15px; font-size: 1em; border-radius: 6px; border: 1px solid #d0d7de; transition: border-color 0.2s, box-shadow 0.2s; }
.form-group input:focus { outline: none; border-color: #007BFF; box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2); }
.details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }



/* Acciones del Formulario */
.form-actions {
  display: flex;
  justify-content: flex-end; /* Alineado a la derecha */
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
}
.submit-button {
  background-color: #007BFF; /* Azul para "Guardar" */
  color: white;
  font-size: 1.1em;
  font-weight: 600;
  padding: 12px 25px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.submit-button:hover {
  background-color: #0056b3;
}
.cancel-link {
  font-weight: 600;
  color: #6c757d;
  text-decoration: none;
  padding: 12px 25px;
  border-radius: 6px;
  transition: background-color 0.2s;
}
.cancel-link:hover {
  background-color: #f8f9fa;
}

/* Responsividad */
@media (max-width: 800px) {
  .form-layout { grid-template-columns: 1fr; }
  .poster-section { max-width: 300px; margin: 0 auto 2.5rem auto; }
}
</style>
