<template>
  <div class="register-container">
    <h2>Crear Usuario</h2>

    <!-- Usamos @submit.prevent para manejar el envío del formulario sin recargar la página -->
    <form @submit.prevent="handleRegister">
      <div class="form-group">
        <label for="username">Nombre de Usuario:</label>
        <input id="username" type="text" v-model="username" required />
      </div>

      <div class="form-group">
        <label for="password">Contraseña:</label>
        <input id="password" type="password" v-model="password" required />
      </div>

      <div class="form-group">
        <label for="confirmPassword">Confirmar Contraseña:</label>
        <input id="confirmPassword" type="password" v-model="confirmPassword" required />
      </div>

      <!-- Mostramos mensajes de error o éxito al usuario -->
      <p v-if="errorMsg" class="error-message">{{ errorMsg }}</p>
      <p v-if="successMsg" class="success-message">{{ successMsg }}</p>

      <button type="submit">Crear Usuario</button>
    </form>

    <p class="login-link">
      ¿Ya tienes una cuenta? <router-link to="/login">Iniciar Sesión</router-link>
    </p>
  </div>
</template>

<script setup>
defineOptions({ name: 'RegisterForm' });
import { ref } from 'vue';
import { useRouter } from 'vue-router';
// 1. Importamos el store completo
import store from '../store';

const router = useRouter();

// 2. Creamos variables reactivas para los datos del formulario y los mensajes
const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const errorMsg = ref(null);
const successMsg = ref(null);

const handleRegister = () => {
  // Limpiamos mensajes anteriores
  errorMsg.value = null;
  successMsg.value = null;

  // Validación: las contraseñas deben coincidir
  if (password.value !== confirmPassword.value) {
    errorMsg.value = 'Las contraseñas no coinciden.';
    return;
  }

  // 3. Llamamos al método .register() del store
  try {
    const success = store.register(username.value, password.value);

    if (success) {
      successMsg.value = '¡Usuario creado con éxito! Redirigiendo al inicio de sesión...';
      // Redirigimos al usuario a la página de login después de 2 segundos
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } else {
      errorMsg.value = 'El nombre de usuario ya existe. Por favor, elige otro.';
    }
  } catch (error) {
    errorMsg.value = error.message;
  }
};
</script>

<style scoped>
.register-container {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

h2 {
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
  padding: 0.5rem;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  width: 100%;
  padding: 0.75rem;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #218838;
}

.error-message {
  color: #dc3545;
  margin-bottom: 1rem;
  text-align: center;
}

.success-message {
  color: #28a745;
  margin-bottom: 1rem;
  text-align: center;
}

.login-link {
  text-align: center;
  margin-top: 1.5rem;
}
</style>
