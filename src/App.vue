<template>
  <div id="app">
    <div v-if="!isLoggedIn">
      <Login
        v-if="showLoginView"
        @login-success="handleLoginSuccess"
        @show-register="switchToRegisterView"
      />
      <Register
        v-else
        @register-success="handleRegisterSuccess"
        @show-login="switchToLoginView"
      />
    </div>

    <div v-else>
      <Navbar
        :username="username"
        :role="role"
        @change-view="currentView = $event"
        @logout="logout"
        @delete-account="confirmDeleteAccount"
      />

      <div style="padding:16px;">
        <component :is="currentComponent"
                   :role="role"
                   :username="username"
                   @movie-added="onMovieAdded"
                   @purchase-made="onPurchaseMade" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import Login from './components/Login.vue';
import Register from './components/Register.vue';
import Navbar from './components/Navbar.vue';
import Home from './components/Home.vue';
import AddMovie from './components/AddMovie.vue';
import SearchMovie from './components/SearchMovie.vue';
import ReceiptLookup from './components/ReceiptLookup.vue';
import { loadMovies, removePurchasesForUser, removeUser } from './store.js';

const isLoggedIn = ref(false);
const showLoginView = ref(true);
const username = ref('');
const role = ref('user');
const currentView = ref('home');

const currentComponent = computed(() => {
  if (currentView.value === 'add') return AddMovie;
  if (currentView.value === 'search') return SearchMovie;
  if (currentView.value === 'lookup') return ReceiptLookup;
  return Home;
});

const switchToRegisterView = () => showLoginView.value = false;
const switchToLoginView = () => showLoginView.value = true;

const handleLoginSuccess = (loggedInUsername) => {
  isLoggedIn.value = true;
  username.value = loggedInUsername || '';
  role.value = (username.value && username.value.toLowerCase() === 'admin') ? 'admin' : 'user';
  window.__CURRENT_USER_NAME__ = username.value || '';
  window.__LAST_PURCHASE_CODE__ = '';
  currentView.value = 'home';
};

const handleRegisterSuccess = () => {
  // Mensaje de éxito ya se muestra en Register.vue — aquí solo volvemos a la vista de login
  showLoginView.value = true;
};

const logout = () => {
  isLoggedIn.value = false;
  username.value = '';
  role.value = 'user';
  window.__CURRENT_USER_NAME__ = '';
  window.__LAST_PURCHASE_CODE__ = '';
  showLoginView.value = true;
  currentView.value = 'home';
};

const onMovieAdded = () => currentView.value = 'home';
const onPurchaseMade = (purchase) => currentView.value = 'lookup';

// Confirmar y eliminar cuenta (solo para usuarios normales)
async function confirmDeleteAccount() {
  if (role.value === 'admin') {
    alert('El administrador no puede eliminar la cuenta desde aquí.');
    return;
  }
  const ok = window.confirm('¿Estás seguro que deseas eliminar tu cuenta? Esta acción eliminará tus compras y cerrará sesión.');
  if (!ok) return;

  try {
    await removePurchasesForUser(username.value);
    await removeUser(username.value);
  } catch (err) {
    console.error('Error al eliminar datos del usuario:', err);
  }

  alert('Cuenta eliminada.');
  logout();
}

// Escuchar evento global enviado por SearchMovie (purchase-made) para redirigir y pasar código
function onGlobalPurchase(e) {
  const detail = e?.detail;
  if (detail && detail.code) {
    window.__LAST_PURCHASE_CODE__ = detail.code;
    currentView.value = 'lookup';
  }
}

onMounted(() => {
  window.addEventListener('purchase-made', onGlobalPurchase);
});

onBeforeUnmount(() => {
  window.removeEventListener('purchase-made', onGlobalPurchase);
});

loadMovies();
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 20px;
}
button {
  margin: 5px;
  padding: 8px 12px;
  cursor: pointer;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #f0f0f0;
}
</style>
