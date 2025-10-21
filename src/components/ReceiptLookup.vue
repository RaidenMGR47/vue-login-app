// ...existing code...
<template>
  <div>
    <h2>Buscar recibo</h2>

    <div v-if="isAdmin">
      <div style="margin-bottom:8px;">
        <input v-model="code" placeholder="Pega el código de compra" />
        <button @click="lookup">Buscar</button>
        <button @click="fillLast" title="Usar último código generado">Último código</button>
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
import { ref, computed, watch, onMounted } from 'vue';
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

// Si hay un último código global (por ejemplo justo después de comprar),
// y el usuario es admin, permitir rellenarlo rápidamente; si el usuario normal
// llegó después de comprar, sus compras ya aparecen en la lista.
function fillLast() {
  const last = window.__LAST_PURCHASE_CODE__ || '';
  if (!last) {
    alert('No hay código reciente disponible.');
    return;
  }
  code.value = last;
  lookup();
}

// opcional: si admin entra y existe __LAST_PURCHASE_CODE__, pre-llenar (no obligatorio)
onMounted(() => {
  if (isAdmin.value && window.__LAST_PURCHASE_CODE__) {
    code.value = window.__LAST_PURCHASE_CODE__;
    // no ejecutar lookup automático para no sorprender al usuario; queda disponible en "Último código"
  }
});
</script>
