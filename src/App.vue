// ...existing code...
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
import { loadMovies } from './store.js';

// Estado para saber si el usuario ha iniciado sesión
const isLoggedIn = ref(false);
// Estado para alternar entre la vista de login y registro
const showLoginView = ref(true);
// Estado para almacenar el nombre del usuario que inició sesión
const username = ref('');
// Rol del usuario: 'admin' o 'user'
const role = ref('user');

// Vista actual: 'home' | 'add' | 'search' | 'lookup'
const currentView = ref('home');

const currentComponent = computed(() => {
  if (currentView.value === 'add') return AddMovie;
  if (currentView.value === 'search') return SearchMovie;
  if (currentView.value === 'lookup') return ReceiptLookup;
  return Home;
});

// Cambia a la vista de registro
const switchToRegisterView = () => {
  showLoginView.value = false;
};

// Cambia a la vista de login
const switchToLoginView = () => {
  showLoginView.value = true;
};

// Se ejecuta cuando el login es exitoso (evento desde Login.vue)
// Login NO se modificó; asignamos rol automáticamente: username "admin" => admin
const handleLoginSuccess = (loggedInUsername) => {
  isLoggedIn.value = true;
  username.value = loggedInUsername || '';
  role.value = (username.value && username.value.toLowerCase() === 'admin') ? 'admin' : 'user';
  // Exponer usuario actual para componentes que aún usen variable global
  window.__CURRENT_USER_NAME__ = username.value || '';
  // limpiar posible último código viejo
  window.__LAST_PURCHASE_CODE__ = '';
  // cargar al home
  currentView.value = 'home';
};

// Se ejecuta cuando el registro es exitoso (evento desde Register.vue)
const handleRegisterSuccess = () => {
  alert('¡Usuario creado con éxito! Por favor, inicia sesión.');
  showLoginView.value = true;
};

// Cierra la sesión del usuario
const logout = () => {
  isLoggedIn.value = false;
  username.value = '';
  role.value = 'user';
  // limpiar variables globales
  window.__CURRENT_USER_NAME__ = '';
  window.__LAST_PURCHASE_CODE__ = '';
  showLoginView.value = true;
  currentView.value = 'home';
};

const onMovieAdded = () => {
  currentView.value = 'home';
};

const onPurchaseMade = (code) => {
  window.__LAST_PURCHASE_CODE__ = code;
  currentView.value = 'lookup';
};

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

// asegúrate de que haya datos iniciales (opcional)
loadMovies();
</script>

<style>
/* Estilos globales para la aplicación */
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
