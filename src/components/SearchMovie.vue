<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import QrcodeVue from 'qrcode.vue'
import store from '../store'

const defaultPoster = 'https://placehold.co/400x600/666/FFF?text=Sin+Imagen'
const searchTerm = ref('')
const selectedMovie = ref(null)
const tickets = ref(1)
const viewingDate = ref('')
const selectedHall = ref('')
const lastPurchaseCode = ref(null)
const qrContainer = ref(null)
const isLoading = ref(false)

// Seat Selection State
const selectedSeats = ref([])
const occupiedSeats = ref([])

// Configuration for the specific layout requested
const rows = 2 // Number of rows per section block
const seatsPerSectionRow = 5 // 5 seats per row in each section
const seatsPerSection = rows * seatsPerSectionRow // 10 seats per section

const currentHall = computed(() => {
  if (!selectedHall.value) return null
  return availableHalls.value.find((h) => h.id === selectedHall.value)
})

const sections = computed(() => {
  if (!currentHall.value) return []
  const capacity = currentHall.value.capacity
  const numSections = Math.ceil(capacity / seatsPerSection)
  const result = []
  for (let i = 0; i < numSections; i++) {
    result.push(String.fromCharCode(65 + i)) // A, B, C...
  }
  return result
})

const seatRows = computed(() => {
  const result = []
  // We want to render by visual rows.
  // Visual Row 1: Section A (1-5), Section B (1-5), Section C (1-5)
  // Visual Row 2: Section A (6-10), Section B (6-10), Section C (6-10)

  for (let r = 1; r <= rows; r++) {
    const rowSeats = []
    // For each visual row, we iterate through all sections
    for (const section of sections.value) {
      // Calculate the starting number for this section in this row
      // Formula: ((RowIndex - 1) * seatsPerSectionRow) + 1
      const startNum = (r - 1) * seatsPerSectionRow + 1

      for (let i = 0; i < seatsPerSectionRow; i++) {
        const seatNum = startNum + i
        rowSeats.push(`${section}${seatNum}`)
      }
      // Add a spacer after each section except the last one for visual separation
      if (section !== sections.value[sections.value.length - 1]) {
        rowSeats.push('SPACER')
      }
    }
    result.push(rowSeats)
  }
  return result
})

const searchResults = computed(() => {
  if (!searchTerm.value.trim()) {
    return store.state.value.movies
  }
  return store.state.value.movies.filter((movie) =>
    movie.title.toLowerCase().includes(searchTerm.value.toLowerCase()),
  )
})

const availableHalls = computed(() => {
  if (!selectedMovie.value) return []

  let screenings = movieScreenings.value

  // Si hay fecha seleccionada, filtrar por esa fecha
  if (viewingDate.value) {
    screenings = screenings.filter((s) => s.startTime.startsWith(viewingDate.value))
  }

  const hallIds = [...new Set(screenings.map((s) => s.hallId))]
  return store.state.value.halls.filter((h) => hallIds.includes(h.id))
})

onMounted(() => {
  store.fetchHalls()
  store.fetchScreenings()
})

const movieScreenings = computed(() => {
  if (!selectedMovie.value) return []
  return store.state.value.screenings.filter((s) => s.movieId === selectedMovie.value.id)
})

