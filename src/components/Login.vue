<template>
  <div class="login-container">
    <div class="login-card">
      <h1>Iniciar Sesión</h1>

      <!-- Mensaje que aparece si fuiste redirigido -->
      <p v-if="redirectMessage" class="info-message">{{ redirectMessage }}</p>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">Usuario</label>
          <input id="username" v-model="username" type="text" required>
        </div>
        <div class="form-group">
          <label for="password">Contraseña</label>
          <input id="password" v-model="password" type="password" required>
        </div>

        <p v-if="errorMsg" class="error-message">{{ errorMsg }}</p>

        <button type="submit" class="submit-button">Entrar</button>
      </form>

      <p class="footer-link">
        ¿No tienes una cuenta? <router-link to="/register">Crea una aquí</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router'; // Importa useRoute
import store from '../store';

const username = ref('');
const password = ref('');
const errorMsg = ref('');
const redirectMessage = ref('');

const router = useRouter();
const route = useRoute(); // Obtenemos la información de la ruta actual

// Al cargar el componente, verificamos si fuimos redirigidos
onMounted(() => {
  if (route.query.redirect) {
    redirectMessage.value = 'Por favor, inicia sesión para acceder a esa página.';
  }
});

function handleLogin() {
  errorMsg.value = '';
  const success = store.login(username.value, password.value);

  if (success) {
    // Si el login es exitoso, comprobamos si hay una ruta guardada en el query
    const redirectPath = route.query.redirect;
    if (redirectPath) {
      // Si existe, redirigimos al usuario a esa ruta
      router.push(redirectPath);
    } else {
      // Si no, lo mandamos a la página de inicio por defecto
      router.push('/');
    }
  } else {
    errorMsg.value = 'Usuario o contraseña incorrectos.';
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 50px;
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
}
.form-group {
  margin-bottom: 1rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
}
.form-group input {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
}
.submit-button {
  width: 100%;
  padding: 12px;
  background-color: #007BFF;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1.1em;
  cursor: pointer;
  margin-top: 1rem;
}
.error-message {
  color: #dc3545;
  text-align: center;
}
.info-message {
  color: #0056b3;
  background-color: #e7f3ff;
  border: 1px solid #b3d7ff;
  padding: 1rem;
  border-radius: 6px;
  text-align: center;
}
.footer-link {
  text-align: center;
  margin-top: 1.5rem;
}
</style>
