<template>
  <div class="form-container">
    <h2>Iniciar Sesión</h2>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="username">Nombre de Usuario:</label>
        <input type="text" id="username" v-model="username" required />
      </div>
      <div class="form-group">
        <label for="password">Contraseña:</label>
        <input type="password" id="password" v-model="password" required />
      </div>
      <button type="submit">Iniciar Sesión</button>
    </form>
    <p>
      ¿No tienes una cuenta?
      <button @click="$emit('show-register')">Crear Usuario</button>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const username = ref('');
const password = ref('');
const emit = defineEmits(['login-success', 'show-register']);

const handleLogin = () => {
  // Aquí iría la lógica de autenticación real
  // Por ahora, simularemos un inicio de sesión exitoso si los campos no están vacíos
  if (username.value && password.value) {
    emit('login-success', username.value);
  }
};
</script>

<style scoped>
/* Agrega estilos básicos para el formulario si lo deseas */
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
</style>