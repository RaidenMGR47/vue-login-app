<template>
  <nav style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:#eee;border-bottom:1px solid #ddd;">
    <div style="display:flex;gap:8px;align-items:center;">
      <strong>Usuario:</strong>
      <span>{{ username }}</span>
      <span v-if="role === 'admin'" style="background:#ffd; padding:2px 6px;border:1px solid #ccc;border-radius:4px;margin-left:6px;">admin</span>
    </div>

    <div style="display:flex;gap:8px;align-items:center;">
      <button @click="$emit('change-view','home')">Inicio</button>
      <button v-if="role === 'admin'" @click="$emit('change-view','add')">Añadir Películas</button>
      <button @click="$emit('change-view','search')">Buscar / Comprar</button>
      <button @click="$emit('change-view','lookup')">Recibo (Código)</button>
      <button @click="$emit('logout')">Cerrar Sesión</button>
      <!-- Mostrar Eliminar cuenta SOLO para usuario normal -->
      <button v-if="role !== 'admin'" @click="$emit('delete-account')" style="background:#ffecec;border:1px solid #f5c2c2;">Eliminar cuenta</button>
    </div>
  </nav>
</template>

<script setup>
const props = defineProps({
  username: { type: String, default: '' },
  role: { type: String, default: 'user' }
});
</script>

<style scoped>
button {
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #bfbfbf;
  background: #f5f5f5;
  cursor: pointer;
}
</style>
