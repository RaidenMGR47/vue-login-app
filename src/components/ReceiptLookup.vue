<template>
  <div>
    <h2>Buscar recibo</h2>

    <div v-if="isAdmin">
      <div style="margin-bottom:8px;">
        <input v-model="code" placeholder="Pega el código de compra" />
        <button @click="lookup">Buscar</button>
      </div>

      <div v-if="result" style="margin-top:12px;border:1px solid #ddd;padding:12px;border-radius:6px;text-align:left;">
        <div><strong>Código:</strong> {{ result.code }}</div>
        <div><strong>Usuario:</strong> {{ result.username }}</div>
        <div><strong>Película:</strong> {{ result.movieTitle }}</div>
        <div><strong>Día a ver:</strong> {{ result.viewingDate }}</div>
        <div><strong>Entradas:</strong> {{ result.tickets }}</div>
        <div><strong>Total pagado:</strong> ${{ result.totalPrice.toFixed(2) }}</div>
        <div><strong>Fecha compra:</strong> {{ formattedDate(result.datePurchased) }}</div>
      </div>

      <div v-else-if="searched">No se encontró el recibo.</div>
    </div>

    <div v-else>
      <h3>Mis compras</h3>
      <div v-if="purchases.length === 0">No tienes compras todavía.</div>
      <div v-for="p in purchases" :key="p.code" style="border:1px solid #ddd;padding:8px;margin-bottom:8px;border-radius:6px;text-align:left;">
        <div><strong>Código:</strong> {{ p.code }}</div>
        <div><strong>Película:</strong> {{ p.movieTitle }}</div>
        <div><strong>Día a ver:</strong> {{ p.viewingDate }}</div>
        <div><strong>Entradas:</strong> {{ p.tickets }}</div>
        <div><strong>Total pagado:</strong> ${{ p.totalPrice.toFixed(2) }}</div>
        <div><strong>Fecha compra:</strong> {{ formattedDate(p.datePurchased) }}</div>
      </div>
      <div v-if="purchases.length">Código más reciente: <strong>{{ purchases[0].code }}</strong></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { getPurchaseByCode, getPurchasesForUser } from '../store.js';

const props = defineProps({
  username: { type: String, default: '' },
  role: { type: String, default: 'user' }
});

const code = ref('');
const result = ref(null);
const searched = ref(false);

const isAdmin = computed(() => props.role === 'admin');

const purchases = ref([]);

// Si es usuario, cargar sus compras (las más recientes primero)
function loadUserPurchases() {
  const user = props.username || window.__CURRENT_USER_NAME__ || '';
  if (!user) {
    purchases.value = [];
    return;
  }
  purchases.value = getPurchasesForUser(user).sort((a,b) => new Date(b.datePurchased) - new Date(a.datePurchased));
}

if (!isAdmin.value) {
  loadUserPurchases();
}

// Si cambia username en runtime, recargar
watch(() => props.username, () => {
  if (!isAdmin.value) loadUserPurchases();
});

function lookup() {
  result.value = getPurchaseByCode(code.value.trim());
  searched.value = true;
}

function formattedDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString();
}
</script>

<style scoped>
/* pequeños estilos para mejor presentación */
input {
  padding: 6px 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
  margin-right: 6px;
}
button {
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #bfbfbf;
  background: #f5f5f5;
  cursor: pointer;
}
</style>
