<template>
  <div class="journal-entries">
    <h1>📝 Asientos Contables</h1>

    <div class="toolbar">
      <div class="filters">
        <input type="date" v-model="startDate" />
        <span>-</span>
        <input type="date" v-model="endDate" />
        <button @click="loadEntries" class="btn-primary">Buscar</button>
      </div>

      <button @click="showNewEntryForm = true" class="btn-primary">
        ➕ Nuevo Asiento
      </button>
    </div>

    <!-- Formulario Nuevo Asiento -->
    <div v-if="showNewEntryForm" class="modal-overlay" @click="showNewEntryForm = false">
      <div class="modal-content large" @click.stop>
        <h2>Nuevo Asiento Contable</h2>
        <form @submit.prevent="createEntry">
          <div class="form-group">
            <label>Fecha:</label>
            <input type="date" v-model="newEntry.entry_date" required />
          </div>

          <div class="form-group">
            <label>Descripción:</label>
            <textarea v-model="newEntry.description" rows="2" required></textarea>
          </div>

          <h3>Líneas del Asiento</h3>
          <div class="entry-lines">
            <div v-for="(line, index) in newEntry.lines" :key="index" class="line-row">
              <select v-model="line.account_id" required>
                <option value="">Seleccionar cuenta...</option>
                <option v-for="account in selectableAccounts" :key="account.id" :value="account.id">
                  {{ account.id }} - {{ account.name }}
                </option>
              </select>

              <input
                type="number"
                v-model.number="line.debit"
                step="0.01"
                placeholder="Débito"
                @input="clearOpposite(line, 'credit')"
              />

              <input
                type="number"
                v-model.number="line.credit"
                step="0.01"
                placeholder="Crédito"
                @input="clearOpposite(line, 'debit')"
              />

              <button type="button" @click="removeLine(index)" class="btn-danger">❌</button>
            </div>
          </div>

          <button type="button" @click="addLine" class="btn-secondary">➕ Añadir Línea</button>

          <div class="totals">
            <div>Total Débitos: ${{ formatMoney(totalDebits) }}</div>
            <div>Total Créditos: ${{ formatMoney(totalCredits) }}</div>
            <div :class="{ balanced: isBalanced, unbalanced: !isBalanced }">
              {{ isBalanced ? '✓ Balanceado' : '⚠ No balanceado' }}
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="!isBalanced">
              Crear Asiento
            </button>
            <button type="button" @click="closeForm" class="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Lista de Asientos -->
    <div class="entries-list">
      <div v-if="entries.length === 0" class="no-data">
        No hay asientos contables en este período
      </div>

      <div v-for="entry in entries" :key="entry.id" class="entry-card">
        <div class="entry-header">
          <div class="entry-info">
            <h3>{{ entry.description }}</h3>
            <div class="entry-meta">
              <span>{{ formatDate(entry.entry_date) }}</span>
              <span class="badge" :class="entry.reference_type">
                {{ entry.reference_type || 'MANUAL' }}
              </span>
              <span v-if="entry.reference_id" class="reference">
                Ref: {{ entry.reference_id }}
              </span>
            </div>
          </div>
        </div>

        <div class="entry-lines-table">
          <table>
            <thead>
              <tr>
                <th>Cuenta</th>
                <th>Descripción</th>
                <th>Débito</th>
                <th>Crédito</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="line in entry.lines" :key="line.id">
                <td>
                  <strong>{{ line.account_id }}</strong><br />
                  <small>{{ line.account_name }}</small>
                </td>
                <td>{{ line.description }}</td>
                <td class="amount">{{ line.debit > 0 ? '$' + formatMoney(line.debit) : '-' }}</td>
                <td class="amount">{{ line.credit > 0 ? '$' + formatMoney(line.credit) : '-' }}</td>
              </tr>
              <tr class="totals-row">
                <td colspan="2"><strong>TOTALES</strong></td>
                <td class="amount"><strong>${{ formatMoney(getEntryDebits(entry)) }}</strong></td>
                <td class="amount"><strong>${{ formatMoney(getEntryCredits(entry)) }}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'JournalEntries',
  data() {
    return {
      entries: [],
      accounts: [],
      startDate: '',
      endDate: '',
      showNewEntryForm: false,
      newEntry: {
        entry_date: new Date().toISOString().split('T')[0],
        description: '',
        lines: [
          { account_id: '', debit: 0, credit: 0 },
          { account_id: '', debit: 0, credit: 0 }
        ]
      }
    };
  },
  computed: {
    selectableAccounts() {
      return this.accounts.filter(a => a.id.split('.').length >= 3);
    },
    totalDebits() {
      return this.newEntry.lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
    },
    totalCredits() {
      return this.newEntry.lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);
    },
    isBalanced() {
      return Math.abs(this.totalDebits - this.totalCredits) < 0.01 && this.totalDebits > 0;
    }
  },
  mounted() {
    this.initializeDates();
    this.loadAccounts();
    this.loadEntries();
  },
  methods: {
    initializeDates() {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

      this.endDate = today.toISOString().split('T')[0];
      this.startDate = firstDay.toISOString().split('T')[0];
    },

    async loadAccounts() {
      try {
        const response = await fetch('http://localhost:3000/accounting/chart-of-accounts?active_only=true');
        const result = await response.json();

        if (result.success) {
          this.accounts = result.data.accounts;
        }
      } catch (error) {
        console.error('Error al cargar cuentas:', error);
      }
    },

    async loadEntries() {
      try {
        const response = await fetch(
          `http://localhost:3000/accounting/journal-entries?start_date=${this.startDate}&end_date=${this.endDate}`
        );
        const result = await response.json();

        if (result.success) {
          this.entries = result.data.entries;
        }
      } catch (error) {
        console.error('Error al cargar asientos:', error);
        alert('Error al cargar asientos');
      }
    },

    async createEntry() {
      if (!this.isBalanced) {
        alert('El asiento no está balanceado. Débitos deben ser igual a Créditos.');
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/accounting/journal-entries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.newEntry)
        });

        const result = await response.json();

        if (result.success) {
          alert('Asiento creado exitosamente');
          this.closeForm();
          this.loadEntries();
        } else {
          alert('Error: ' + result.message);
        }
      } catch (error) {
        console.error('Error al crear asiento:', error);
        alert('Error al crear el asiento');
      }
    },

    addLine() {
      this.newEntry.lines.push({ account_id: '', debit: 0, credit: 0 });
    },

    removeLine(index) {
      if (this.newEntry.lines.length > 2) {
        this.newEntry.lines.splice(index, 1);
      } else {
        alert('Debe haber al menos 2 líneas');
      }
    },

    clearOpposite(line, field) {
      if (line[field === 'debit' ? 'credit' : 'debit'] > 0) {
        line[field === 'debit' ? 'credit' : 'debit'] = 0;
      }
    },

    closeForm() {
      this.showNewEntryForm = false;
      this.newEntry = {
        entry_date: new Date().toISOString().split('T')[0],
        description: '',
        lines: [
          { account_id: '', debit: 0, credit: 0 },
          { account_id: '', debit: 0, credit: 0 }
        ]
      };
    },

    getEntryDebits(entry) {
      return entry.lines.reduce((sum, line) => sum + parseFloat(line.debit), 0);
    },

    getEntryCredits(entry) {
      return entry.lines.reduce((sum, line) => sum + parseFloat(line.credit), 0);
    },

    formatMoney(value) {
      return parseFloat(value || 0).toLocaleString('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    },

    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX');
    }
  }
};
</script>

