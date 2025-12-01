<template>
  <div id="app-container">
    <Navbar />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import Navbar from './components/Navbar.vue';
</script>

<style>
/* Estilos globales para la aplicación */
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  margin: 0;
  background-color: #f4f7f9;
}
#app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.main-content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}
</style>
