<template>
  <div class="search-container">
    <h2>Buscar y Comprar</h2>

    <!-- Sección de Búsqueda -->
    <div class="search-box">
      <input
        type="text"
        v-model="searchTerm"
        placeholder="Buscar película por título..."
      />
    </div>

    <!-- Sección de Confirmación de Compra (se muestra después de pagar) -->
    <div v-if="lastPurchaseCode" class="purchase-success">
      ¡Compra exitosa! Tu código es: <strong>{{ lastPurchaseCode }}</strong> (cópialo para tu recibo).
    </div>

    <!-- Sección de Compra (Modal o Diálogo que aparece al seleccionar una película) -->
    <div v-if="selectedMovie" class="purchase-dialog">
      <h3>Comprar: {{ selectedMovie.title }}</h3>
      <form @submit.prevent="confirmPurchase">
        <div class="form-group">
          <label for="quantity">Cantidad de entradas:</label>
          <input id="quantity" type="number" v-model.number="ticketQuantity" min="1" />
        </div>
        <div class="form-group">
          <label>Seleccionar día:</label>
          <!-- Se muestran los días disponibles para esa película específica -->
          <div class="days-selector">
            <template v-for="day in selectedMovie.daysAvailable" :key="day">
              <input type="radio" :id="day" :value="day" v-model="selectedDay">
              <label :for="day">{{ day }}</label>
            </template>
          </div>
        </div>
        <div class="total-price">
          Total: <span>${{ totalPrice.toFixed(2) }}</span>
        </div>
        <div class="dialog-actions">
          <!-- El botón de pagar se deshabilita si no se ha seleccionado un día -->
          <button type="submit" :disabled="!selectedDay">Confirmar y Pagar</button>
          <button type="button" @click="cancelPurchase" class="cancel-btn">Cancelar</button>
        </div>
      </form>
    </div>

    <!-- Lista de Resultados de Búsqueda -->
    <div v-if="filteredMovies.length > 0" class="results-grid">
      <div v-for="m in filteredMovies" :key="m.id" class="movie-result-card">
        <h4>{{ m.title }} ({{ m.year }})</h4>
        <p>{{ m.genre }} • Precio: ${{ m.price.toFixed(2) }}</p>
        <!-- Botón para abrir el diálogo de compra -->
        <button @click="selectMovieForPurchase(m)">Comprar</button>
      </div>
    </div>
    <p v-else-if="searchTerm" class="no-results">
      No hay resultados para "{{ searchTerm }}".
    </p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
// 1. Importar el store completo
import store from '../store';

// --- Estado para la Búsqueda ---
const searchTerm = ref('');
// Referencia reactiva a la lista completa de películas del store
const allMovies = computed(() => store.state.value.movies);
// Lista de películas que se actualiza automáticamente al cambiar el término de búsqueda
const filteredMovies = computed(() => {
  if (!searchTerm.value) {
    return allMovies.value; // Muestra todas si no hay búsqueda
  }
  return allMovies.value.filter(movie =>
    movie.title.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});

// --- Estado para el Proceso de Compra ---
const selectedMovie = ref(null); // La película que se está comprando
const ticketQuantity = ref(1);
const selectedDay = ref(null);
const lastPurchaseCode = ref(null); // Para mostrar el código de la última compra

// --- Propiedades Calculadas ---
const totalPrice = computed(() => {
  if (selectedMovie.value) {
    return selectedMovie.value.price * ticketQuantity.value;
  }
  return 0;
});

// --- Métodos ---
function selectMovieForPurchase(movie) {
  selectedMovie.value = movie;
  // Reseteamos los valores del formulario cada vez que se selecciona una película
  ticketQuantity.value = 1;
  selectedDay.value = null;
  lastPurchaseCode.value = null; // Oculta el mensaje de la compra anterior
}

function cancelPurchase() {
  selectedMovie.value = null;
}

function confirmPurchase() {
  if (!selectedDay.value || !selectedMovie.value) {
    alert('Por favor, selecciona un día para ver la película.');
    return;
  }

  // 2. Crear el objeto de la compra con los datos del estado y del store
  const purchaseData = {
    username: store.state.value.session.username, // Obtenemos el usuario de la sesión
    movieTitle: selectedMovie.value.title,
    tickets: ticketQuantity.value,
    viewingDate: selectedDay.value,
    totalPrice: totalPrice.value
  };

  // 3. Llamar al método .addPurchase() del store
  const newPurchase = store.addPurchase(purchaseData);

  // Guardamos el código para mostrarlo al usuario
  lastPurchaseCode.value = newPurchase.code;

  // Cerramos el diálogo de compra
  cancelPurchase();

  // Opcional: Ocultar el mensaje de éxito después de unos segundos
  setTimeout(() => {
    lastPurchaseCode.value = null;
  }, 8000);
}
</script>

<style scoped>
/* Estilos para que el componente se vea bien */
.search-box { margin-bottom: 2rem; }
.search-box input { width: 100%; padding: 0.75rem; font-size: 1.1rem; border-radius: 4px; border: 1px solid #ccc; }

.results-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
.movie-result-card { border: 1px solid #eee; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.movie-result-card h4 { margin: 0 0 0.5rem 0; }
.movie-result-card p { margin: 0 0 1rem 0; color: #555; }

.purchase-dialog {
  margin: 2rem 0;
  padding: 1.5rem;
  border: 1px solid #007bff;
  border-radius: 8px;
  background-color: #f8f9fa;
}

.form-group { margin-bottom: 1rem; }
.days-selector label { margin-right: 1rem; }
.total-price { font-size: 1.2rem; font-weight: bold; margin: 1rem 0; }
.dialog-actions button { margin-right: 1rem; }
.cancel-btn { background-color: #6c757d; }

.purchase-success {
  padding: 1rem;
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
}
</style>
