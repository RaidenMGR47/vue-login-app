<template>
  <div class="add-movie-root">
    <div class="card">
      <h2>Añadir película</h2>

      <form @submit.prevent="submit" class="form">
        <label class="field">
          <div class="label">Película</div>
          <input v-model="title" placeholder="Añade aquí el nombre de la película" required />
        </label>

        <label class="field">
          <div class="label">Año de la película</div>
          <input v-model.number="year" type="number" placeholder="Añade aquí el año de la película" required />
        </label>

        <label class="field">
          <div class="label">Género de la película</div>
          <input v-model="genre" placeholder="Añade aquí el género de la película (ej: Acción)" required />
        </label>

        <div class="field">
          <div class="label">Selecciona los días de la semana en los que estará disponible</div>
          <div class="days">
            <label v-for="(d, idx) in DAY_NAMES" :key="idx" class="day-checkbox">
              <input type="checkbox" :value="d" v-model="daysSelected" />
              <span>{{ d }}</span>
            </label>
          </div>
          <div class="hint">Si no seleccionas ninguno, se guardará como disponible todos los días.</div>
        </div>

        <label class="field">
          <div class="label">Precio de entrada</div>
          <input v-model.number="price" type="number" step="0.01" min="0" placeholder="Añade aquí el precio de la entrada" required />
        </label>

        <div class="actions">
          <button type="submit">Añadir</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { addMovie } from '../store.js';

const title = ref('');
const year = ref(new Date().getFullYear());
const genre = ref('');
const daysSelected = ref([]);
const price = ref(5.0);

const DAY_NAMES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

const submit = () => {
  const days = (daysSelected.value && daysSelected.value.length > 0) ? [...daysSelected.value] : [...DAY_NAMES];

  const m = {
    title: title.value,
    year: year.value,
    genre: genre.value,
    daysAvailable: days,
    price: Number(price.value)
  };

  addMovie(m);
  alert('Película añadida.');

  // limpiar
  title.value = '';
  genre.value = '';
  daysSelected.value = [];
  price.value = 5.0;

  const ev = new CustomEvent('movie-added');
  window.dispatchEvent(ev);
};
</script>

<style scoped>
.add-movie-root {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px;
}

.card {
  width: 680px;
  max-width: 95%;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 18px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
  text-align: center;
}

h2 {
  margin-bottom: 12px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.field {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.label {
  width: 100%;
  text-align: left;
  font-weight: 600;
  margin-bottom: 6px;
}

input[type="text"],
input[type="number"],
input[type="email"],
select,
input {
  width: 100%;
  max-width: 560px;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
}

.days {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 6px;
}

.day-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.hint {
  font-size: 12px;
  color: #666;
  margin-top: 6px;
}

.actions {
  margin-top: 6px;
}

button {
  padding: 8px 14px;
  border-radius: 6px;
  border: 1px solid #bfbfbf;
  background: #f5f5f5;
  cursor: pointer;
}
</style>
