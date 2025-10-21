<template>
  <div class="form-container">
    <h2>Crear Usuario</h2>
    <form @submit.prevent="handleRegister">
      <div class="form-group">
        <label for="new-username">Nombre de Usuario:</label>
        <input type="text" id="new-username" v-model="newUsername" required />
      </div>
      <div class="form-group">
        <label for="new-password">Contraseña:</label>
        <input type="password" id="new-password" v-model="newPassword" required />
      </div>
      <div class="form-group">
        <label for="confirm-password">Confirmar Contraseña:</label>
        <input type="password" id="confirm-password" v-model="confirmPassword" required />
      </div>
      <p v-if="passwordMismatch" class="error">Las contraseñas no coinciden.</p>
      <button type="submit">Crear Usuario</button>
    </form>
    <p>
      ¿Ya tienes una cuenta?
      <button @click="$emit('show-login')">Iniciar Sesión</button>
    </p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const newUsername = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const emit = defineEmits(['register-success', 'show-login']);

const passwordMismatch = computed(() => {
  return newPassword.value && confirmPassword.value && newPassword.value !== confirmPassword.value;
});

const handleRegister = () => {
  if (newPassword.value === confirmPassword.value && newUsername.value) {
    // Aquí registrarías al usuario
    // Por ahora, emitimos un evento de éxito
    emit('register-success');
  }
};
</script>

<style scoped>
.form-container {
  max-width: 300px;
  margin: auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
}
.form-group {
  margin-bottom: 15px;
}
label {
  display: block;
  margin-bottom: 5px;
}
input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}
.error {
  color: red;
}
</style>