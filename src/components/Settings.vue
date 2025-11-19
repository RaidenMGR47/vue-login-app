<template>
  <div class="settings-page container">
    <h1>Ajustes</h1>

    <div class="card p-3 mt-3">
      <h5>Cambiar contraseña</h5>
      <form @submit.prevent="onSubmit" class="mt-3">
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

        <button type="submit" class="btn btn-primary" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          Cambiar contraseña
        </button>
      </form>
    </div>

    <div v-if="!session.isAdmin" class="card p-3 mt-3 border-danger">
      <h5 class="text-danger">Eliminar cuenta</h5>
      <p class="mb-2">Al eliminar tu cuenta se borrará toda tu información y tu historial de compras. Esta acción es irreversible.</p>
      <button class="btn btn-outline-danger" @click="showConfirm = true">Eliminar mi cuenta</button>
      <div v-if="deleteError" class="alert alert-danger mt-2 py-2">{{ deleteError }}</div>
      <div v-if="deleteSuccess" class="alert alert-success mt-2 py-2">{{ deleteSuccess }}</div>
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
.settings-page { padding-top: 1rem; }
.card { background: #fff; border-radius: 8px; }

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

