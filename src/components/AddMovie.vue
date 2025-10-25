<template>
  <div>
    <h2>Añadir película</h2>
    <form @submit.prevent="submitMovie">
      <!-- Título -->
      <div class="form-group">
        <label>Película</label>
        <input v-model="movie.title" type="text" required />
      </div>
      <!-- Año -->
      <div class="form-group">
        <label>Año de la película</label>
        <input v-model.number="movie.year" type="number" :min="1900" :max="new Date().getFullYear() + 1" required />
      </div>
      <!-- Género -->
      <div class="form-group">
        <label>Género de la película</label>
        <input v-model="movie.genre" type="text" required />
      </div>
      <!-- Días Disponibles -->
      <div class="form-group">
        <label>Selecciona los días de la semana en los que estará disponible</label>
        <div v-for="d in weekDays" :key="d" class="checkbox-group">
          <input type="checkbox" :id="d" :value="d" v-model="movie.daysAvailable">
          <label :for="d">{{ d }}</label>
        </div>
        <small>Si no seleccionas ninguno, se guardará como disponible todos los días.</small>
      </div>
      <!-- Precio -->
      <div class="form-group">
        <label>Precio de entrada</label>
        <input v-model.number="movie.price" type="number" step="0.01" min="0" required />
      </div>

      <p v-if="successMsg" class="success">{{ successMsg }}</p>
      <button type="submit">Añadir</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import store from '../store';

const router = useRouter();
const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const successMsg = ref('');

// Usamos ref() para un objeto reactivo
const movie = ref({
  title: '',
  year: new Date().getFullYear(),
  genre: '',
  daysAvailable: [],
  price: 0.0
});

const resetForm = () => {
    movie.value = {
        title: '',
        year: new Date().getFullYear(),
        genre: '',
        daysAvailable: [],
        price: 0.0
    };
};

const submitMovie = () => {
  store.addMovie(movie.value);
  successMsg.value = `¡Película "${movie.value.title}" añadida con éxito!`;
  resetForm();

  // Opcional: redirigir después de un tiempo
  setTimeout(() => {
    successMsg.value = '';
    // router.push('/');
  }, 3000);
};
</script>

<style scoped>
.success { color: green; }
.checkbox-group { display: inline-block; margin-right: 10px; }
</style>
