<template>
  <div>
    <h1>Consulta de Recibos</h1>

    <!-- FORMULARIO DE BÚSQUEDA MANUAL -->
    <form @submit.prevent="performSearch" class="search-form">
      <input v-model="searchCode" placeholder="Introduce un código de recibo para buscarlo...">
      <button type="submit">Buscar Manualmente</button>
    </form>

    <hr>

    <div class="main-layout">
      <!-- COLUMNA IZQUIERDA: ESCÁNER O VISUALIZADOR DE QR -->
      <div class="interactive-area">

        <!-- Estado 1: Escáner de Cámara (por defecto) -->
        <div v-if="!selectedPurchase">
          <h3>Escanear un Código QR</h3>
          <div class="scanner-container">
            <qrcode-stream @decode="onDecode" @init="onInit"></qrcode-stream>
          </div>
          <p v-if="scanError" class="error">{{ scanError }}</p>
        </div>

        <!-- Estado 2: Visualizador del QR de una compra seleccionada -->
        <div v-else class="qr-display">
          <h3>QR de tu Compra Seleccionada</h3>
          <p>Película: <strong>{{ selectedPurchase.movieTitle }}</strong></p>
          <qrcode-vue :value="selectedPurchase.code" :size="220" level="H" />
          <p class="qr-code-text">{{ selectedPurchase.code }}</p>
          <button @click="clearSelection" class="scan-new-button">Volver a Escanear</button>
        </div>
      </div>

      <!-- COLUMNA DERECHA: RESULTADOS O HISTORIAL DE COMPRAS -->
      <div class="sidebar">

        <!-- Si se ha realizado una búsqueda, se muestran los resultados -->
        <div v-if="searchResult || searched">
            <h3>Resultado de la Búsqueda</h3>
            <div v-if="searchResult" class="receipt-details">
              <p><strong>Código:</strong> {{ searchResult.code }}</p>
              <p><strong>Película:</strong> {{ searchResult.movieTitle }}</p>
              <p><strong>Total:</strong> ${{ searchResult.totalPrice.toFixed(2) }}</p>
              <p><strong>Fecha:</strong> {{ formattedDate(searchResult.datePurchased) }}</p>
            </div>
            <p v-else>No se encontró ningún recibo con el código "{{ searchCode }}".</p>
            <button @click="clearSearch" class="back-button">Ver Mis Compras</button>
        </div>

        <!-- Si no, se muestra el historial de compras del usuario -->
        <div v-else-if="session.username && userPurchases.length > 0" class="purchase-history">
          <h3>Mis Compras</h3>
          <p class="history-subtitle">Haz clic en una compra para ver su código QR</p>
          <div
            v-for="p in userPurchases"
            :key="p.code"
            class="purchase-item"
            :class="{ 'selected': selectedPurchase && selectedPurchase.code === p.code }"
            @click="selectPurchase(p)">
            <strong>{{ p.movieTitle }}</strong>
            <span>Total: ${{ p.totalPrice.toFixed(2) }}</span>
            <small>{{ formattedDate(p.datePurchased) }}</small>
          </div>
        </div>

        <p v-else-if="session.username">Aún no tienes compras registradas.</p>
        <p v-else>Inicia sesión para ver tu historial de compras.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { QrcodeStream } from 'vue-qrcode-reader';
import QrcodeVue from 'qrcode.vue'; // Importar para mostrar el QR
import store from '../store';

// --- Estado del Componente ---
const searchCode = ref('');
const searchResult = ref(null);
const searched = ref(false);
const scanError = ref('');
const selectedPurchase = ref(null); // Guarda la compra seleccionada del historial

// --- Datos del Store ---
const session = computed(() => store.state.value.session);
const userPurchases = computed(() => {
  return session.value.username ? store.getPurchasesForUser(session.value.username) : [];
});

// --- Métodos de Interacción ---
function selectPurchase(purchase) {
  // Si se vuelve a hacer clic en la misma compra, se deselecciona
  if (selectedPurchase.value && selectedPurchase.value.code === purchase.code) {
    clearSelection();
  } else {
    selectedPurchase.value = purchase;
    clearSearch(); // Limpia la búsqueda manual si había una
  }
}

function clearSelection() {
  selectedPurchase.value = null;
}

function clearSearch() {
    searched.value = false;
    searchResult.value = null;
    searchCode.value = '';
}

// --- Métodos del Escáner QR ---
function onDecode(decodedString) {
  scanError.value = '';
  searchCode.value = decodedString;
  performSearch();
}

async function onInit(promise) {
  try {
    await promise;
    scanError.value = '';
  } catch (error) {
    // ... manejo de errores ...
    if (error.name === 'NotAllowedError') scanError.value = "ERROR: Permiso de cámara denegado.";
    else if (error.name === 'NotFoundError') scanError.value = "ERROR: No se encontró una cámara.";
    else if (error.name === 'NotSupportedError') scanError.value = "ERROR: Se requiere HTTPS para la cámara.";
    else scanError.value = `ERROR: ${error.message}`;
  }
}

// --- Métodos de Búsqueda ---
function performSearch() {
  if (!searchCode.value) return;
  clearSelection(); // Limpia la selección del historial
  searched.value = true;
  searchResult.value = store.getPurchaseByCode(searchCode.value.trim());
}

// --- Funciones de Formato ---
function formattedDate(dateString) {
  return new Date(dateString).toLocaleString();
}
</script>

<style scoped>
/* Layout Principal */
.main-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 1rem;
}
@media (max-width: 800px) {
  .main-layout {
    grid-template-columns: 1fr;
  }
}
.search-form {
  display: flex;
  gap: 10px;
}
.search-form input {
  flex-grow: 1;
  padding: 10px;
}

/* Columna Izquierda: Área Interactiva */
.interactive-area {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
}
.scanner-container {
  max-width: 400px;
  margin: 1rem auto;
  border-radius: 8px;
  overflow: hidden;
}
.qr-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.qr-code-text {
  font-family: monospace;
  background: #f4f4f4;
  padding: 5px 10px;
  border-radius: 4px;
}
.scan-new-button, .back-button {
  background-color: #007BFF;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 10px;
}
.scan-new-button:hover, .back-button:hover {
  background-color: #0056b3;
}
.error {
  color: #dc3545;
}

/* Columna Derecha: Sidebar */
.sidebar {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
}
.history-subtitle {
  font-size: 0.9em;
  color: #666;
  margin-bottom: 1rem;
}
.purchase-history {
  max-height: 500px;
  overflow-y: auto;
}
.purchase-item {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 5px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}
.purchase-item:hover {
  background-color: #f9f9f9;
  border-color: #ccc;
}
.purchase-item.selected {
  background-color: #e7f3ff;
  border-color: #007BFF;
  font-weight: bold;
}
.purchase-item small {
  color: #555;
  margin-top: 5px;
}
.receipt-details {
  background: #f0f8ff;
  padding: 1rem;
  border-radius: 5px;
}
</style>
