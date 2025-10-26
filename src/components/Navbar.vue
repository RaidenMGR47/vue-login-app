<template>
  <nav class="navbar">
    <div class="nav-left">
      <router-link to="/" class="nav-item">Inicio</router-link>
      <router-link v-if="session.isAdmin" to="/add-movie" class="nav-item">Añadir Película</router-link>
      <router-link v-if="session.isAdmin" to="/manage-movies" class="nav-item">Gestionar Películas</router-link>
      <router-link to="/search" class="nav-item">Buscar / Comprar</router-link>
      <router-link to="/receipt" class="nav-item">Recibo (Código)</router-link>
    </div>
    <div class="nav-right">
      <div v-if="session.username" class="user-session">
        <span class="user-info">Usuario: {{ session.username }} <span v-if="session.isAdmin">(admin)</span></span>
        <button @click="logout" class="nav-item">Cerrar Sesión</button>

        <!-- CAMBIO 1: Añade la clase 'delete-account-btn' a este botón -->
        <button v-if="!session.isAdmin" @click="removeCurrentUser" class="nav-item delete-account-btn">Eliminar cuenta</button>
      </div>
      <div v-else>
        <router-link to="/login" class="nav-item">Iniciar Sesión</router-link>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import store from '../store';

const router = useRouter();
const session = computed(() => store.state.value.session);

function logout() {
  store.logout();
  router.push('/login');
}

function removeCurrentUser() {
  if (window.confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción es irreversible y también borrará tu historial de compras.')) {
    if (store.removeCurrentUser()) {
      alert('Tu cuenta ha sido eliminada.');
      router.push('/');
    }
  }
}
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #2c3e50;
  padding: 0 2rem;
  color: white;
}
.nav-left, .nav-right, .user-session {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.nav-item {
  color: white;
  text-decoration: none;
  padding: 1rem 0;
  border: none;
  background: none;
  font-size: 1em;
  cursor: pointer;
}
.user-info {
  font-weight: 500;
}

/* CAMBIO 2: Añade este bloque de código CSS para darle el color rojo */
.delete-account-btn {
  background-color: #e74c3c; /* Color rojo */
  color: white;
  padding: 8px 12px;
  border-radius: 5px;
  transition: background-color 0.2s;
}

.delete-account-btn:hover {
  background-color: #c0392b; /* Un rojo más oscuro al pasar el ratón */
}
</style>
