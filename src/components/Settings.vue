<template>
  <div class="settings-page container">
    <h1>Ajustes</h1>

    <!-- VISTA PRINCIPAL: MENÚ DE OPCIONES -->
    <div v-if="currentView === 'menu'" class="settings-menu">
      <div class="row g-4">
        <!-- Panel de Seguridad -->
        <div class="col-md-6">
          <div class="settings-card" @click="currentView = 'password'">
            <div class="icon-wrapper security">
              <i class="bi bi-shield-lock"></i>
            </div>
            <div class="card-content">
              <h3>Seguridad</h3>
              <p>Cambia tu contraseña y asegura tu cuenta.</p>
            </div>
            <div class="arrow-icon">
              <i class="bi bi-chevron-right"></i>
            </div>
          </div>
        </div>

        <!-- Panel de Zona de Peligro (Solo no admins) -->
        <div v-if="!session.isAdmin" class="col-md-6">
          <div class="settings-card danger" @click="currentView = 'delete'">
            <div class="icon-wrapper danger">
              <i class="bi bi-exclamation-triangle"></i>
            </div>
            <div class="card-content">
              <h3>Zona de Peligro</h3>
              <p>Eliminar cuenta y borrar todos los datos.</p>
            </div>
            <div class="arrow-icon">
              <i class="bi bi-chevron-right"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- VISTA: CAMBIAR CONTRASEÑA -->
    <div v-else-if="currentView === 'password'" class="settings-detail">
      <button class="btn-back" @click="currentView = 'menu'">
        <i class="bi bi-arrow-left"></i> Volver a Ajustes
      </button>

      <div class="card p-4 mt-3 shadow-sm">
        <h2 class="mb-4">Cambiar contraseña</h2>
        <form @submit.prevent="onSubmit">
          <div class="mb-3">
            <label for="currentPassword" class="form-label">Contraseña actual</label>
            <input id="currentPassword" type="password" class="form-control" v-model="currentPassword" autocomplete="current-password" />
          </div>

          <div class="mb-3">
            <label for="newPassword" class="form-label">Nueva contraseña</label>
            <input id="newPassword" type="password" class="form-control" v-model="newPassword" autocomplete="new-password" />
          </div>

          <div class="mb-3">
            <label for="confirmPassword" class="form-label">Confirmar nueva contraseña</label>
            <input id="confirmPassword" type="password" class="form-control" v-model="confirmPassword" autocomplete="new-password" />
          </div>

          <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
          <div v-if="success" class="alert alert-success py-2">{{ success }}</div>

          <button type="submit" class="btn btn-primary w-100" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Actualizar Contraseña
          </button>
        </form>
      </div>
    </div>

    <!-- VISTA: ELIMINAR CUENTA -->
    <div v-else-if="currentView === 'delete'" class="settings-detail">
      <button class="btn-back" @click="currentView = 'menu'">
        <i class="bi bi-arrow-left"></i> Volver a Ajustes
      </button>

      <div class="card p-4 mt-3 border-danger shadow-sm">
        <h2 class="text-danger mb-4">Eliminar Cuenta</h2>
        <div class="alert alert-warning">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>Advertencia:</strong> Esta acción es irreversible.
        </div>
        <p>Al eliminar tu cuenta, perderás acceso a:</p>
        <ul>
          <li>Tu historial de compras y tickets.</li>
          <li>Tu perfil y avatar personalizado.</li>
          <li>Todos los datos asociados a tu usuario.</li>
        </ul>

        <div class="mt-4 text-end">
          <button class="btn btn-outline-danger" @click="showConfirm = true">
            Eliminar mi cuenta permanentemente
          </button>
        </div>

        <div v-if="deleteError" class="alert alert-danger mt-3 py-2">{{ deleteError }}</div>
        <div v-if="deleteSuccess" class="alert alert-success mt-3 py-2">{{ deleteSuccess }}</div>
      </div>
    </div>

    <!-- Confirmación modal simple -->
    <div v-if="showConfirm" class="modal-backdrop">
      <div class="modal-card">
        <h5 class="text-danger">Confirmar eliminación</h5>
        <p>¿Estás seguro? Esto eliminará permanentemente tu cuenta y todos tus datos asociados. No se podrá deshacer.</p>
        <div class="d-flex gap-2 justify-content-end mt-3">
          <button class="btn btn-secondary" @click="showConfirm = false" :disabled="deleting">Cancelar</button>
          <button class="btn btn-danger" @click="onDeleteConfirmed" :disabled="deleting">
            <span v-if="deleting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Eliminar cuenta
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'SettingsPage' });

