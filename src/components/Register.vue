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
import { addUser, getUser } from '../store.js';

const newUsername = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const emit = defineEmits(['register-success', 'show-login']);

const passwordMismatch = computed(() => {
  return newPassword.value && confirmPassword.value && newPassword.value !== confirmPassword.value;
});

const handleRegister = () => {
  if (!newUsername.value) {
    alert('Introduce un nombre de usuario.');
    return;
  }
  if (passwordMismatch.value) {
    alert('Las contraseñas no coinciden.');
    return;
  }
  // comprobar si ya existe
  const existing = getUser(newUsername.value);
  if (existing) {
    alert('El nombre de usuario ya existe. Elige otro.');
    return;
  }
  const ok = addUser({ username: newUsername.value, password: newPassword.value });
  if (ok) {
    alert('Usuario creado con éxito. Ahora puedes iniciar sesión.');
    emit('register-success');
    // opcional: limpiar campos
    newUsername.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
  } else {
    alert('No se pudo crear el usuario.');
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
button {
  margin-top: 8px;
  padding: 8px 12px;
  cursor: pointer;
}
</style>
