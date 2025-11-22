<template>
  <div>
    <h1>Consulta de Recibos</h1>

    <!-- FORMULARIO DE BÚSQUEDA MANUAL -->
    <form @submit.prevent="performSearch" class="search-form">
      <input
        v-model="searchCode"
        placeholder="Introduce un código de recibo para buscarlo..."
        :disabled="isLoading"
      >
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? 'Buscando...' : 'Buscar Manualmente' }}
      </button>
    </form>

    <hr>

    <div class="main-layout">
      <!-- COLUMNA IZQUIERDA: ESCÁNER O VISUALIZADOR DE QR -->
      <div class="interactive-area">
        <!-- Estado 1: Escáner de Cámara (por defecto) -->
        <div v-if="!selectedPurchase">
          <h3>Escanear un Código QR</h3>
          <div class="scanner-container">
            <qrcode-stream @decode="onDecode" @init="onInit" v-if="!isLoading"></qrcode-stream>
            <div v-else class="scanner-placeholder">
              <p>Cargando escáner...</p>
            </div>
          </div>
          <p v-if="scanError" class="error">{{ scanError }}</p>
        </div>

        <!-- Estado 2: Visualizador del QR de una compra seleccionada -->
        <div v-else class="qr-display" ref="qrContainer">
          <h3>QR de tu Compra Seleccionada</h3>
          <p>Película: <strong>{{ selectedPurchase.movieTitle }}</strong></p>
          <p>Asientos: <strong>{{ selectedPurchase.seats ? selectedPurchase.seats.join(', ') : 'N/A' }}</strong></p>
          <qrcode-vue :value="selectedPurchase.code" :size="220" level="H" />
          <p class="qr-code-text">{{ selectedPurchase.code }}</p>
          <button @click="downloadReceiptPDF" class="download-button">Descargar Recibo (PDF)</button>
          <button @click="clearSelection" class="scan-new-button">Volver a Escanear</button>
        </div>
      </div>

      <!-- COLUMNA DERECHA: RESULTADOS O HISTORIAL DE COMPRAS -->
      <div class="sidebar">
        <!-- Si se ha realizado una búsqueda, se muestran los resultados -->
        <div v-if="searched">
          <h3>Resultado de la Búsqueda</h3>
          <div v-if="searchResult" class="receipt-details">
            <p><strong>Código:</strong> {{ searchResult.code }}</p>
            <p><strong>Película:</strong> {{ searchResult.movie_title }}</p>
            <p><strong>Entradas:</strong> {{ searchResult.tickets }}</p>
            <p><strong>Fecha de función:</strong> {{ searchResult.datePurchased }}</p>
            <p><strong>Total:</strong> ${{ searchResult.totalPrice?.toFixed(2) }}</p>
            <p><strong>Fecha de compra:</strong> {{ formattedDate(searchResult.datePurchased) }}</p>
          </div>
          <p v-else-if="!isLoading" class="no-results">No se encontró ningún recibo con el código "{{ searchCode }}".</p>
          <p v-else class="loading-text">Buscando...</p>
          <button @click="clearSearch" class="back-button">Ver Mis Compras</button>
        </div>

        <!-- Si no, se muestra el historial de compras del usuario -->
        <div v-else-if="session.username">
          <h3>Mis Compras</h3>
          <p class="history-subtitle">Haz clic en una compra para ver su código QR</p>

          <div v-if="userPurchases.length > 0" class="purchase-history">
            <div
              v-for="p in userPurchases"
              :key="p.code"
              class="purchase-item"
              :class="{ 'selected': selectedPurchase && selectedPurchase.code === p.code }"
              @click="selectPurchase(p)"
            >
              <strong>{{ p.movieTitle }}</strong>
              <span>Entradas: {{ p.tickets }}</span>
              <span>Total: ${{ p.totalPrice?.toFixed(2) }}</span>
              <span v-if="p.seats && p.seats.length">Asientos: {{ p.seats.join(', ') }}</span>
              <small>{{ formattedDate(p.datePurchased) }}</small>
            </div>
          </div>

          <div v-else-if="isLoading" class="loading-text">
            Cargando compras...
          </div>
          <p v-else class="no-purchases">Aún no tienes compras registradas.</p>
        </div>

        <div v-else class="login-prompt">
          <p>Inicia sesión para ver tu historial de compras.</p>
          <router-link to="/login" class="login-button">Iniciar Sesión</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { QrcodeStream } from 'vue-qrcode-reader';
import QrcodeVue from 'qrcode.vue';
import store from '../store';

// --- Estado del Componente ---
const searchCode = ref('');
const searchResult = ref(null);
const searched = ref(false);
const scanError = ref('');
const selectedPurchase = ref(null);
const isLoading = ref(false);
const userPurchasesList = ref([]);
const qrContainer = ref(null);

// --- Datos del Store ---
const session = computed(() => store.state.value.session);

// --- Watcher para cargar compras cuando el usuario cambia ---
watch(() => session.value.username, async (newUsername) => {
  if (newUsername) {
    await loadUserPurchases();
  } else {
    userPurchasesList.value = [];
  }
});

// --- Cargar compras al montar el componente ---
onMounted(async () => {
  if (session.value.username) {
    await loadUserPurchases();
  }
});

