<template>
  <div class="schedule-movie-container">
    <div class="content-card">
      <h1 class="page-title">Programar Función</h1>
      <p class="page-subtitle">Asigna una película a una sala y horario específico.</p>

      <form @submit.prevent="submitScreening" class="schedule-form">
        
        <!-- Selección de Película -->
        <div class="form-group">
          <label for="movieSelect">Película</label>
          <select id="movieSelect" v-model="selectedMovieId" required>
            <option value="" disabled>Selecciona una película</option>
            <option v-for="movie in movies" :key="movie.id" :value="movie.id">
              {{ movie.title }} ({{ movie.duration || 'N/A' }} min)
            </option>
          </select>
        </div>

        <!-- Selección de Sala -->
        <div class="form-group">
          <label for="hallSelect">Sala</label>
          <select id="hallSelect" v-model="selectedHallId" required>
            <option value="" disabled>Selecciona una sala</option>
            <option v-for="hall in halls" :key="hall.id" :value="hall.id">
              {{ hall.name }} (Cap: {{ hall.capacity }})
            </option>
          </select>
        </div>

        <!-- Selección de Fecha y Hora -->
        <div class="datetime-grid">
          <div class="form-group">
            <label for="date">Fecha</label>
            <input id="date" v-model="date" type="date" required :min="minDate">
          </div>
          <div class="form-group">
            <label for="time">Hora de Inicio</label>
            <input id="time" v-model="time" type="time" required>
          </div>
        </div>

        <!-- Resumen y Confirmación -->
        <div v-if="selectedMovieId && date && time" class="summary-box">
          <h4>Resumen de la Función</h4>
          <p><strong>Película:</strong> {{ selectedMovie?.title }}</p>
          <p><strong>Sala:</strong> {{ selectedHall?.name }}</p>
          <p><strong>Inicio:</strong> {{ formattedDateTime }}</p>
          <p><strong>Fin estimado:</strong> {{ formattedEndTime }}</p>
        </div>

        <div v-if="errorMsg" class="error-message">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          {{ errorMsg }}
        </div>

        <div v-if="successMsg" class="success-message">
          <i class="bi bi-check-circle-fill me-2"></i>
          {{ successMsg }}
        </div>

        <button type="submit" class="btn-schedule" :disabled="isLoading">
          {{ isLoading ? 'Programando...' : 'Programar Función' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import store from '../store';

const movies = computed(() => store.state.value.movies);
const halls = computed(() => store.state.value.halls);

const selectedMovieId = ref('');
const selectedHallId = ref('');
const date = ref('');
const time = ref('');
const isLoading = ref(false);
const errorMsg = ref('');
const successMsg = ref('');

// Fecha mínima (hoy)
const minDate = new Date().toISOString().split('T')[0];

onMounted(async () => {
  await Promise.all([
    store.fetchHalls(),
    // Asegurarnos de tener películas cargadas (si no se cargaron en main)
    // store.loadInitialData() // Esto ya se llama en store.js al inicio
  ]);
});

const selectedMovie = computed(() => movies.value.find(m => m.id === selectedMovieId.value));
const selectedHall = computed(() => halls.value.find(h => h.id === selectedHallId.value));

const formattedDateTime = computed(() => {
  if (!date.value || !time.value) return '';
  return `${date.value} ${time.value}`;
});

const formattedEndTime = computed(() => {
  if (!date.value || !time.value || !selectedMovie.value) return '---';
  
  const duration = selectedMovie.value.duration || 120; // Default 120 si no tiene duración
  const start = new Date(`${date.value}T${time.value}`);
  const end = new Date(start.getTime() + duration * 60000);
  
  return end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

async function submitScreening() {
  errorMsg.value = '';
  successMsg.value = '';
  
  if (!selectedMovieId.value || !selectedHallId.value || !date.value || !time.value) {
    errorMsg.value = 'Por favor completa todos los campos.';
    return;
  }

  isLoading.value = true;

  try {
    const duration = selectedMovie.value.duration || 120;
    const startTime = `${date.value}T${time.value}`;

    await store.addScreening({
      movieId: selectedMovieId.value,
      hallId: selectedHallId.value,
      startTime: startTime,
      duration: duration
    });

    successMsg.value = 'Función programada exitosamente.';
    // Reset form parcial
    selectedMovieId.value = '';
    time.value = '';
  } catch (error) {
    errorMsg.value = error.message;
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.schedule-movie-container {
  max-width: 600px;
  margin: 0 auto;
}
.content-card {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
}
.page-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}
.page-subtitle {
  color: #7f8c8d;
  margin-bottom: 2rem;
}

.schedule-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #34495e;
}
.form-group select,
.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #dfe6e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}
.form-group select:focus,
.form-group input:focus {
  outline: none;
  border-color: #3498db;
}

.datetime-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.summary-box {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}
.summary-box h4 {
  margin-top: 0;
  font-size: 1.1rem;
  color: #2c3e50;
  margin-bottom: 1rem;
}
.summary-box p {
  margin: 0.5rem 0;
  font-size: 0.95rem;
  color: #555;
}

.btn-schedule {
  background-color: #3498db;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  padding: 14px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 1rem;
}
.btn-schedule:hover {
  background-color: #2980b9;
}
.btn-schedule:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.error-message {
  color: #e74c3c;
  background: #fadbd8;
  padding: 1rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
}
.success-message {
  color: #27ae60;
  background: #d5f5e3;
  padding: 1rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
}
</style>