import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import store from '../store.js';

const router = useRouter();
const session = computed(() => store.state.value.session);

// Estado de la vista: 'menu', 'password', 'delete'
const currentView = ref('menu');

onMounted(() => {
  if (!session.value || !session.value.username) {
    router.push({ path: '/login', query: { redirect: '/settings' } });
  }
});

const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');
const success = ref('');

// Eliminar cuenta
const showConfirm = ref(false);
const deleting = ref(false);
const deleteError = ref('');
const deleteSuccess = ref('');

async function onSubmit() {
  error.value = '';
  success.value = '';

  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    error.value = 'Por favor completa todos los campos';
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden';
    return;
  }
  if (newPassword.value.length < 6) {
    error.value = 'La contraseña debe tener al menos 6 caracteres';
    return;
  }

  loading.value = true;
  try {
    await store.changePassword(currentPassword.value, newPassword.value, confirmPassword.value);
    success.value = 'Contraseña cambiada correctamente';
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
    // Opcional: volver al menú después de un éxito
    // setTimeout(() => currentView.value = 'menu', 2000);
  } catch (err) {
    console.error(err);
    error.value = err?.message || 'Error al cambiar la contraseña';
  } finally {
    loading.value = false;
  }
}

async function onDeleteConfirmed() {
  deleteError.value = '';
  deleteSuccess.value = '';
  deleting.value = true;
  try {
    const ok = await store.removeCurrentUser();
    if (ok) {
      deleteSuccess.value = 'Tu cuenta ha sido eliminada.';
      showConfirm.value = false;
      // Redirigir al inicio después de un pequeño retardo
      setTimeout(() => {
        router.push('/');
      }, 800);
    } else {
      deleteError.value = 'No se pudo eliminar la cuenta.';
    }
  } catch (err) {
    console.error(err);
    deleteError.value = err?.message || 'Error al eliminar la cuenta';
  } finally {
    deleting.value = false;
  }
}
</script>

<style scoped>
.settings-page { padding-top: 2rem; max-width: 900px; }

/* Tarjetas del Menú */
.settings-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid #eee;
  height: 100%;
}
.settings-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.08);
}
.settings-card.danger:hover {
  border-color: #fadbd8;
  background-color: #fff5f5;
}

.icon-wrapper {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}
.icon-wrapper.security {
  background-color: #e8f4fd;
  color: #3498db;
}
.icon-wrapper.danger {
  background-color: #fadbd8;
  color: #e74c3c;
}

.card-content h3 {
  margin: 0 0 0.3rem 0;
  font-size: 1.2rem;
  color: #2c3e50;
}
.card-content p {
  margin: 0;
  color: #7f8c8d;
  font-size: 0.95rem;
}

.arrow-icon {
  margin-left: auto;
  color: #bdc3c7;
}

/* Botón Volver */
.btn-back {
  background: none;
  border: none;
  color: #666;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0;
  cursor: pointer;
}
.btn-back:hover {
  color: #2c3e50;
}

/* Modal simple */
.modal-backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.4);
  z-index: 2000;
}
.modal-card {
  background: #fff;
  padding: 1.25rem;
  border-radius: 8px;
  max-width: 520px;
  width: 94%;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}
</style>

