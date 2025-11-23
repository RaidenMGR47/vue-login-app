<template>
  <nav class="navbar">
    <div class="nav-left">
      <router-link to="/" class="nav-item">
        <i class="bi bi-house-door me-1"></i>Inicio
      </router-link>
      <router-link v-if="session.isAdmin" to="/add-movie" class="nav-item">
        <i class="bi bi-plus-circle me-1"></i>Añadir Película
      </router-link>
      <router-link v-if="session.isAdmin" to="/manage-movies" class="nav-item">
        <i class="bi bi-gear me-1"></i>Gestionar Películas
      </router-link>
      <router-link v-if="session.isAdmin" to="/manage-halls" class="nav-item">
        <i class="bi bi-grid-3x3 me-1"></i>Salas
      </router-link>
      <router-link v-if="session.isAdmin" to="/schedule-movie" class="nav-item">
        <i class="bi bi-calendar-event me-1"></i>Programar
      </router-link>
      <router-link v-if="session.isAdmin" to="/admin/stats" class="nav-item">
        <i class="bi bi-bar-chart-line me-1"></i>Estadísticas
      </router-link>
      <router-link to="/search" class="nav-item">
        <i class="bi bi-search me-1"></i>Buscar / Comprar
      </router-link>
      <router-link to="/receipt" class="nav-item">
        <i class="bi bi-receipt me-1"></i>Recibo (Código)
      </router-link>
    </div>
    <div class="nav-right">
      <div v-if="session.username" class="user-session">
        <div class="profile-dropdown">
          <button class="nav-item profile-button" @click.stop.prevent="toggleMenu" :aria-expanded="menuOpen" aria-haspopup="true">
            <img :src="avatarUrl" alt="avatar" class="nav-avatar me-1" />
            {{ session.username }}
            <span v-if="session.isAdmin">(admin)</span>
            <i class="bi bi-caret-down-fill ms-2"></i>
          </button>

            <div v-if="menuOpen" class="dropdown-menu-custom">
            <router-link to="/profile" class="dropdown-item" @click="closeMenu">
              <i class="bi bi-person me-2"></i>Perfil
            </router-link>
            <router-link to="/settings" class="dropdown-item" @click="closeMenu">
              <i class="bi bi-gear me-2"></i>Ajustes
            </router-link>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item logout-item" @click="handleLogout">
              <i class="bi bi-box-arrow-right me-2"></i>Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
      <div v-else>
        <router-link to="/login" class="nav-item">
          <i class="bi bi-box-arrow-in-right me-1"></i>Iniciar Sesión
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script setup>
defineOptions({ name: 'AppNavbar' });

import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import store from '../store';

const router = useRouter();
const session = computed(() => store.state.value.session);

// Estado para controlar el menú desplegable
const menuOpen = ref(false);

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

function closeMenu() {
  menuOpen.value = false;
}

function handleLogout() {
  store.logout();
  closeMenu();
  router.push('/login');
}

function confirmAndRemove() {
  if (!session.value.username) return;
  if (!window.confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción es irreversible y también borrará tu historial de compras.')) return;

  // removeCurrentUser devuelve una promesa (async). Manejar resultado.
  const res = store.removeCurrentUser();
  // Puede ser sync o async; soportamos ambas posibilidades
  if (res && typeof res.then === 'function') {
    res.then((ok) => {
      if (ok) {
        alert('Tu cuenta ha sido eliminada.');
        closeMenu();
        router.push('/');
      }
    });
  } else {
    if (res) {
      alert('Tu cuenta ha sido eliminada.');
      closeMenu();
      router.push('/');
    }
  }
}

// Cerrar el menú al hacer clic fuera
function onDocumentClick(e) {
  const target = e.target;
  const el = document.querySelector('.profile-dropdown');
  if (!el) return;
  if (!el.contains(target)) {
    closeMenu();
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick);
});

// Avatar para el usuario (preferir avatar guardado en session, si no usar ui-avatars)
const avatarUrl = computed(() => {
  const avatar = session.value.avatar;
  if (avatar) return avatar;
  const name = session.value.username || '';
  if (!name) return 'https://placehold.co/40x40/666/FFF?text=?';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2c3e50&color=fff&rounded=true&size=128`;
});
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
  display: flex;
  align-items: center;
  transition: color 0.2s;
}
.nav-item:hover {
  color: #3498db;
}
.user-info {
  font-weight: 500;
  display: flex;
  align-items: center;
}

/* Estilos para el botón de eliminar cuenta */
.delete-account-btn {
  background-color: #e74c3c;
  color: white;
  padding: 8px 12px;
  border-radius: 5px;
  transition: background-color 0.2s;
}

.delete-account-btn:hover {
  background-color: #c0392b;
  color: white;
}

/* Asegurar que los iconos tengan el mismo tamaño */
.bi {
  font-size: 1.1em;
}

/* Dropdown personalizado para el perfil */
.profile-dropdown { position: relative; }
.profile-button { display: inline-flex; align-items: center; gap: .4rem; }
.profile-button .bi { font-size: 1.1em; }
.nav-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,0.12); }

.dropdown-menu-custom {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  background: white;
  color: #2c3e50;
  border-radius: 8px;
  min-width: 180px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.12);
  padding: 6px 0;
  z-index: 1200;
}
.dropdown-item {
  display: flex;
  align-items: center;
  gap: .6rem;
  padding: 10px 14px;
  color: #2c3e50;
  background: transparent;
  border: none;
  text-decoration: none;
  width: 100%;
  box-sizing: border-box;
}
.dropdown-item:hover { background: #f5f7fa; color: #0b5ed7; }
.dropdown-divider { height: 1px; background: #e9ecef; margin: 6px 0; }
.logout-item { text-align: left; cursor: pointer; }
.delete-item { color: #e74c3c; }

/* Ajustes para que los enlaces dentro del menú no se muestren como link azul */
.dropdown-item.router-link-active { font-weight: 600; }
</style>
