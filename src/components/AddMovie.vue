<template>
  <!-- 1. Contenedor para centrar la tarjeta del formulario -->
  <div class="add-movie-page">
    <div class="add-movie-card">
      <h2 class="card-title">Añadir Nueva Película</h2>

      <form @submit.prevent="submitMovie">
        <!-- Título -->
        <div class="form-group">
          <label for="title">Título de la Película</label>
          <input id="title" v-model="movie.title" type="text" required />
        </div>

        <!-- 2. Rejilla para Año y Género -->
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

        <!-- 3. Días Disponibles (con checkboxes estilizados) -->
        <div class="form-group">
          <label>Días Disponibles</label>
          <div class="days-selector">
            <div v-for="day in weekDays" :key="day" class="day-option">
              <!-- El input real está oculto, pero es funcional -->
              <input
                type="checkbox"
                :id="day"
                :value="day"
                v-model="movie.daysAvailable"
                class="day-checkbox"
              >
              <!-- Esta es la etiqueta clicable que el usuario ve -->
              <label :for="day" class="day-label">{{ day }}</label>
            </div>
          </div>
          <small class="form-hint">Si no seleccionas ninguno, estará disponible todos los días.</small>
        </div>

        <!-- Mensaje de éxito -->
        <p v-if="successMsg" class="success-message">{{ successMsg }}</p>

        <!-- Botón de envío -->
        <button type="submit" class="add-button">Añadir Película</button>
      </form>
    </div>
  </div>
</template>

<script setup>
// La lógica del script no necesita cambios, ya es correcta.
import { ref } from 'vue';
import store from '../store';

const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const successMsg = ref('');

const movie = ref({
  title: '',
  year: new Date().getFullYear(),
  genre: '',
  daysAvailable: [],
  price: 5.0
});

const resetForm = () => {
  movie.value = {
    title: '',
    year: new Date().getFullYear(),
    genre: '',
    daysAvailable: [],
    price: 5.0
  };
};

const submitMovie = () => {
  store.addMovie(movie.value);
  successMsg.value = `¡Película "${movie.value.title}" añadida con éxito!`;
  resetForm();

  setTimeout(() => {
    successMsg.value = '';
  }, 4000);
};
</script>

<style scoped>
.add-movie-page {
  display: flex;
  justify-content: center;
  padding: 2rem;
  box-sizing: border-box;
}

.add-movie-card {
  width: 100%;
  max-width: 600px; /* Un poco más ancho para acomodar el formulario */
  padding: 2.5rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.card-title {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr; /* Dos columnas de igual tamaño */
  gap: 1.5rem; /* Espacio entre las columnas */
}

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

/* --- Estilos para los checkboxes personalizados --- */
.days-selector {
  display: flex;
  flex-wrap: wrap; /* Permite que los días pasen a la siguiente línea si no caben */
  gap: 10px;
  margin-top: 0.5rem;
}

/* Ocultamos el checkbox real */
.day-checkbox {
  display: none;
}

/* Estilo de la etiqueta que parece un botón/tag */
.day-label {
  padding: 0.5rem 1rem;
  border: 1px solid #ccc;
  border-radius: 20px; /* Bordes redondeados para un look de "píldora" */
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  user-select: none; /* Evita que el texto se seleccione al hacer clic */
}

/* Estilo de la etiqueta CUANDO su checkbox correspondiente está seleccionado */
.day-checkbox:checked + .day-label {
  background-color: #42b983;
  color: white;
  border-color: #42b983;
}

.form-hint {
  display: block;
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: #666;
}

.add-button {
  width: 100%;
  padding: 0.8rem;
  border: none;
  border-radius: 8px;
  background-color: #007bff; /* Un color azul para diferenciarlo del login */
  color: white;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 1rem;
}

.add-button:hover {
  background-color: #0056b3;
}

.success-message {
  color: #155724;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  margin-top: 1.5rem;
}
</style>
