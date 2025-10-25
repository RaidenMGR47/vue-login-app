<template>
  <div id="app-container">
    <!-- El Navbar ahora puede leer el estado de la sesión directamente del store -->
    <Navbar />
    <main class="container">
      <!-- vue-router renderizará el componente de la página actual aquí -->
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup>
import Navbar from './components/Navbar.vue';
// No se necesita más lógica aquí, el router se encarga de todo.
</script>

<style>
/* Añade estilos globales aquí para consistencia */
:root {
  --primary-color: #42b983;
  --secondary-color: #f0f0f0;
  --text-color: #2c3e50;
}
body {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  color: var(--text-color);
  margin: 0;
}
.container {
  max-width: 1000px;
  margin: 20px auto;
  padding: 0 20px;
}
/* Estilos para botones, formularios, etc. */
</style>
