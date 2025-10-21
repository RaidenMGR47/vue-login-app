<template>
  <nav style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:#eee;border-bottom:1px solid #ddd;">
    <div style="display:flex;gap:8px;align-items:center;">
      <strong>Usuario:</strong>
      <span>{{ username }}</span>
      <span v-if="role === 'admin'" style="background:#ffd; padding:2px 6px;border:1px solid #ccc;border-radius:4px;margin-left:6px;">admin</span>
    </div>

    <div style="display:flex;gap:8px;">
      <button @click="$emit('change-view','home')">Inicio</button>
      <button v-if="role === 'admin'" @click="$emit('change-view','add')">Añadir Películas</button>
      <button @click="$emit('change-view','search')">Buscar / Comprar</button>
      <button @click="$emit('change-view','lookup')">Recibo (Código)</button>
      <button @click="$emit('logout')">Cerrar Sesión</button>
    </div>
  </nav>
</template>

<script setup>
const props = defineProps({
  username: { type: String, default: '' },
  role: { type: String, default: 'user' }
});
</script>
