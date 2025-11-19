<template>
  <div class="profile-page">
    <div class="container profile-banner-container">
      <div class="banner rounded-3 mb-0"></div>

      <div class="profile-header d-flex align-items-end pt-0">
        <div class="avatar-wrap">
          <img :src="preview || avatarUrl" alt="Avatar" class="avatar shadow" @click="onAvatarClick" style="cursor:pointer" />
          <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="onFileChange" />
          <div v-if="isUploading" class="small text-muted mt-1">Subiendo...</div>
          <div v-if="uploadSuccess" class="small text-success mt-1">{{ uploadSuccess }}</div>
          <div v-if="uploadError" class="small text-danger mt-1">{{ uploadError }}</div>
        </div>

        <div class="profile-info flex-grow-1">
          <h1 class="username mb-1">{{ username }}</h1>
          <div class="d-flex gap-2 mb-3">
            <button class="btn btn-dark btn-sm">Follow</button>
            <button class="btn btn-outline-secondary btn-sm">Message</button>
            <button class="btn btn-outline-secondary btn-sm">Report</button>
          </div>

          <div class="meta text-muted small">
            <div><strong>User ID</strong></div>
            <div class="mb-2">{{ userId }}</div>
            <div><strong>Connections</strong></div>
            <div>No connected accounts</div>
          </div>
        </div>
      </div>
    </div>

    <div class="container mt-4">
      <div class="card p-3">
        <p class="mb-0">This is a simple profile placeholder. Here the user will be able to change avatar and profile details later.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'UserProfile' });

import { computed, ref, onUnmounted, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import store from '../store';

const session = computed(() => store.state.value.session);

const router = useRouter();

onMounted(() => {
  // Si no hay usuario en la sesión, redirigir al login
  if (!session.value || !session.value.username) {
    router.push({ path: '/login', query: { redirect: '/profile' } });
  }
});

const username = computed(() => session.value.username || 'Invitado');
const userId = computed(() => {
  return session.value.username ? `user-${session.value.username}` : 'N/A';
});

// Preferir avatar guardado en la sesión (URL), si no, usar ui-avatars
const avatarUrl = computed(() => {
  if (session.value.avatar) return session.value.avatar;
  if (session.value.username) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(session.value.username)}&background=2c3e50&color=fff&rounded=true&size=256`;
  }
  return 'https://placehold.co/160x160/333/FFF?text=?';
});

// File upload handling
const fileInput = ref(null);
const preview = ref(null);
const isUploading = ref(false);
const uploadSuccess = ref('');
const uploadError = ref('');

function onAvatarClick() {
  uploadError.value = '';
  uploadSuccess.value = '';
  if (fileInput.value) fileInput.value.click();
}

function onFileChange(e) {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  // preview
  if (preview.value) URL.revokeObjectURL(preview.value);
  preview.value = URL.createObjectURL(f);
  // subir inmediatamente
  uploadFile(f);
}

async function uploadFile(file) {
  isUploading.value = true;
  try {
    const res = await store.uploadAvatar(file);
    if (res && res.ok) {
      uploadSuccess.value = 'Avatar actualizado correctamente.';
    } else {
      uploadError.value = res.message || 'Error al subir avatar';
    }
  } catch (err) {
    uploadError.value = err.message || String(err);
  } finally {
    isUploading.value = false;
    // limpiar preview después de unos segundos
    setTimeout(() => { if (preview.value) { URL.revokeObjectURL(preview.value); preview.value = null; } }, 3000);
  }
}

onUnmounted(() => {
  if (preview.value) URL.revokeObjectURL(preview.value);
});
</script>

<style scoped>
.banner {
  height: 160px;
  background: linear-gradient(90deg,#6b6ecf 0%,#a88fe6 100%);
  margin-top: 1rem;
  /* aumentar espacio inferior para que el contenido no choque */
  padding-bottom: 56px;
  position: relative;
}
.profile-header {
  /* reducir la superposición: bajar el bloque principal aún más */
  margin-top: -8px; /* menos negativo = contenido más abajo */
  padding-bottom: 12px;
  position: relative;
  z-index: 5; /* keep header above banner */
}
.profile-banner-container { position: relative; }
.avatar-wrap { position: absolute; left: 18px; top: 18px; z-index: 20; }
.avatar { width: 120px; height: 120px; border-radius: 50%; border: 6px solid #fff; object-fit: cover; box-shadow: 0 6px 18px rgba(0,0,0,0.12); }
.username { margin: 0; font-size: 1.8rem; font-weight: 700; }
.profile-info { margin-top: 12px; padding-left: 160px; }
.card { background: #fff; border-radius: 8px; border: 1px solid #e9ecef; }

/* Responsive tweaks */
@media (max-width: 992px) {
  .profile-info { padding-left: 140px; }
}

@media (max-width: 768px) {
  .banner { height: 140px; }
  .avatar { width: 88px; height: 88px; }
  .username { font-size: 1.5rem; }
  .profile-header { margin-top: -28px; }
  .profile-info { padding-left: 0; margin-top: 8px; }
  .avatar-wrap { left: 12px; top: 12px; }
}
</style>
