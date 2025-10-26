<template>
  <div>
    <h1>Buscar y Comprar Películas</h1>

    <!-- BARRA DE BÚSQUEDA -->
    <div class="search-bar">
      <input v-model="searchTerm" placeholder="Buscar película por título...">
    </div>

    <!-- CUADRÍCULA DE PELÍCULAS -->
    <div v-if="searchResults.length > 0" class="movie-grid">
      <div v-for="m in searchResults" :key="m.id" class="movie-card">
        <h3>{{ m.title }} <span class="movie-year">({{ m.year }})</span></h3>
        <p class="movie-details">{{ m.genre }} • Precio: ${{ m.price.toFixed(2) }}</p>
        <button class="buy-button" @click="openPurchaseModal(m)">Comprar</button>
      </div>
    </div>
    <p v-else-if="searchTerm">No hay resultados para "{{ searchTerm }}".</p>
    <p v-else>Empieza buscando una película.</p>

    <!-- MODAL DE COMPRA -->
    <div v-if="selectedMovie" class="modal-overlay" @click.self="closePurchaseModal">
      <div class="modal-content">

        <!-- Estado 1: Formulario de Compra -->
        <div v-if="!lastPurchaseCode">
          <h2>Comprar Entradas para: {{ selectedMovie.title }}</h2>
          <div class="purchase-form">
            <label>
              Cantidad de entradas:
              <input type="number" v-model.number="tickets" min="1">
            </label>
            <label>
              Seleccionar día de función:
              <select v-model="viewingDate">
                <option disabled value="">Elige un día</option>
                <option v-for="day in availableDays" :key="day">{{ day }}</option>
              </select>
            </label>
          </div>
          <div v-if="totalPrice > 0" class="total-price">
            Total: ${{ totalPrice.toFixed(2) }}
          </div>
          <div class="modal-actions">
            <button @click="confirmPurchase" :disabled="!viewingDate || tickets <= 0" class="confirm-button">Confirmar y Pagar</button>
            <button @click="closePurchaseModal" class="cancel-button">Cancelar</button>
          </div>
        </div>

        <!-- Estado 2: Compra Exitosa -->
        <div v-else class="purchase-success">
          <h2>¡Compra Exitosa!</h2>
          <p>Guarda tu código de recibo y el QR.</p>
          <p class="receipt-code">Código: <strong>{{ lastPurchaseCode }}</strong></p>

          <div class="qr-container" ref="qrContainer"> <!-- CAMBIO 1: Añadimos una ref al contenedor -->
            <qrcode-vue :value="lastPurchaseCode" :size="180" level="H" />
          </div>

          <div class="modal-actions">
            <button @click="downloadReceiptPDF" class="download-button">Descargar Recibo (PDF)</button>
            <button @click="closePurchaseModal" class="cancel-button">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import QrcodeVue from 'qrcode.vue';
import jsPDF from 'jspdf';
import store from '../store';

// --- Estado del componente ---
const searchTerm = ref('');
const selectedMovie = ref(null);
const tickets = ref(1);
const viewingDate = ref('');
const lastPurchaseCode = ref(null);
const qrContainer = ref(null); // CAMBIO 2: Ref para el contenedor del QR

