<template>
  <div class="login-container">
    <div class="login-card">
      <h1>Iniciar Sesión</h1>

      <!-- Mensaje que aparece si fuiste redirigido -->
      <p v-if="redirectMessage" class="info-message">{{ redirectMessage }}</p>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">Usuario</label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            :disabled="isLoading"
          >
        </div>
        <div class="form-group">
          <label for="password">Contraseña</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            :disabled="isLoading"
          >
        </div>

        <p v-if="errorMsg" class="error-message">{{ errorMsg }}</p>

        <button
          type="submit"
          class="submit-button"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Iniciando sesión...' : 'Entrar' }}
        </button>
      </form>

      <p class="footer-link">
        ¿No tienes una cuenta? <router-link to="/register">Crea una aquí</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'LoginView' });

import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import store from '../store';

const username = ref('');
const password = ref('');
const errorMsg = ref('');
const redirectMessage = ref('');
const isLoading = ref(false);

const router = useRouter();
const route = useRoute();

// Al cargar el componente, verificamos si fuimos redirigidos
onMounted(() => {
  if (route.query.redirect) {
    redirectMessage.value = 'Por favor, inicia sesión para acceder a esa página.';
  }
});

async function handleLogin() {
  errorMsg.value = '';
  isLoading.value = true;

  try {
    const success = await store.login(username.value, password.value);

    if (success) {
      console.log('Login exitoso, redirigiendo...');
      const redirectPath = route.query.redirect;
      if (redirectPath) {
        router.push(redirectPath);
      } else {
        router.push('/');
      }
    } else {
      errorMsg.value = 'Usuario o contraseña incorrectos.';
    }
  } catch (error) {
    errorMsg.value = 'Error al conectar con el servidor.';
    console.error('Login error:', error);
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 50px;
  min-height: 80vh;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
}

h1 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2c3e50;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #d0d7de;
  font-size: 1em;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #007BFF;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2);
}

.form-group input:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
  opacity: 0.7;
}

.submit-button {
  width: 100%;
  padding: 12px;
  background-color: #007BFF;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1.1em;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 1rem;
}

.submit-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.submit-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.error-message {
  color: #dc3545;
  text-align: center;
  margin: 1rem 0;
  padding: 0.75rem;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

.info-message {
  color: #0056b3;
  background-color: #e7f3ff;
  border: 1px solid #b3d7ff;
  padding: 1rem;
  border-radius: 6px;
  text-align: center;
  margin-bottom: 1.5rem;
}

.footer-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #6c757d;
}

.footer-link a {
  color: #007BFF;
  text-decoration: none;
  font-weight: 600;
}

.footer-link a:hover {
  text-decoration: underline;
}
</style>
