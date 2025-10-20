<template>
  <div id="app">
    <!-- Contenedor para cuando el usuario NO ha iniciado sesión -->
    <div v-if="!isLoggedIn">
      <!-- Muestra el componente de Login si showLoginView es true -->
      <Login 
        v-if="showLoginView" 
        @login-success="handleLoginSuccess" 
        @show-register="switchToRegisterView" 
      />
      <!-- Si no, muestra el componente de Registro -->
      <Register 
        v-else 
        @register-success="handleRegisterSuccess" 
        @show-login="switchToLoginView" 
      />
    </div>

    <!-- Contenedor para cuando el usuario SÍ ha iniciado sesión -->
    <div v-else>
      <h1>¡Enhorabuena! Has iniciado sesión como {{ username }}</h1>
      <button @click="logout">Cerrar Sesión</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Login from './components/Login.vue';
import Register from './components/Register.vue';

// Estado para saber si el usuario ha iniciado sesión
const isLoggedIn = ref(false);
// Estado para alternar entre la vista de login y registro
const showLoginView = ref(true);
// Estado para almacenar el nombre del usuario que inició sesión
const username = ref('');

// Cambia a la vista de registro
const switchToRegisterView = () => {
  showLoginView.value = false;
};

// Cambia a la vista de login
const switchToLoginView = () => {
  showLoginView.value = true;
};

// Se ejecuta cuando el login es exitoso (evento desde Login.vue)
const handleLoginSuccess = (loggedInUsername) => {
  isLoggedIn.value = true;
  username.value = loggedInUsername;
};

// Se ejecuta cuando el registro es exitoso (evento desde Register.vue)
const handleRegisterSuccess = () => {
  // Mostramos un mensaje y lo enviamos a la vista de login
  alert('¡Usuario creado con éxito! Por favor, inicia sesión.');
  showLoginView.value = true;
};

// Cierra la sesión del usuario
const logout = () => {
  isLoggedIn.value = false;
  username.value = '';
  // Opcional: nos aseguramos de que la próxima vez se muestre el login
  showLoginView.value = true; 
};
</script>

<style>
/* Estilos globales para la aplicación */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

button {
  margin: 5px;
  padding: 8px 12px;
  cursor: pointer;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #f0f0f0;
}
</style>