<template>
  <div class="chart-of-accounts">
    <h1>📋 Catálogo de Cuentas</h1>

    <div class="toolbar">
      <div class="filters">
        <label>Filtrar por tipo:</label>
        <select v-model="selectedType" @change="loadAccounts">
          <option value="">Todos</option>
          <option value="ASSET">Activos</option>
          <option value="LIABILITY">Pasivos</option>
          <option value="EQUITY">Patrimonio</option>
          <option value="REVENUE">Ingresos</option>
          <option value="EXPENSE">Gastos</option>
        </select>
      </div>

      <button @click="showNewAccountForm = true" class="btn-primary">
        ➕ Nueva Cuenta
      </button>
    </div>

    <!-- Formulario Nueva Cuenta -->
    <div v-if="showNewAccountForm" class="modal-overlay" @click="showNewAccountForm = false">
      <div class="modal-content" @click.stop>
        <h2>Nueva Cuenta</h2>
        <form @submit.prevent="createAccount">
          <div class="form-group">
            <label>Código:</label>
            <input v-model="newAccount.id" required placeholder="Ej: 1.1.03" />
          </div>

          <div class="form-group">
            <label>Nombre:</label>
            <input v-model="newAccount.name" required />
          </div>

          <div class="form-group">
            <label>Tipo de Cuenta:</label>
            <select v-model="newAccount.account_type" required>
              <option value="ASSET">Activo</option>
              <option value="LIABILITY">Pasivo</option>
              <option value="EQUITY">Patrimonio</option>
              <option value="REVENUE">Ingreso</option>
              <option value="EXPENSE">Gasto</option>
            </select>
          </div>

          <div class="form-group">
            <label>Naturaleza:</label>
            <select v-model="newAccount.balance_type" required>
              <option value="DEBIT">Débito</option>
              <option value="CREDIT">Crédito</option>
            </select>
          </div>

          <div class="form-group">
            <label>Cuenta Padre (opcional):</label>
            <input v-model="newAccount.parent_id" placeholder="Ej: 1.1" />
          </div>

          <div class="form-group">
            <label>Descripción:</label>
            <textarea v-model="newAccount.description" rows="3"></textarea>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary">Crear Cuenta</button>
            <button type="button" @click="showNewAccountForm = false" class="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Tabla de Cuentas -->
    <div class="accounts-table">
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Naturaleza</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="account in displayAccounts" :key="account.id" :class="getAccountClass(account)">
            <td><strong>{{ account.id }}</strong></td>
            <td>
              <span :style="{ marginLeft: getIndentation(account) }">
                {{ account.name }}
              </span>
            </td>
            <td>
              <span class="badge" :class="account.account_type.toLowerCase()">
                {{ getTypeLabel(account.account_type) }}
              </span>
            </td>
            <td>{{ account.balance_type === 'DEBIT' ? 'Débito' : 'Crédito' }}</td>
            <td>
              <span class="status" :class="{ active: account.is_active }">
                {{ account.is_active ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChartOfAccounts',
  data() {
    return {
      accounts: [],
      selectedType: '',
      showNewAccountForm: false,
      newAccount: {
        id: '',
        name: '',
        account_type: 'ASSET',
        balance_type: 'DEBIT',
        parent_id: '',
        description: ''
      }
    };
  },
  computed: {
    displayAccounts() {
      return this.accounts.sort((a, b) => {
        return a.id.localeCompare(b.id, undefined, { numeric: true });
      });
    }
  },
  mounted() {
    this.loadAccounts();
  },
  methods: {
    async loadAccounts() {
      try {
        let url = 'http://localhost:3000/accounting/chart-of-accounts?active_only=true';
        if (this.selectedType) {
          url += `&type=${this.selectedType}`;
        }

        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
          this.accounts = result.data.accounts;
        }
      } catch (error) {
        console.error('Error al cargar cuentas:', error);
        alert('Error al cargar el catálogo de cuentas');
      }
    },

    async createAccount() {
      try {
        const response = await fetch('http://localhost:3000/accounting/chart-of-accounts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.newAccount)
        });

        const result = await response.json();

        if (result.success) {
          alert('Cuenta creada exitosamente');
          this.showNewAccountForm = false;
          this.resetForm();
          this.loadAccounts();
        } else {
          alert('Error: ' + result.message);
        }
      } catch (error) {
        console.error('Error al crear cuenta:', error);
        alert('Error al crear la cuenta');
      }
    },

    resetForm() {
      this.newAccount = {
        id: '',
        name: '',
        account_type: 'ASSET',
        balance_type: 'DEBIT',
        parent_id: '',
        description: ''
      };
    },

    getAccountClass(account) {
      const level = account.id.split('.').length;
      return {
        'level-1': level === 1,
        'level-2': level === 2,
        'level-3': level >= 3
      };
    },

    getIndentation(account) {
      const level = account.id.split('.').length;
      return (level - 1) * 20 + 'px';
    },

    getTypeLabel(type) {
      const labels = {
        ASSET: 'Activo',
        LIABILITY: 'Pasivo',
        EQUITY: 'Patrimonio',
        REVENUE: 'Ingreso',
        EXPENSE: 'Gasto'
      };
      return labels[type] || type;
    }
  }
};
</script>

<style scoped>
.chart-of-accounts {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  color: #2c3e50;
  margin-bottom: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.filters {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filters select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.btn-primary {
  background: #4caf50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}

.btn-primary:hover {
  background: #45a049;
}

.btn-secondary {
  background: #9e9e9e;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}

.btn-secondary:hover {
  background: #757575;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 10px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h2 {
  margin-top: 0;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-sizing: border-box;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.accounts-table {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f5f5f5;
}

th {
  padding: 12px;
  text-align: left;
  border-bottom: 2px solid #ddd;
  font-weight: bold;
}

td {
  padding: 12px;
  border-bottom: 1px solid #eee;
}

tr.level-1 {
  background: #e3f2fd;
  font-weight: bold;
}

tr.level-2 {
  background: #f1f8ff;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}

.badge.asset {
  background: #c8e6c9;
  color: #2e7d32;
}

.badge.liability {
  background: #ffccbc;
  color: #d84315;
}

.badge.equity {
  background: #d1c4e9;
  color: #512da8;
}

.badge.revenue {
  background: #b2dfdb;
  color: #00695c;
}

.badge.expense {
  background: #ffcdd2;
  color: #c62828;
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.status.active {
  background: #c8e6c9;
  color: #2e7d32;
}

.status:not(.active) {
  background: #ffcdd2;
  color: #c62828;
}
</style>
