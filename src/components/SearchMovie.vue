// ...existing code...
<template>
  <div>
    <h2>Buscar y Comprar</h2>
    <div style="margin-bottom:12px;">
      <input v-model="q" placeholder="Buscar por título o género" />
    </div>

    <div v-if="filtered.length === 0">No hay resultados.</div>

    <div v-for="m in filtered" :key="m.id" style="border:1px solid #ddd;padding:8px;margin-bottom:8px;border-radius:6px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <strong>{{ m.title }}</strong> <small>({{ m.year }})</small><br/>
          <small>{{ m.genre }} • Precio: ${{ m.price.toFixed(2) }}</small>
        </div>
        <div>
          <button @click="selectMovie(m)">Comprar</button>
        </div>
      </div>
    </div>

    <div v-if="selected">
      <h3>Comprar: {{ selected.title }}</h3>
      <div>
        <label>Cantidad de entradas:</label>
        <input type="number" v-model.number="tickets" min="1" />
      </div>
      <div>
        <label>Seleccionar día:</label>
        <select v-model="selectedDate">
          <option v-for="d in availableDates" :key="d" :value="d">{{ d }}</option>
        </select>
      </div>
      <div style="margin-top:8px;">
        <strong>Total: ${{ total.toFixed(2) }}</strong>
      </div>
      <div style="margin-top:8px;">
        <button @click="confirmPurchase">Confirmar y Pagar</button>
        <button @click="cancel">Cancelar</button>
      </div>
      <div v-if="lastCode" style="margin-top:12px;">
        <strong>Código de compra:</strong> {{ lastCode }} (cópialo para tu recibo)
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { getMovies, addPurchase } from '../store.js';

const props = defineProps({
  username: { type: String, default: '' },
  role: { type: String, default: 'user' }
});

const q = ref('');
const movies = ref(getMovies());
const filtered = computed(() => {
  const term = q.value.trim().toLowerCase();
  if (!term) return movies.value;
  return movies.value.filter(m =>
    m.title.toLowerCase().includes(term) || m.genre.toLowerCase().includes(term)
  );
});

const selected = ref(null);
const tickets = ref(1);
// selectedDate ahora guardará el nombre del día en letras (ej. "Lunes")
const selectedDate = ref('');
const lastCode = ref('');

// nombres de los días en español (0 = Domingo)
const DAY_NAMES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

function selectMovie(m) {
  selected.value = m;
  tickets.value = 1;
  const dates = computeAvailableDays(m);
  selectedDate.value = dates[0] || '';
}

function cancel() {
  selected.value = null;
  lastCode.value = '';
}

// computeAvailableDays: si movie.daysAvailable es número -> generar próximos N días en nombres;
// si es array de strings -> usarlo directamente (mantener orden dado).
function computeAvailableDays(movie) {
  const days = movie?.daysAvailable;
  if (!days) return [];

  // si es un número (compatibilidad antigua)
  if (typeof days === 'number') {
    const arr = [];
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push(DAY_NAMES[d.getDay()]);
    }
    return arr;
  }

  // si es array (asumimos array de nombres de días)
  if (Array.isArray(days)) {
    // devolver una copia (y opcionalmente normalizar)
    return days.map(s => String(s));
  }

  // fallback
  return [];
}

const availableDates = computed(() => selected.value ? computeAvailableDays(selected.value) : []);

const total = computed(() => {
  if (!selected.value) return 0;
  return (selected.value.price || 0) * (tickets.value || 0);
});

function confirmPurchase() {
  if (!selected.value || !selectedDate.value) {
    alert('Selecciona una película y un día.');
    return;
  }
  const username = props.username || window.__CURRENT_USER_NAME__ || 'guest';
  const purchase = {
    username: username,
    movieId: selected.value.id,
    movieTitle: selected.value.title,
    // guardamos el nombre del día (ej. "Lunes")
    viewingDate: selectedDate.value,
    tickets: Number(tickets.value),
    totalPrice: Number(total.value)
  };
  const saved = addPurchase(purchase);
  lastCode.value = saved.code;
  // guardar último código global para que App.vue / ReceiptLookup lo puedan usar
  window.__LAST_PURCHASE_CODE__ = saved.code;
  // notificar globalmente con detalle
  const ev = new CustomEvent('purchase-made', { detail: saved });
  window.dispatchEvent(ev);
  alert('Compra realizada. Código: ' + saved.code);
}
</script>
