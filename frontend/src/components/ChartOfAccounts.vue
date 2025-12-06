<template>
  <div class="chart-of-accounts">
    <h1>📋 Catálogo de Cuentas</h1>

    <!-- Selector de Período -->
    <div class="period-selector">
      <label>Período:</label>
      <input type="date" v-model="startDate" />
      <span>hasta</span>
      <input type="date" v-model="endDate" />
      <button @click="loadAccountBalances" class="btn-primary">Actualizar</button>
    </div>

    <div class="toolbar">
      <div class="filters">
        <label>Filtrar por tipo:</label>
        <select v-model="selectedType" @change="loadAccountBalances">
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
        <h2>Nueva Cuenta con Movimiento Inicial</h2>
        <form @submit.prevent="createAccount">
          <div class="form-section">
            <h3>📋 Información de la Cuenta</h3>

            <div class="form-group">
              <label>Código:</label>
              <input v-model="newAccount.id" required placeholder="Ej: 5.1.03" />
              <small>Usa la numeración contable estándar</small>
            </div>

            <div class="form-group">
              <label>Nombre de la Cuenta:</label>
              <input v-model="newAccount.name" required placeholder="Ej: Gasto de Luz" />
            </div>

            <div class="form-group">
              <label>Tipo de Cuenta:</label>
              <select v-model="newAccount.account_type" required @change="updateBalanceType">
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
              <small>Automático según el tipo de cuenta</small>
            </div>

            <div class="form-group">
              <label>Cuenta Padre (opcional):</label>
              <input v-model="newAccount.parent_id" placeholder="Ej: 5.1" />
            </div>

            <div class="form-group">
              <label>Descripción:</label>
              <textarea v-model="newAccount.description" rows="2"></textarea>
            </div>
          </div>

          <div class="form-section">
            <h3>💰 Movimiento Inicial (Opcional)</h3>

            <div class="form-group">
              <label>
                <input type="checkbox" v-model="createInitialTransaction" />
                Registrar movimiento inicial
              </label>
            </div>

            <template v-if="createInitialTransaction">
              <div class="form-group">
                <label>Monto:</label>
                <input
                  type="number"
                  v-model.number="transaction.amount"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  required
                />
              </div>

              <div class="form-group">
                <label>Fecha:</label>
                <input type="date" v-model="transaction.date" required />
              </div>

              <div class="form-group">
                <label>Descripción del Movimiento:</label>
                <input
                  v-model="transaction.description"
                  placeholder="Ej: Pago de factura de luz del mes"
                  required
                />
              </div>

              <div class="form-group">
                <label>{{ getPaymentAccountLabel() }}:</label>
                <select v-model="transaction.payment_account" required>
                  <option value="">Selecciona una cuenta</option>
                  <option value="1.1.01">Caja</option>
                  <option value="1.1.02">Bancos</option>
                  <option value="1.1.02.01">Banco - Punto de Venta</option>
                  <option value="1.1.02.02">Banco - Pago Móvil</option>
                  <option value="2.1.01">Cuentas por Pagar</option>
                </select>
                <small>{{ getPaymentAccountHint() }}</small>
              </div>
            </template>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary">
              {{ createInitialTransaction ? 'Crear Cuenta y Registrar Movimiento' : 'Crear Cuenta' }}
            </button>
            <button type="button" @click="closeForm" class="btn-secondary">
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
            <th>Debe</th>
            <th>Haber</th>
            <th>Saldo</th>
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
            <td class="amount debit">${{ formatMoney(account.total_debit || 0) }}</td>
            <td class="amount credit">${{ formatMoney(account.total_credit || 0) }}</td>
            <td class="amount balance" :class="{ negative: account.balance < 0 }">
              ${{ formatMoney(Math.abs(account.balance || 0)) }}
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
      startDate: '',
      endDate: '',
      showNewAccountForm: false,
      createInitialTransaction: false,
      newAccount: {
        id: '',
        name: '',
        account_type: 'EXPENSE',
        balance_type: 'DEBIT',
        parent_id: '',
        description: ''
      },
      transaction: {
        amount: 0,
        date: '',
        description: '',
        payment_account: ''
      }
    };
  },
  computed: {
    displayAccounts() {
      let filtered = this.accounts;

      // Filtrar por tipo si está seleccionado
      if (this.selectedType) {
        filtered = filtered.filter(acc => acc.account_type === this.selectedType);
      }

      return [...filtered].sort((a, b) => {
        return a.id.localeCompare(b.id, undefined, { numeric: true });
      });
    }
  },
  mounted() {
    this.initializeDates();
    this.loadAccountBalances();
  },
  methods: {
    initializeDates() {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

      this.endDate = today.toISOString().split('T')[0];
      this.startDate = firstDay.toISOString().split('T')[0];
    },

    async loadAccountBalances() {
      try {
        const url = `http://localhost:3000/accounting/account-balances?start_date=${this.startDate}&end_date=${this.endDate}`;
        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
          this.accounts = result.data.balances;
        }
      } catch (error) {
        console.error('Error al cargar balances:', error);
        alert('Error al cargar los balances de cuentas');
      }
    },

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
        // Primero crear la cuenta
        const accountResponse = await fetch('http://localhost:3000/accounting/chart-of-accounts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.newAccount)
        });

        const accountResult = await accountResponse.json();

        if (!accountResult.success) {
          alert('Error al crear cuenta: ' + accountResult.message);
          return;
        }

        // Si hay movimiento inicial, crear el asiento contable
        if (this.createInitialTransaction && this.transaction.amount > 0) {
          await this.createInitialJournalEntry();
        }

        alert('Cuenta creada exitosamente' + (this.createInitialTransaction ? ' con movimiento inicial' : ''));
        this.closeForm();
        this.loadAccountBalances();
      } catch (error) {
        console.error('Error al crear cuenta:', error);
        alert('Error al crear la cuenta');
      }
    },

    async createInitialJournalEntry() {
      const accountType = this.newAccount.account_type;
      const amount = this.transaction.amount;
      const newAccountId = this.newAccount.id;
      const paymentAccount = this.transaction.payment_account;

      let lines = [];

      // Lógica de débito/crédito según el tipo de cuenta
      if (accountType === 'EXPENSE') {
        // GASTO: Débito al gasto, Crédito a la cuenta de pago
        lines = [
          {
            account_id: newAccountId,
            debit: amount,
            credit: 0,
            description: this.transaction.description
          },
          {
            account_id: paymentAccount,
            debit: 0,
            credit: amount,
            description: `Pago de ${this.newAccount.name}`
          }
        ];
      } else if (accountType === 'REVENUE') {
        // INGRESO: Débito a cuenta de cobro, Crédito al ingreso
        lines = [
          {
            account_id: paymentAccount,
            debit: amount,
            credit: 0,
            description: `Cobro de ${this.newAccount.name}`
          },
          {
            account_id: newAccountId,
            debit: 0,
            credit: amount,
            description: this.transaction.description
          }
        ];
      } else if (accountType === 'ASSET') {
        // ACTIVO: Débito al activo, Crédito a cuenta de origen
        lines = [
          {
            account_id: newAccountId,
            debit: amount,
            credit: 0,
            description: this.transaction.description
          },
          {
            account_id: paymentAccount,
            debit: 0,
            credit: amount,
            description: `Adquisición de ${this.newAccount.name}`
          }
        ];
      } else if (accountType === 'LIABILITY') {
        // PASIVO: Débito a cuenta de recepción, Crédito al pasivo
        lines = [
          {
            account_id: paymentAccount,
            debit: amount,
            credit: 0,
            description: `Recepción por ${this.newAccount.name}`
          },
          {
            account_id: newAccountId,
            debit: 0,
            credit: amount,
            description: this.transaction.description
          }
        ];
      } else if (accountType === 'EQUITY') {
        // PATRIMONIO: Débito a cuenta de aporte, Crédito al patrimonio
        lines = [
          {
            account_id: paymentAccount,
            debit: amount,
            credit: 0,
            description: `Aporte a ${this.newAccount.name}`
          },
          {
            account_id: newAccountId,
            debit: 0,
            credit: amount,
            description: this.transaction.description
          }
        ];
      }

      const entryData = {
        entry_date: this.transaction.date,
        description: `Movimiento inicial - ${this.newAccount.name}`,
        reference_type: 'MANUAL',
        created_by: 'admin',
        lines: lines
      };

      const response = await fetch('http://localhost:3000/accounting/journal-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entryData)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error('Error al crear asiento inicial: ' + result.message);
      }
    },

    resetForm() {
      this.newAccount = {
        id: '',
        name: '',
        account_type: 'EXPENSE',
        balance_type: 'DEBIT',
        parent_id: '',
        description: ''
      };
      this.transaction = {
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: '',
        payment_account: ''
      };
      this.createInitialTransaction = false;
    },

    closeForm() {
      this.showNewAccountForm = false;
      this.resetForm();
    },

    updateBalanceType() {
      // Automáticamente asignar la naturaleza según el tipo de cuenta
      const type = this.newAccount.account_type;
      if (type === 'ASSET' || type === 'EXPENSE') {
        this.newAccount.balance_type = 'DEBIT';
      } else {
        this.newAccount.balance_type = 'CREDIT';
      }
    },

    getPaymentAccountLabel() {
      const type = this.newAccount.account_type;
      if (type === 'EXPENSE' || type === 'ASSET') {
        return 'Pagado con / Origen del dinero';
      } else if (type === 'REVENUE') {
        return 'Cobrado en / Destino del dinero';
      } else if (type === 'LIABILITY') {
        return 'Dinero recibido en';
      } else if (type === 'EQUITY') {
        return 'Aporte recibido en';
      }
      return 'Cuenta de movimiento';
    },

    getPaymentAccountHint() {
      const type = this.newAccount.account_type;
      if (type === 'EXPENSE') {
        return 'Selecciona de dónde salió el dinero para pagar este gasto';
      } else if (type === 'REVENUE') {
        return 'Selecciona dónde entró el dinero de este ingreso';
      } else if (type === 'ASSET') {
        return 'Selecciona de dónde salió el dinero para adquirir este activo';
      } else if (type === 'LIABILITY') {
        return 'Selecciona dónde entró el dinero del préstamo/deuda';
      } else if (type === 'EQUITY') {
        return 'Selecciona dónde entró el dinero del aporte';
      }
      return '';
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
    },

    formatMoney(value) {
      return parseFloat(value || 0).toLocaleString('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
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

.period-selector {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.period-selector label {
  font-weight: bold;
}

.period-selector input[type="date"] {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 0.9rem;
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

.form-group small {
  display: block;
  margin-top: 5px;
  color: #666;
  font-size: 0.85rem;
}

.form-section {
  margin-bottom: 25px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #2196f3;
}

.form-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #2c3e50;
  font-size: 1.1rem;
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

/* Amount Columns */
.amount {
  text-align: right;
  font-family: 'Courier New', monospace;
  font-weight: 500;
}

.amount.debit {
  color: #d32f2f;
}

.amount.credit {
  color: #388e3c;
}

.amount.balance {
  font-weight: bold;
  color: #1976d2;
}

.amount.balance.negative {
  color: #f57c00;
}
</style>