// --- Métodos de Interacción ---
function selectPurchase(purchase) {
  if (selectedPurchase.value && selectedPurchase.value.code === purchase.code) {
    clearSelection();
  } else {
    selectedPurchase.value = purchase;
    clearSearch();
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

// --- Cargar compras del usuario ---
async function loadUserPurchases() {
  if (!session.value.username) return;

  isLoading.value = true;
  try {
    userPurchasesList.value = await store.getPurchasesForUser(session.value.username);
  } catch (err) {
    console.error('Error loading user purchases:', err);
    userPurchasesList.value = [];
  } finally {
    isLoading.value = false;
  }
}

// Computed para las compras del usuario
const userPurchases = computed(() => userPurchasesList.value);

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
    if (error.name === 'NotAllowedError') {
      scanError.value = "ERROR: Permiso de cámara denegado. Por favor, permite el acceso a la cámara.";
    } else if (error.name === 'NotFoundError') {
      scanError.value = "ERROR: No se encontró una cámara en este dispositivo.";
    } else if (error.name === 'NotSupportedError') {
      scanError.value = "ERROR: Se requiere HTTPS para usar la cámara.";
    } else if (error.name === 'NotReadableError') {
      scanError.value = "ERROR: La cámara no está disponible o está siendo usada por otra aplicación.";
    } else if (error.name === 'OverconstrainedError') {
      scanError.value = "ERROR: No se puede acceder a la cámara con las restricciones solicitadas.";
    } else if (error.name === 'StreamApiNotSupportedError') {
      scanError.value = "ERROR: Este navegador no soporta la API de stream.";
    } else {
      scanError.value = `ERROR: ${error.message}`;
    }
  }
}

// --- Métodos de Búsqueda ---
async function performSearch() {
  if (!searchCode.value.trim()) return;

  isLoading.value = true;
  clearSelection();
  searched.value = true;

  try {
    const purchase = await store.getPurchaseByCode(searchCode.value.trim());
    searchResult.value = purchase;

    if (purchase) {
      console.log('Compra encontrada:', purchase);
    } else {
      console.log('Compra no encontrada para código:', searchCode.value);
    }
  } catch (err) {
    console.error('Error searching purchase:', err);
    searchResult.value = null;
  } finally {
    isLoading.value = false;
  }
}

// --- Funciones de Formato ---
function formattedDate(dateString) {
  if (!dateString) return 'Fecha no disponible';
  try {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Fecha inválida';
  }
}

async function downloadReceiptPDF() {
  if (!selectedPurchase.value || !qrContainer.value) {
    console.error('Faltan datos para generar el PDF.')
    return
  }

  const { default: jsPDF } = await import('jspdf')

  const qrCanvas = qrContainer.value.querySelector('canvas')
  if (!qrCanvas) {
    console.error('No se pudo encontrar el elemento canvas del código QR.')
    return
  }

  try {
    const doc = new jsPDF()
    const qrImage = qrCanvas.toDataURL('image/png')
    const p = selectedPurchase.value

    doc.setFontSize(22)
    doc.text('Recibo de Compra de Película', 105, 20, { align: 'center' })
    doc.setFontSize(12)
    doc.text(`Película: ${p.movieTitle}`, 20, 40)
    doc.text(`Fecha de función: ${p.viewingDate}`, 20, 50)
    // doc.text(`Sala: ${p.hallId}`, 20, 60) // Hall name might not be available directly in purchase object, using ID or skipping
    doc.text(`Asientos: ${p.seats ? p.seats.join(', ') : 'N/A'}`, 20, 70)
    doc.text(`Cantidad de entradas: ${p.tickets}`, 20, 80)
    doc.text(`Total pagado: $${p.totalPrice?.toFixed(2)}`, 20, 90)
    doc.setFontSize(16)
    doc.text(`Código de Recibo:`, 105, 110, { align: 'center' })
    doc.setFontSize(20)
    doc.text(`${p.code}`, 105, 120, { align: 'center' })
    doc.addImage(qrImage, 'PNG', 65, 135, 80, 80)
    doc.save(`recibo-${p.code}.pdf`)
  } catch (error) {
    console.error('Error al generar el PDF:', error)
    alert('Hubo un problema al generar el PDF. Por favor, intenta de nuevo.')
  }
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
  margin-bottom: 2rem;
}
.search-form input {
  flex-grow: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1em;
}
.search-form input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}
.search-form button {
  padding: 12px 20px;
  background-color: #007BFF;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}
.search-form button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

/* Columna Izquierda: Área Interactiva */
.interactive-area {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  background: white;
}
.scanner-container {
  max-width: 400px;
  margin: 1rem auto;
  border-radius: 8px;
  overflow: hidden;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.scanner-placeholder {
  padding: 2rem;
  color: #666;
  background: #f8f9fa;
  border-radius: 8px;
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
  padding: 8px 12px;
  border-radius: 4px;
  font-weight: 600;
}
.scan-new-button, .back-button {
  background-color: #007BFF;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 10px;
  font-weight: 600;
}
.download-button {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 10px;
  font-weight: 600;
}
.download-button:hover {
  background-color: #218838;
}
.scan-new-button:hover, .back-button:hover {
  background-color: #0056b3;
}
.error {
  color: #dc3545;
  background: #f8d7da;
  padding: 0.75rem;
  border-radius: 4px;
  margin-top: 1rem;
}

/* Columna Derecha: Sidebar */
.sidebar {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  background: white;
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
  gap: 0.25rem;
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
  padding: 1.5rem;
  border-radius: 5px;
  margin-bottom: 1rem;
}
.receipt-details p {
  margin: 0.5rem 0;
}

.loading-text {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 2rem;
}

.no-results, .no-purchases {
  text-align: center;
  color: #666;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.login-prompt {
  text-align: center;
  padding: 2rem;
}
.login-button {
  display: inline-block;
  margin-top: 1rem;
  padding: 10px 20px;
  background-color: #007BFF;
  color: white;
  text-decoration: none;
  border-radius: 5px;
  font-weight: 600;
}
.login-button:hover {
  background-color: #0056b3;
}
</style>
