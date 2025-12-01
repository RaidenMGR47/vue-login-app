<template>
  <div class="manage-halls-container">
    <div class="content-card">
      <h1 class="page-title">Gestión de Salas</h1>
      <p class="page-subtitle">Administra las salas de cine disponibles.</p>

      <!-- Formulario para añadir sala -->
      <div class="add-hall-section">
        <h3>Añadir Nueva Sala</h3>
        <form @submit.prevent="submitHall" class="add-hall-form">
          <div class="form-group">
            <label for="hallName">Nombre de la Sala</label>
            <input id="hallName" v-model="newHall.name" type="text" placeholder="Ej: Sala 1" required>
          </div>
          <div class="form-group">
            <label for="hallCapacity">Capacidad</label>
            <input id="hallCapacity" v-model.number="newHall.capacity" type="number" min="1" placeholder="Ej: 50" required>
          </div>
          <button type="submit" class="btn-add" :disabled="isLoading">
            <i class="bi bi-plus-lg me-2"></i>Añadir
          </button>
        </form>
      </div>

      <hr class="divider">

      <!-- Lista de salas -->
      <div class="halls-list-section">
        <h3>Salas Existentes</h3>
        <div v-if="halls.length === 0" class="empty-state">
          No hay salas registradas.
        </div>
        <div v-else class="halls-grid">
          <div v-for="hall in halls" :key="hall.id" class="hall-card">
            <div class="hall-icon">
              <i class="bi bi-display"></i>
            </div>
            <div class="hall-info">
              <h4>{{ hall.name }}</h4>
              <p>Capacidad: <strong>{{ hall.capacity }}</strong> personas</p>
            </div>
            <button class="btn-delete" @click="deleteHall(hall.id)" title="Eliminar sala">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import store from '../store';

const newHall = ref({ name: '', capacity: null });
const isLoading = ref(false);

const halls = computed(() => store.state.value.halls);

onMounted(async () => {
  await store.fetchHalls();
});

async function submitHall() {
  if (!newHall.value.name || !newHall.value.capacity) return;

  isLoading.value = true;
  try {
    await store.addHall({ ...newHall.value });
    newHall.value = { name: '', capacity: null }; // Reset form
    alert('Sala añadida correctamente');
  } catch (error) {
    alert('Error al añadir sala: ' + error.message);
  } finally {
    isLoading.value = false;
  }
}

async function deleteHall(id) {
  if (!confirm('¿Estás seguro de que quieres eliminar esta sala?')) return;

  try {
    await store.deleteHall(id);
    // No need to alert, the list updates automatically via reactivity
  } catch (error) {
    alert('Error al eliminar sala: ' + error.message);
  }
}
</script>

<style scoped>
.manage-halls-container {
  max-width: 800px;
  margin: 0 auto;
}
.content-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.page-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}
.page-subtitle {
  color: #7f8c8d;
  margin-bottom: 2rem;
}

.add-hall-section {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}
.add-hall-section h3 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #34495e;
}
.add-hall-form {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
}
.form-group {
  flex: 1;
}
.form-group label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.4rem;
  color: #555;
}
.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.btn-add {
  background-color: #27ae60;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  height: 42px; /* Match input height approx */
}
.btn-add:hover {
  background-color: #219150;
}
.btn-add:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.divider {
  margin: 2rem 0;
  border: 0;
  border-top: 1px solid #eee;
}

.halls-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}
.hall-card {
  background: white;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
}
.hall-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.05);
}
.hall-icon {
  font-size: 2rem;
  color: #3498db;
}
.hall-info h4 {
  margin: 0 0 0.2rem 0;
  font-size: 1.1rem;
}
.hall-info p {
  font-size: 0.9rem;
  color: #666;
}
.btn-delete {
  background: none;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 5px;
  border-radius: 4px;
  transition: background 0.2s;
  margin-left: auto;
}
.btn-delete:hover {
  background: #fceae9;
}
.empty-state {
  text-align: center;
  color: #999;
  padding: 2rem;
  background: #f9f9f9;
  border-radius: 8px;
}

@media (max-width: 600px) {
  .add-hall-form {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
