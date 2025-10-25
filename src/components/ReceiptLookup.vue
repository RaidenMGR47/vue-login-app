<template>
  <div class="receipt-container">
    <!-- Sección para Buscar un Recibo por Código -->
    <div class="lookup-section">
      <h2>Buscar recibo</h2>
      <form @submit.prevent="findReceipt" class="lookup-form">
        <input
          type="text"
          v-model="searchCode"
          placeholder="Introduce tu código de compra..."
        />
        <button type="submit">Buscar</button>
      </form>

      <!-- Resultado de la búsqueda de recibo -->
      <div v-if="searchResult" class="receipt-card">
        <h3>Detalles del Recibo</h3>
        <p><strong>Código:</strong> {{ searchResult.code }}</p>
        <p><strong>Usuario:</strong> {{ searchResult.username }}</p>
        <p><strong>Película:</strong> {{ searchResult.movieTitle }}</p>
        <p><strong>Día a ver:</strong> {{ searchResult.viewingDate }}</p>
        <p><strong>Entradas:</strong> {{ searchResult.tickets }}</p>
        <p><strong>Total pagado:</strong> ${{ searchResult.totalPrice.toFixed(2) }}</p>
        <p><strong>Fecha compra:</strong> {{ formattedDate(searchResult.datePurchased) }}</p>
      </div>

      <!-- Mensaje si no se encuentra el recibo -->
      <p v-if="searched && !searchResult" class="no-result-message">
        No se encontró ningún recibo con el código "{{ searchCode }}".
      </p>
    </div>

    <!-- Sección para Mostrar las Compras del Usuario Actual -->
    <div class="user-purchases-section">
      <h2>Mis compras</h2>

      <!-- Se muestra solo si el usuario tiene compras -->
      <div v-if="userPurchases.length > 0">
        <p class="latest-code-info" v-if="userPurchases[0]">
          Tu código más reciente es: <strong>{{ userPurchases[0].code }}</strong>
        </p>
        <div class="purchases-grid">
          <div v-for="p in userPurchases" :key="p.code" class="receipt-card">
            <p><strong>Código:</strong> {{ p.code }}</p>
            <p><strong>Película:</strong> {{ p.movieTitle }}</p>
            <p><strong>Día a ver:</strong> {{ p.viewingDate }}</p>
            <p><strong>Entradas:</strong> {{ p.tickets }}</p>
            <p><strong>Total pagado:</strong> ${{ p.totalPrice.toFixed(2) }}</p>
            <p><strong>Fecha compra:</strong> {{ formattedDate(p.datePurchased) }}</p>
          </div>
        </div>
      </div>

      <!-- Mensaje si el usuario no tiene compras -->
      <p v-else class="no-result-message">
        No tienes compras todavía.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
// 1. Importar el store completo
import store from '../store';

// --- Estado para la Búsqueda de Recibo ---
const searchCode = ref('');
const searchResult = ref(null);
const searched = ref(false); // Para saber si ya se realizó una búsqueda

// --- Lógica para las Compras del Usuario ---
// Obtenemos el nombre de usuario de la sesión del store
const currentUsername = computed(() => store.state.value.session.username);

// Creamos una lista reactiva de las compras del usuario.
// Se actualizará automáticamente si el usuario realiza una nueva compra.
const userPurchases = computed(() => {
  if (currentUsername.value) {
    // 2. Llamamos al método .getPurchasesForUser() del store
    return store.getPurchasesForUser(currentUsername.value);
  }
  return [];
});

// --- Métodos ---
function findReceipt() {
  searched.value = true;
  if (!searchCode.value.trim()) {
    searchResult.value = null;
    return;
  }
  // 3. Llamamos al método .getPurchaseByCode() del store
  searchResult.value = store.getPurchaseByCode(searchCode.value.trim());
}

// Función auxiliar para formatear la fecha a un formato legible
function formattedDate(isoString) {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
</script>

<style scoped>
.receipt-container {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.lookup-form {
  display: flex;
  gap: 10px;
  margin-bottom: 1.5rem;
}
.lookup-form input {
  flex-grow: 1;
  padding: 0.5rem;
  font-size: 1rem;
}
.lookup-form button {
  padding: 0.5rem 1rem;
}

.receipt-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  background-color: #f9f9f9;
}
.receipt-card p {
  margin: 0.5rem 0;
}

.user-purchases-section .latest-code-info {
  background-color: #e2f3ff;
  border: 1px solid #b6d4fe;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
}

.purchases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.no-result-message {
  color: #6c757d;
}
</style>
