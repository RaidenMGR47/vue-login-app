<template>
  <div class="login-root">
    <div class="card">
      <h2>Iniciar sesión</h2>

      <form @submit.prevent="doLogin" class="form">
        <label class="field">
          <div class="label">Usuario</div>
          <input v-model="username" placeholder="Usuario" required />
        </label>

        <label class="field">
          <div class="label">Contraseña</div>
          <input v-model="password" type="password" placeholder="Contraseña" required />
        </label>

        <div class="actions">
          <button type="submit">Entrar</button>
        </div>
      </form>

      <div class="register-link">
        <span class="question" @click="goRegister">¿No tienes una cuenta?</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { authenticateUser } from '../store.js';

const emit = defineEmits(['login-success','show-register']);

const username = ref('');
const password = ref('');

function doLogin() {
  if (!username.value) {
    alert('Introduce el usuario.');
    return;
  }
  // autenticar contra store
  const ok = authenticateUser(username.value, password.value);
  if (!ok) {
    alert('Usuario o contraseña incorrectos.');
    return;
  }
  emit('login-success', username.value);
}

function goRegister() {
  emit('show-register');
}
</script>

<style scoped>
.login-root {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 24px;
}

.card {
  width: 480px;
  max-width: 95%;
  background: #fff;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  padding: 18px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  text-align: center;
}

h2 { margin-bottom: 12px; }

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.field {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* centrar las etiquetas y los inputs */
.label {
  width: 100%;
  text-align: center;
  font-weight: 600;
  margin-bottom: 6px;
}

input {
  width: 100%;
  max-width: 420px;
  padding: 8px 10px;
  border: 1px solid #cfcfcf;
  border-radius: 6px;
  box-sizing: border-box;
  text-align: center; /* centra el texto dentro del input */
}

.actions {
  margin-top: 6px;
}

button {
  padding: 8px 14px;
  border-radius: 6px;
  border: 1px solid #bfbfbf;
  background: #f5f5f5;
  cursor: pointer;
}

.register-link {
  margin-top: 12px;
}

.question {
  color: #0b63d6;
  cursor: pointer;
  text-decoration: underline;
  user-select: none;
}
</style>
