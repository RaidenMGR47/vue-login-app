// ...existing code...
<template>
  <div>
    <h2>Añadir película</h2>
    <form @submit.prevent="submit">
      <div><input v-model="title" placeholder="Título" required /></div>
      <div><input v-model.number="year" type="number" placeholder="Año" required /></div>
      <div><input v-model="genre" placeholder="Género (ej: Acción)" required /></div>

      <div style="margin-top:8px;">
        <div>Selecciona los días de la semana en los que estará disponible:</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;">
          <label v-for="(d, idx) in DAY_NAMES" :key="idx" style="display:flex;align-items:center;gap:6px;">
            <input type="checkbox" :value="d" v-model="daysSelected" />
            <span>{{ d }}</span>
          </label>
        </div>
        <div style="margin-top:6px;font-size:12px;color:#666;">
          Si no seleccionas ninguno, se guardará como disponible "Todos los días" (se interpretará como las 7 días).
        </div>
      </div>

      <div style="margin-top:8px;">
        <input v-model.number="price" type="number" step="0.01" min="0" placeholder="Precio entrada" required />
      </div>

      <div style="margin-top:8px;"><button type="submit">Añadir</button></div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { addMovie } from '../store.js';

const title = ref('');
const year = ref(new Date().getFullYear());
const genre = ref('');
// ahora guardamos días como array de nombres
const daysSelected = ref([]);
const price = ref(5.0);

// nombres de los días en español (0 = Domingo)
const DAY_NAMES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

const submit = () => {
  // Si no se seleccionó ninguno, guardar como array con todos los días
  const days = (daysSelected.value && daysSelected.value.length > 0) ? [...daysSelected.value] : [...DAY_NAMES];

  const m = {
    title: title.value,
    year: year.value,
    genre: genre.value,
    // ahora daysAvailable es un array de strings con nombres de días
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

  // emitir para que el padre pueda cambiar vista si quiere
  const ev = new CustomEvent('movie-added');
  window.dispatchEvent(ev);
};
</script>