<style scoped>
.journal-entries {
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
  margin-bottom: 20px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.filters {
  display: flex;
  gap: 10px;
  align-items: center;
}

.filters input[type="date"] {
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

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #2196f3;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 10px;
}

.btn-danger {
  background: #f44336;
  color: white;
  padding: 5px 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
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
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content.large {
  max-width: 900px;
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
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-sizing: border-box;
}

.entry-lines {
  margin-bottom: 10px;
}

.line-row {
  display: grid;
  grid-template-columns: 3fr 1fr 1fr auto;
  gap: 10px;
  margin-bottom: 10px;
}

.line-row select,
.line-row input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.totals {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 5px;
  margin: 15px 0;
  display: flex;
  justify-content: space-around;
  font-weight: bold;
}

.balanced {
  color: green;
}

.unbalanced {
  color: red;
}

.form-actions {
  display: flex;
  gap: 10px;
}

.entries-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.no-data {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 8px;
  color: #999;
}

.entry-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.entry-header {
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.entry-header h3 {
  margin: 0 0 5px 0;
  color: #2c3e50;
}

.entry-meta {
  display: flex;
  gap: 15px;
  font-size: 0.9rem;
  color: #666;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}

.badge.PURCHASE {
  background: #e3f2fd;
  color: #1976d2;
}

.badge.EXPENSE {
  background: #ffebee;
  color: #c62828;
}

.badge.MANUAL {
  background: #f3e5f5;
  color: #7b1fa2;
}

.entry-lines-table table {
  width: 100%;
  border-collapse: collapse;
}

.entry-lines-table th {
  background: #f5f5f5;
  padding: 10px;
  text-align: left;
  border-bottom: 2px solid #ddd;
}

.entry-lines-table td {
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.entry-lines-table .amount {
  text-align: right;
}

.entry-lines-table .totals-row {
  background: #f5f5f5;
  font-weight: bold;
}
</style>
