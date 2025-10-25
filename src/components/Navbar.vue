<template>
  <nav class="navbar">
    <div class="nav-links">
      <router-link to="/">Inicio</router-link>
      <!-- v-if ahora usa el estado reactivo del store -->
      <router-link v-if="session.isAdmin" to="/add-movie">Añadir Película</router-link>
      <router-link v-if="session.username" to="/search">Buscar / Comprar</router-link>
      <router-link v-if="session.username" to="/receipt">Recibo (Código)</router-link>
    </div>
    <div class="nav-session">
      <span v-if="session.username">Usuario: {{ session.username }} <b v-if="session.isAdmin">(admin)</b></span>
      <router-link v-if="!session.username" to="/login">Iniciar Sesión</router-link>
      <a href="#" v-if="session.username" @click="handleLogout">Cerrar Sesión</a>
      <a href="#" v-if="session.username && !session.isAdmin" @click="handleDeleteAccount">Eliminar cuenta</a>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import store from '../store';

const router = useRouter();

// Usamos computed para obtener una referencia reactiva a la sesión
const session = computed(() => store.state.value.session);

const handleLogout = () => {
  store.logout();
  router.push('/login'); // Redirigir al login
};

const handleDeleteAccount = () => {
  // Siempre es bueno pedir confirmación para acciones destructivas
  if (confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción es irreversible.')) {
    store.removeCurrentUser();
    router.push('/login');
  }
};
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  padding: 1rem 2rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}
.nav-links a, .nav-session a, .nav-session span {
  margin-right: 15px;
  text-decoration: none;
  color: var(--primary-color);
}
.nav-links a.router-link-active {
  font-weight: bold;
}
</style>
