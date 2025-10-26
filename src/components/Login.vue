<template>
  <!-- 1. Contenedor principal para centrar todo el contenido -->
  <div class="login-page">

    <!-- 2. La "tarjeta" que contendrá el formulario -->
    <div class="login-card">

      <h2 class="card-title">Iniciar Sesión</h2>

      <form @submit.prevent="handleLogin">

        <!-- Grupo para el usuario -->
        <div class="form-group">
          <label for="username">Usuario</label>
          <input id="username" type="text" v-model="username" required placeholder="Escribe tu usuario" />
        </div>

        <!-- Grupo para la contraseña -->
        <div class="form-group">
          <label for="password">Contraseña</label>
          <input id="password" type="password" v-model="password" required placeholder="Escribe tu contraseña" />
        </div>

        <!-- Mensaje de error, solo se muestra si existe -->
        <p v-if="errorMsg" class="error-message">{{ errorMsg }}</p>

        <!-- Botón de envío -->
        <button type="submit" class="login-button">Entrar</button>

      </form>

      <!-- Enlace para registrarse -->
      <p class="register-link">
        ¿No tienes una cuenta? <router-link to="/register">Crea una aquí</router-link>
      </p>

    </div>
  </div>
</template>

<script setup>
// La lógica sigue siendo la misma, no se necesita ningún cambio aquí.
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import store from '../store';

const router = useRouter();
const username = ref('');
const password = ref('');
const errorMsg = ref(null);

const handleLogin = () => {
  const success = store.login(username.value, password.value);
  if (success) {
    router.push('/'); // Redirigir a la página de inicio
  } else {
    errorMsg.value = 'Usuario o contraseña incorrectos.';
  }
};
</script>

<style scoped>
/* 'scoped' asegura que estos estilos solo se aplican a Login.vue */

/* 1. Estilos del contenedor principal para centrar la tarjeta */
.login-page {
  display: flex;
  justify-content: center; /* Centrado horizontal */
  align-items: center;    /* Centrado vertical */
  min-height: 80vh;       /* Altura mínima para que el centrado vertical funcione */
  background-color: #f4f7f9 /* Un fondo gris muy suave */
}

/* 2. Estilos de la tarjeta de inicio de sesión */
.login-card {
  width: 100%;
  max-width: 400px; /* Ancho máximo para que no sea demasiado grande en pantallas anchas */
  padding: 2.5rem;
  background-color: white;
  border-radius: 12px; /* Bordes más redondeados y amigables */
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); /* Sombra sutil para darle profundidad */
  box-sizing: border-box; /* Asegura que el padding no afecte el ancho total */
}

.card-title {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
  font-weight: 600;
}

/* 3. Estilos para los grupos de formulario (label + input) */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s, box-shadow 0.3s; /* Transición suave */
  box-sizing: border-box;
}

/* 4. Efecto de "foco" en los inputs para mejor feedback visual */
.form-group input:focus {
  outline: none; /* Quitamos el borde por defecto del navegador */
  border-color: #42b983; /* Color primario de Vue para el borde */
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.2); /* Sombra exterior sutil */
}

/* 5. Estilos del botón principal */
.login-button {
  width: 100%;
  padding: 0.8rem;
  border: none;
  border-radius: 8px;
  background-color: #42b983; /* Color principal */
  color: white;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s; /* Transición suave al pasar el mouse */
  margin-top: 1rem;
}

.login-button:hover {
  background-color: #36a473; /* Un tono un poco más oscuro al pasar el mouse */
}

/* Estilos para el mensaje de error */
.error-message {
  color: #e74c3c;
  background-color: #fbe Nunc;
  border: 1px solid #e74c3c;
  padding: 0.75rem;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 1.5rem;
}

/* Estilos para el enlace de registro */
.register-link {
  text-align: center;
  margin-top: 2rem;
  color: #666;
}

.register-link a {
  color: #42b983;
  text-decoration: none;
  font-weight: bold;
}

.register-link a:hover {
  text-decoration: underline;
}
</style>
