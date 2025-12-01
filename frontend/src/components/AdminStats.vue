<template>
  <div class="admin-stats-container">
    <h2 class="mb-4">Panel de Estadísticas</h2>

    <div v-if="isLoading" class="text-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <div v-else class="stats-content" ref="statsContent">
      <!-- Tarjetas de Resumen -->
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="card text-white bg-primary mb-3 h-100">
            <div class="card-header">Sala Más Concurrida</div>
            <div class="card-body">
              <h5 class="card-title">{{ stats.popularHall?.name || 'N/A' }}</h5>
              <p class="card-text">{{ stats.popularHall?.total_tickets || 0 }} tickets vendidos</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card text-white bg-success mb-3 h-100">
            <div class="card-header">Hora Más Popular</div>
            <div class="card-body">
              <h5 class="card-title">{{ stats.popularTime?.hour_slot || 'N/A' }}</h5>
              <p class="card-text">{{ stats.popularTime?.total_tickets || 0 }} funciones</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card text-white bg-info mb-3 h-100">
            <div class="card-header">Género Favorito</div>
            <div class="card-body">
              <h5 class="card-title">{{ stats.popularGenre?.genre || 'N/A' }}</h5>
              <p class="card-text">{{ stats.popularGenre?.total_tickets || 0 }} tickets</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card text-white bg-warning mb-3 h-100">
            <div class="card-header">Película Top Ventas</div>
            <div class="card-body">
              <h5 class="card-title">{{ stats.bestSellingMovie?.movie_title || 'N/A' }}</h5>
              <p class="card-text">{{ stats.bestSellingMovie?.total_tickets || 0 }} tickets</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla de Ingresos -->
      <div class="card mb-4">
        <div class="card-header bg-dark text-white">
          Ingresos por Película
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Película</th>
                  <th>Tickets Vendidos</th>
                  <th>Ingresos Totales</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="movie in stats.revenuePerMovie" :key="movie.movie_title">
                  <td>{{ movie.movie_title }}</td>
                  <td>{{ movie.tickets_sold }}</td>
                  <td>${{ parseFloat(movie.total_revenue).toFixed(2) }}</td>
                </tr>
                <tr v-if="!stats.revenuePerMovie || stats.revenuePerMovie.length === 0">
                  <td colspan="3" class="text-center">No hay datos de ventas disponibles.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div class="d-flex gap-2">
      <button @click="downloadPDF" class="btn btn-danger" :disabled="isLoading || !stats">
        <i class="bi bi-file-earmark-pdf"></i> Descargar Reporte PDF
      </button>
      <button @click="loadStats" class="btn btn-secondary">
        <i class="bi bi-arrow-clockwise"></i> Actualizar
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import store from '../store';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const stats = ref({});
const isLoading = ref(false);
const error = ref('');

onMounted(() => {
  loadStats();
});

async function loadStats() {
  isLoading.value = true;
  error.value = '';
  try {
    const data = await store.fetchAdminStats();
    stats.value = data || {};
  } catch (err) {
    console.error('Error loading stats:', err);
    error.value = err.message || 'No se pudieron cargar las estadísticas.';
  } finally {
    isLoading.value = false;
  }
}

function downloadPDF() {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text('Reporte de Estadísticas de Cine', 14, 22);
  doc.setFontSize(11);
  doc.text(`Fecha de reporte: ${new Date().toLocaleDateString()}`, 14, 30);

  // Resumen
  doc.setFontSize(14);
  doc.text('Resumen General', 14, 45);

  const summaryData = [
    ['Métrica', 'Valor', 'Detalle'],
    ['Sala Más Concurrida', stats.value.popularHall?.name || 'N/A', `${stats.value.popularHall?.total_tickets || 0} tickets`],
    ['Hora Más Popular', stats.value.popularTime?.hour_slot || 'N/A', `${stats.value.popularTime?.total_tickets || 0} funciones`],
    ['Género Favorito', stats.value.popularGenre?.genre || 'N/A', `${stats.value.popularGenre?.total_tickets || 0} tickets`],
    ['Película Top Ventas', stats.value.bestSellingMovie?.movie_title || 'N/A', `${stats.value.bestSellingMovie?.total_tickets || 0} tickets`]
  ];

  autoTable(doc, {
    startY: 50,
    head: [summaryData[0]],
    body: summaryData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] }
  });

  // Tabla de Ingresos
  const finalY = doc.lastAutoTable.finalY + 15;
  doc.text('Detalle de Ingresos por Película', 14, finalY);

  const revenueData = stats.value.revenuePerMovie?.map(m => [
    m.movie_title,
    m.tickets_sold,
    `$${parseFloat(m.total_revenue).toFixed(2)}`
  ]) || [];

  autoTable(doc, {
    startY: finalY + 5,
    head: [['Película', 'Tickets Vendidos', 'Ingresos Totales']],
    body: revenueData,
    theme: 'striped',
    headStyles: { fillColor: [52, 73, 94] }
  });

  doc.save('reporte_estadisticas_cine.pdf');
}
</script>

<style scoped>
.admin-stats-container {
  padding: 2rem;
}
.card {
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  border: none;
}
.card-header {
  font-weight: bold;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
</style>
