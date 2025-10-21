<template>
  <div style="width:220px;border:1px solid #ddd;padding:10px;border-radius:6px;text-align:left;">
    <h3 style="margin:4px 0;">{{ movie.title }}</h3>
    <div><small>{{ movie.genre }} • {{ movie.year }}</small></div>
    <div style="margin-top:8px;"><strong>Precio:</strong> ${{ movie.price.toFixed(2) }}</div>
    <div><small>Días disponible: {{ movie.daysAvailable }}</small></div>
  </div>
</template>

<script setup>
const props = defineProps({
  movie: { type: Object, required: true }
});
</script>