const availableDays = computed(() => {
  const dates = movieScreenings.value.map((s) => s.startTime.split('T')[0])
  return [...new Set(dates)].sort()
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T00:00:00') // Force local time
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const totalPrice = computed(() => {
  return selectedMovie.value ? selectedMovie.value.price * tickets.value : 0
})

// Watch for changes to fetch occupied seats
watch([viewingDate, selectedHall], async ([newDate, newHall]) => {
  selectedSeats.value = [] // Reset selection
  occupiedSeats.value = []

  if (newDate && newHall && selectedMovie.value) {
    await fetchOccupiedSeats()
  }
})

async function fetchOccupiedSeats() {
  if (!selectedMovie.value || !viewingDate.value || !selectedHall.value) return

  try {
    const params = new URLSearchParams({
      action: 'get_occupied_seats',
      movieId: selectedMovie.value.id,
      viewingDate: viewingDate.value,
      hallId: selectedHall.value,
    })

    const response = await fetch(
      `http://localhost/vue-login-app/backend/vue-cine-api/purchases.php?${params.toString()}`,
    )
    const data = await response.json()

    if (data.success) {
      occupiedSeats.value = data.data.occupiedSeats
    }
  } catch (error) {
    console.error('Error fetching occupied seats:', error)
  }
}

function toggleSeat(seat) {
  if (seat === 'SPACER') return
  if (occupiedSeats.value.includes(seat)) return

  const index = selectedSeats.value.indexOf(seat)
  if (index === -1) {
    // Select seat
    if (selectedSeats.value.length < tickets.value) {
      selectedSeats.value.push(seat)
    } else {
      if (tickets.value === 1) {
        selectedSeats.value = [seat] // Quick switch for single ticket
      } else {
        alert(`Solo puedes seleccionar ${tickets.value} asientos.`)
      }
    }
  } else {
    // Deselect seat
    selectedSeats.value.splice(index, 1)
  }
}

function openPurchaseModal(movie) {
  selectedMovie.value = movie
  tickets.value = 1
  viewingDate.value = ''
  selectedHall.value = ''
  lastPurchaseCode.value = null
  selectedSeats.value = []
  occupiedSeats.value = []
}

function closePurchaseModal() {
  selectedMovie.value = null
}

async function confirmPurchase() {
  if (!selectedMovie.value || !viewingDate.value || !selectedHall.value || tickets.value <= 0)
    return

  if (selectedSeats.value.length !== tickets.value) {
    alert(`Por favor selecciona ${tickets.value} asientos.`)
    return
  }

  isLoading.value = true
  try {
    const purchaseDetails = {
      username: store.state.value.session.username || 'invitado',
      movieTitle: selectedMovie.value.title,
      movieId: selectedMovie.value.id,
      tickets: tickets.value,
      viewingDate: viewingDate.value,
      hallId: selectedHall.value,
      totalPrice: totalPrice.value,
      seats: selectedSeats.value,
    }

    const newPurchase = await store.addPurchase(purchaseDetails)
    lastPurchaseCode.value = newPurchase.code
  } catch (error) {
    alert('Error al procesar la compra: ' + error.message)
    // Refresh seats in case of collision
    fetchOccupiedSeats()
  } finally {
    isLoading.value = false
  }
}

async function downloadReceiptPDF() {
  if (!lastPurchaseCode.value || !selectedMovie.value || !qrContainer.value) {
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

    doc.setFontSize(22)
    doc.text('Recibo de Compra de Película', 105, 20, { align: 'center' })
    doc.setFontSize(12)
    doc.text(`Película: ${selectedMovie.value.title}`, 20, 40)
    doc.text(`Fecha de función: ${viewingDate.value}`, 20, 50)
    doc.text(
      `Sala: ${availableHalls.value.find((h) => h.id === selectedHall.value)?.name || 'N/A'}`,
      20,
      60,
    )
    doc.text(`Asientos: ${selectedSeats.value.join(', ')}`, 20, 70)
    doc.text(`Cantidad de entradas: ${tickets.value}`, 20, 80)
    doc.text(`Total pagado: $${totalPrice.value.toFixed(2)}`, 20, 90)
    doc.setFontSize(16)
    doc.text(`Código de Recibo:`, 105, 110, { align: 'center' })
    doc.setFontSize(20)
    doc.text(`${lastPurchaseCode.value}`, 105, 120, { align: 'center' })
    doc.addImage(qrImage, 'PNG', 65, 135, 80, 80)
    doc.save(`recibo-${lastPurchaseCode.value}.pdf`)
  } catch (error) {
    console.error('Error al generar el PDF:', error)
    alert('Hubo un problema al generar el PDF. Por favor, intenta de nuevo.')
  }
}
</script>

<template>
  <div>
    <h1>Buscar y Comprar Películas</h1>

    <!-- BARRA DE BÚSQUEDA -->
    <div class="search-bar">
      <input v-model="searchTerm" placeholder="Buscar película por título..." />
    </div>

    <!-- CUADRÍCULA DE PELÍCULAS -->
    <div v-if="searchResults.length > 0" class="movie-grid">
      <div v-for="m in searchResults" :key="m.id" class="movie-card">
        <img :src="m.poster || defaultPoster" class="movie-poster" alt="Póster de la película" />
        <div class="movie-info">
          <h3>
            {{ m.title }} <span class="movie-year">({{ m.year }})</span>
          </h3>
          <p class="movie-details">{{ m.genre }} • Precio: ${{ m.price.toFixed(2) }}</p>
          <button class="buy-button" @click="openPurchaseModal(m)">Comprar</button>
        </div>
      </div>
    </div>
    <p v-else-if="searchTerm">No hay resultados para "{{ searchTerm }}".</p>

    <!-- MODAL DE COMPRA -->
    <div v-if="selectedMovie" class="modal-overlay" @click.self="closePurchaseModal">
      <div class="modal-content">
        <!-- Estado 1: Formulario de Compra -->
        <div v-if="!lastPurchaseCode">
          <h2>Comprar Entradas para: {{ selectedMovie.title }}</h2>
          <div class="purchase-form">
            <label>
              Cantidad de entradas:
              <input type="number" v-model.number="tickets" min="1" max="10" />
            </label>
            <label>
              Seleccionar día de función:
              <select v-model="viewingDate">
                <option disabled value="">Elige un día</option>
                <option v-for="date in availableDays" :key="date" :value="date">
                  {{ formatDate(date) }}
                </option>
              </select>
            </label>

            <label>
              Seleccionar Sala:
              <select v-model="selectedHall" :disabled="availableHalls.length === 0">
                <option disabled value="">
                  {{
                    availableHalls.length > 0 ? 'Elige una sala' : 'No hay funciones disponibles'
                  }}
                </option>
                <option v-for="hall in availableHalls" :key="hall.id" :value="hall.id">
                  {{ hall.name }} (Cap: {{ hall.capacity }})
                </option>
              </select>
            </label>

            <!-- SEAT SELECTION GRID -->
            <div v-if="viewingDate && selectedHall" class="seat-selection">
              <h3>Selecciona tus asientos ({{ selectedSeats.length }}/{{ tickets }})</h3>
              <div class="screen-indicator">PANTALLA</div>
              <div class="seat-grid">
                <div v-for="(row, rowIndex) in seatRows" :key="rowIndex" class="seat-row">
                  <template v-for="(seat, seatIndex) in row" :key="seatIndex">
                    <div v-if="seat === 'SPACER'" class="seat-spacer"></div>
                    <div
                      v-else
                      class="seat"
                      :class="{
                        occupied: occupiedSeats.includes(seat),
                        selected: selectedSeats.includes(seat),
                      }"
                      @click="toggleSeat(seat)"
                    >
                      {{ seat }}
                    </div>
                  </template>
                </div>
              </div>
              <div class="seat-legend">
                <div class="legend-item">
                  <div class="seat available-legend"></div>
                  Libre
                </div>
                <div class="legend-item">
                  <div class="seat selected"></div>
                  Seleccionado
                </div>
                <div class="legend-item">
                  <div class="seat occupied"></div>
                  Ocupado
                </div>
              </div>
            </div>
          </div>
          <div v-if="totalPrice > 0" class="total-price">Total: ${{ totalPrice.toFixed(2) }}</div>
          <div class="modal-actions">
            <button
              @click="confirmPurchase"
              :disabled="
                !viewingDate ||
                !selectedHall ||
                tickets <= 0 ||
                isLoading ||
                selectedSeats.length !== tickets
              "
              class="confirm-button"
            >
              {{ isLoading ? 'Procesando...' : 'Confirmar y Pagar' }}
            </button>
            <button @click="closePurchaseModal" class="cancel-button">Cancelar</button>
          </div>
        </div>
        <!-- Estado 2: Compra Exitosa -->
        <div v-else class="purchase-success">
          <h2>¡Compra Exitosa!</h2>
          <p>Guarda tu código de recibo y el QR.</p>
          <p class="receipt-code">
            Código: <strong>{{ lastPurchaseCode }}</strong>
          </p>
          <p>
            Asientos: <strong>{{ selectedSeats.join(', ') }}</strong>
          </p>
          <div class="qr-container" ref="qrContainer">
            <qrcode-vue :value="lastPurchaseCode" :size="180" level="H" />
          </div>
          <div class="modal-actions">
            <button @click="downloadReceiptPDF" class="download-button">
              Descargar Recibo (PDF)
            </button>
            <button @click="closePurchaseModal" class="cancel-button">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Los estilos permanecen iguales */
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
.movie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
}
.movie-card {
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.movie-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}
.movie-poster {
  width: 100%;
  height: 330px;
  object-fit: cover;
}
.movie-info {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
.movie-info h3 {
  margin-top: 0;
  font-size: 1.2em;
}
.movie-details {
  flex-grow: 1;
}
.buy-button {
  margin-top: 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 5px;
  cursor: pointer;
}
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
  max-width: 800px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}