// --- Lógica de Búsqueda ---
const searchResults = computed(() => {
  if (!searchTerm.value.trim()) {
    return store.state.value.movies;
  }
  return store.state.value.movies.filter(movie =>
    movie.title.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});

// --- Lógica de Compra y Modal ---
const availableDays = computed(() => {
    if (!selectedMovie.value) return [];
    if (!selectedMovie.value.daysAvailable || selectedMovie.value.daysAvailable.length === 0) {
        return ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    }
    return selectedMovie.value.daysAvailable;
});

const totalPrice = computed(() => {
  return selectedMovie.value ? selectedMovie.value.price * tickets.value : 0;
});

function openPurchaseModal(movie) {
  selectedMovie.value = movie;
  tickets.value = 1;
  viewingDate.value = '';
  lastPurchaseCode.value = null;
}

function closePurchaseModal() {
  selectedMovie.value = null;
}

function confirmPurchase() {
  if (!selectedMovie.value || !viewingDate.value || tickets.value <= 0) return;

  const purchaseDetails = {
    username: store.state.value.session.username || 'invitado',
    movieTitle: selectedMovie.value.title,
    movieId: selectedMovie.value.id,
    tickets: tickets.value,
    viewingDate: viewingDate.value,
    totalPrice: totalPrice.value,
  };

  const newPurchase = store.addPurchase(purchaseDetails);
  lastPurchaseCode.value = newPurchase.code;
}

// --- Lógica de Generación de PDF ---
function downloadReceiptPDF() {
  // CAMBIO 3: Lógica de descarga de PDF completamente revisada para mayor robustez
  if (!lastPurchaseCode.value || !selectedMovie.value || !qrContainer.value) {
    console.error('Faltan datos para generar el PDF.');
    return;
  }

  // 1. Buscar el elemento <canvas> dentro del contenedor del QR.
  // Esta es la forma más segura de asegurarse de que tenemos el elemento correcto.
  const qrCanvas = qrContainer.value.querySelector('canvas');

  if (!qrCanvas) {
    console.error('No se pudo encontrar el elemento canvas del código QR.');
    return;
  }

  try {
    // 2. Crear una nueva instancia de jsPDF
    const doc = new jsPDF();
    const qrImage = qrCanvas.toDataURL('image/png');

    // 3. Añadir contenido al PDF
    doc.setFontSize(22);
    doc.text('Recibo de Compra de Película', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Película: ${selectedMovie.value.title}`, 20, 40);
    doc.text(`Fecha de función: ${viewingDate.value}`, 20, 50);
    doc.text(`Cantidad de entradas: ${tickets.value}`, 20, 60);
    doc.text(`Total pagado: $${totalPrice.value.toFixed(2)}`, 20, 70);

    doc.setFontSize(16);
    doc.text(`Código de Recibo:`, 105, 90, { align: 'center' });
    doc.setFontSize(20);
    doc.text(`${lastPurchaseCode.value}`, 105, 100, { align: 'center' });

    // 4. Añadir la imagen del QR al PDF
    doc.addImage(qrImage, 'PNG', 65, 115, 80, 80);

    // 5. Guardar el archivo
    doc.save(`recibo-${lastPurchaseCode.value}.pdf`);

  } catch (error) {
    console.error('Error al generar el PDF:', error);
    alert('Hubo un problema al generar el PDF. Por favor, intenta de nuevo.');
  }
}
</script>

<!-- LOS ESTILOS NO HAN CAMBIADO, SON LOS MISMOS DE LA VERSIÓN ANTERIOR -->
<style scoped>
/* Estilos generales y barra de búsqueda */
.search-bar {
  margin-bottom: 2rem;
}
.search-bar input {
  width: 100%;
  padding: 12px;
  font-size: 1.1em;
  border-radius: 8px;
  border: 1px solid #ccc;
}
/* Cuadrícula de películas */
.movie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}
.movie-card {
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 4px 8px rgba(0,0,0,0.05);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}
.movie-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
}
.movie-card h3 {
  margin-top: 0;
  font-size: 1.4em;
}
.movie-year {
  font-weight: normal;
  color: #666;
}
.movie-details {
  color: #333;
  flex-grow: 1; /* Empuja el botón hacia abajo */
}
.buy-button {
  background-color: #007BFF;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  margin-top: 1rem;
}
.buy-button:hover {
  background-color: #0056b3;
}
/* Estilos del Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}
.purchase-form label {
  display: block;
  margin-bottom: 1rem;
  font-weight: bold;
}
.purchase-form input, .purchase-form select {
  width: 100%;
  padding: 8px;
  margin-top: 4px;
  border-radius: 5px;
  border: 1px solid #ccc;
}
.total-price {
  font-size: 1.5em;
  font-weight: bold;
  text-align: right;
  margin-top: 1rem;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}
.confirm-button, .download-button {
  background-color: #28a745;
  color: white;
}
.cancel-button {
  background-color: #6c757d;
  color: white;
}
.modal-actions button {
  border: none;
  padding: 12px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
}
/* Estilos de la pantalla de éxito */
.purchase-success {
  text-align: center;
}
.receipt-code {
  font-size: 1.2em;
  margin: 1rem 0;
}
.qr-container {
  padding: 15px;
  background: white;
  display: inline-block;
  margin-top: 10px;
  border: 1px solid #ddd;
}
</style>
