<template>
  <div class="add-movie-container">
    <div class="form-card">
      <h1 class="form-title">Añadir Nueva Película</h1>
      <p class="form-subtitle">Completa los detalles de la película y sube su póster oficial.</p>

      <form @submit.prevent="submitMovie">
        <div class="form-layout">
          <!-- Columna Izquierda: Póster -->
          <div class="poster-section">
            <label for="poster" class="poster-label">
              <input id="poster" type="file" @change="handleImageUpload" accept="image/png, image/jpeg, image/jpg" class="file-input">

              <!-- Vista previa de la imagen -->
              <div v-if="posterPreview" class="poster-image-container">
                <img :src="posterPreview" alt="Vista previa del póster" class="poster-preview">
                <div class="poster-overlay"><span>Cambiar Imagen</span></div>
              </div>

              <!-- Placeholder si no hay imagen -->
              <div v-else class="poster-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                <span>Haz clic para subir un póster</span>
                <small>PNG o JPG (Máx. 2MB)</small>
              </div>
            </label>
          </div>

          <!-- Columna Derecha: Detalles -->
          <div class="details-section">
            <div class="form-group">
              <label for="title">Título de la Película</label>
              <input id="title" v-model="movie.title" type="text" placeholder="Ej: Aventura Espacial" required>
            </div>

            <div class="details-grid">
              <div class="form-group">
                <label for="year">Año</label>
                <input id="year" v-model.number="movie.year" type="number" placeholder="Ej: 2025" required>
              </div>
              <div class="form-group">
                <label for="genre">Género</label>
                <input id="genre" v-model="movie.genre" type="text" placeholder="Ej: Ciencia Ficción" required>
              </div>
            </div>

            <div class="form-group">
              <label for="price">Precio de Entrada ($)</label>
              <input id="price" v-model.number="movie.price" type="number" step="0.01" placeholder="Ej: 9.99" required>
            </div>

            <div class="form-group">
              <label>Días Disponibles</label>
              <div class="days-selector">
                <label v-for="day in allDays" :key="day" class="day-toggle">
                  <input type="checkbox" :value="day" v-model="movie.daysAvailable">
                  <span>{{ day.substring(0, 3) }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <div v-if="successMsg" class="success-message">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <span>{{ successMsg }}</span>
          </div>
          <button type="submit" class="submit-button" :disabled="isLoading">
            <i class="bi bi-plus-circle me-2"></i>
            {{ isLoading ? 'Añadiendo...' : 'Añadir Película' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import store from '../store';

const allDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const initialMovieState = () => ({
  title: '',
  year: new Date().getFullYear(),
  genre: '',
  price: null,
  daysAvailable: [],
  poster: ''
});

const movie = ref(initialMovieState());
const posterPreview = ref('');
const successMsg = ref('');
const isLoading = ref(false);

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

async function submitMovie() {
  if (!movie.value.title) {
    alert('Por favor, completa el título de la película.');
    return;
  }

  if (!movie.value.poster) {
    alert('Por favor, sube un póster para la película.');
    return;
  }

  isLoading.value = true;
  try {
    await store.addMovie(movie.value);
    successMsg.value = `¡"${movie.value.title}" ha sido añadida!`;

    // Limpiar formulario después de un breve momento para que el usuario vea el mensaje
    setTimeout(() => {
      movie.value = initialMovieState();
      posterPreview.value = '';
      successMsg.value = '';
      // Limpiar el input de archivo
      document.getElementById('poster').value = '';
    }, 2500);
  } catch (error) {
    alert('Error al añadir película: ' + error.message);
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.add-movie-container {
  max-width: 900px;
  margin: 0 auto;
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
.poster-section {
  text-align: center;
}
.file-input {
  display: none; /* Ocultamos el input de archivo por defecto */
}
.poster-label {
  cursor: pointer;
}
.poster-placeholder {
  border: 2px dashed #d0d7de;
  border-radius: 8px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #6c757d;
  transition: background-color 0.2s, border-color 0.2s;
}
.poster-placeholder:hover {
  background-color: #f8f9fa;
  border-color: #007BFF;
}
.poster-placeholder svg {
  margin-bottom: 1rem;
}
.poster-placeholder small {
  margin-top: 0.5rem;
  font-size: 0.8em;
}
.poster-image-container {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}
.poster-preview {
  display: block;
  width: 100%;
  height: auto;
}
.poster-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 600;
  opacity: 0;
  transition: opacity 0.3s;
}
.poster-image-container:hover .poster-overlay {
  opacity: 1;
}

/* Columna de Detalles */
.details-section {
  display: flex;
  flex-direction: column;
}
.form-group {
  margin-bottom: 1.5rem;
}
.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
}
.form-group input {
  width: 100%;
  padding: 12px 15px;
  font-size: 1em;
  border-radius: 6px;
  border: 1px solid #d0d7de;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.form-group input:focus {
  outline: none;
  border-color: #007BFF;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2);
}
.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

/* Selector de Días */
.days-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.day-toggle input[type="checkbox"] {
  display: none;
}
.day-toggle span {
  display: block;
  padding: 8px 12px;
  border: 1px solid #d0d7de;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}
.day-toggle input[type="checkbox"]:checked + span {
  background-color: #007BFF;
  color: white;
  border-color: #007BFF;
}

/* Acciones del Formulario */
.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
}
.submit-button {
  background-color: #28a745;
  color: white;
  font-size: 1.1em;
  font-weight: 600;
  padding: 12px 25px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
}
.submit-button:hover {
  background-color: #218838;
}
.success-message {
  display: flex;
  align-items: center;
  color: #218838;
  font-weight: 600;
}
.success-message svg {
  margin-right: 0.5rem;
}

/* Responsividad */
@media (max-width: 800px) {
  .form-layout {
    grid-template-columns: 1fr;
  }
  .poster-section {
    max-width: 300px;
    margin: 0 auto 2.5rem auto;
  }
}
</style>