.purchase-form label {
  display: block;
  margin-bottom: 1rem;
  font-weight: bold;
}
.purchase-form input,
.purchase-form select {
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
.confirm-button,
.download-button {
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

/* Seat Selection Styles */
.seat-selection {
  margin-top: 1.5rem;
  text-align: center;
}
.screen-indicator {
  background: #ddd;
  padding: 5px;
  margin-bottom: 15px;
  font-size: 0.8em;
  letter-spacing: 2px;
  border-radius: 5px;
}
.seat-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  /* align-items: center; Removed to prevent clipping of first section */
  overflow-x: auto;
  padding-bottom: 10px;
  width: 100%;
}
.seat-row {
  display: flex;
  gap: 5px;
  align-items: center;
  margin: 0 auto; /* Centers the row if it fits, allows scrolling if it doesn't */
  min-width: min-content;
}
.seat-spacer {
  width: 20px;
  flex-shrink: 0; /* Prevent spacer from collapsing */
} /* Space between sections */
.seat {
  width: 40px;
  height: 40px;
  background-color: #28a745; /* Green for available */
  border: 1px solid #218838;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.8em;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
  color: white;
  font-weight: bold;
}
.seat:hover:not(.occupied) {
  transform: scale(1.1);
}
.seat.selected {
  background-color: #007bff;
  border-color: #0056b3;
} /* Blue for selected */
.seat.occupied {
  background-color: #dc3545;
  border-color: #c82333;
  cursor: not-allowed;
  opacity: 0.6;
} /* Red for occupied */
.seat.available-legend {
  background-color: #28a745;
}

.seat-legend {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 15px;
  font-size: 0.9em;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}
.legend-item .seat {
  width: 20px;
  height: 20px;
  font-size: 0;
}
</style>
