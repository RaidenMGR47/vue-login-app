<template>
  <div class="accounting-dashboard">
    <h1 class="dashboard-title">📊 Sistema Contable</h1>

    <!-- Resumen Financiero -->
    <div class="financial-summary" v-if="summary">
      <div class="summary-card revenue">
        <div class="card-icon">💰</div>
        <div class="card-content">
          <h3>Ingresos Totales</h3>
          <p class="amount">${{ formatMoney(summary.totalRevenue) }}</p>
        </div>
      </div>

      <div class="summary-card expenses">
        <div class="card-icon">💸</div>
        <div class="card-content">
          <h3>Gastos Totales</h3>
          <p class="amount">${{ formatMoney(summary.totalExpenses) }}</p>
        </div>
      </div>

      <div class="summary-card profit" :class="{ loss: summary.netIncome < 0 }">
        <div class="card-icon">{{ summary.netIncome >= 0 ? '📈' : '📉' }}</div>
        <div class="card-content">
          <h3>{{ summary.netIncome >= 0 ? 'Utilidad' : 'Pérdida' }}</h3>
          <p class="amount">${{ formatMoney(Math.abs(summary.netIncome)) }}</p>
        </div>
      </div>
    </div>

    <!-- Resumen por Método de Pago -->
    <div class="payment-methods-summary" v-if="paymentSummary">
      <h2>Resumen por Método de Pago</h2>
      <div class="payment-cards">
        <div class="payment-card cash">
          <div class="card-icon">💵</div>
          <div class="card-content">
            <h3>Efectivo en Caja</h3>
            <p class="amount">${{ formatMoney(getCashTotal()) }}</p>
            <small>{{ getCashCount() }} transacciones</small>
          </div>
        </div>

        <div class="payment-card pos">
          <div class="card-icon">💳</div>
          <div class="card-content">
            <h3>Punto de Venta</h3>
            <p class="amount">${{ formatMoney(getPOSTotal()) }}</p>
            <small>{{ getPOSCount() }} transacciones</small>
          </div>
        </div>

        <div class="payment-card mobile">
          <div class="card-icon">📱</div>
          <div class="card-content">
            <h3>Pago Móvil</h3>
            <p class="amount">${{ formatMoney(getMobileTotal()) }}</p>
            <small>{{ getMobileCount() }} transacciones</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Selector de Período -->
    <div class="period-selector">
      <label>Período:</label>
      <input type="date" v-model="startDate" />
      <span>hasta</span>
      <input type="date" v-model="endDate" />
      <button @click="loadData" class="btn-primary">Actualizar</button>
    </div>

    <!-- Botones de Acción -->
    <div class="action-buttons">
      <router-link to="/accounting/chart-of-accounts" class="btn-action">
        📋 Catálogo de Cuentas
      </router-link>
      <router-link to="/accounting/journal-entries" class="btn-action">
        📝 Asientos Contables
      </router-link>
      <router-link to="/accounting/reports" class="btn-action">
        📄 Reportes Financieros
      </router-link>
    </div>

    <!-- Gráfico de Ingresos vs Gastos -->
    <div class="chart-container" v-if="summary">
      <h2>Ingresos vs Gastos</h2>
      <canvas ref="chartCanvas"></canvas>
    </div>

    <!-- Últimos Asientos -->
    <div class="recent-entries" v-if="recentEntries.length > 0">
      <h2>Últimos Asientos Contables</h2>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Descripción</th>
            <th>Tipo</th>
            <th>Monto</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in recentEntries" :key="entry.id">
            <td>{{ formatDate(entry.entry_date) }}</td>
            <td>{{ entry.description }}</td>
            <td>
              <span class="badge" :class="entry.reference_type">{{ entry.reference_type || 'MANUAL' }}</span>
            </td>
            <td>${{ formatMoney(calculateEntryTotal(entry)) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export default {
  name: 'AccountingDashboard',
  data() {
    return {
      startDate: '',
      endDate: '',
      summary: null,
      recentEntries: [],
      paymentSummary: null,
      chart: null
    };
  },
  mounted() {
    this.initializeDates();
    this.loadData();
  },
  methods: {
    initializeDates() {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

      this.endDate = today.toISOString().split('T')[0];
      this.startDate = firstDay.toISOString().split('T')[0];
    },

    async loadData() {
      await Promise.all([
        this.loadSummary(),
        this.loadRecentEntries(),
        this.loadPaymentSummary()
      ]);

      this.$nextTick(() => {
        this.renderChart();
      });
    },

    async loadSummary() {
      try {
        const response = await fetch(
          `http://localhost:3000/accounting/reports/income-statement?start_date=${this.startDate}&end_date=${this.endDate}`
        );
        const result = await response.json();

        if (result.success) {
          this.summary = result.data.report;
        }
      } catch (error) {
        console.error('Error al cargar resumen:', error);
      }
    },

    async loadRecentEntries() {
      try {
        const response = await fetch(
          `http://localhost:3000/accounting/journal-entries?start_date=${this.startDate}&end_date=${this.endDate}&limit=5`
        );
        const result = await response.json();

        if (result.success) {
          this.recentEntries = result.data.entries;
        }
      } catch (error) {
        console.error('Error al cargar asientos:', error);
      }
    },

    async loadPaymentSummary() {
      try {
        const response = await fetch(
          `http://localhost:3000/accounting/reports/payment-summary?start_date=${this.startDate}&end_date=${this.endDate}`
        );
        const result = await response.json();

        if (result.success) {
          this.paymentSummary = result.data.summary;
        }
      } catch (error) {
        console.error('Error al cargar resumen de pagos:', error);
      }
    },

    getCashTotal() {
      if (!this.paymentSummary) return 0;
      const cash = this.paymentSummary.methods.find(m => m.payment_method === 'CASH');
      return cash ? parseFloat(cash.total_amount) : 0;
    },

    getCashCount() {
      if (!this.paymentSummary) return 0;
      const cash = this.paymentSummary.methods.find(m => m.payment_method === 'CASH');
      return cash ? parseInt(cash.transaction_count) : 0;
    },

    getPOSTotal() {
      if (!this.paymentSummary) return 0;
      const pos = this.paymentSummary.methods.find(m => m.payment_method === 'POS');
      return pos ? parseFloat(pos.total_amount) : 0;
    },

    getPOSCount() {
      if (!this.paymentSummary) return 0;
      const pos = this.paymentSummary.methods.find(m => m.payment_method === 'POS');
      return pos ? parseInt(pos.transaction_count) : 0;
    },

    getMobileTotal() {
      if (!this.paymentSummary) return 0;
      const mobile = this.paymentSummary.methods.find(m => m.payment_method === 'MOBILE');
      return mobile ? parseFloat(mobile.total_amount) : 0;
    },

    getMobileCount() {
      if (!this.paymentSummary) return 0;
      const mobile = this.paymentSummary.methods.find(m => m.payment_method === 'MOBILE');
      return mobile ? parseInt(mobile.transaction_count) : 0;
    },

    renderChart() {
      if (!this.summary || !this.$refs.chartCanvas) return;

      const ctx = this.$refs.chartCanvas.getContext('2d');

      if (this.chart) {
        this.chart.destroy();
      }

      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Ingresos', 'Gastos', 'Resultado'],
          datasets: [{
            label: 'Monto ($)',
            data: [
              this.summary.totalRevenue,
              this.summary.totalExpenses,
              Math.abs(this.summary.netIncome)
            ],
            backgroundColor: [
              'rgba(75, 192, 192, 0.6)',
              'rgba(255, 99, 132, 0.6)',
              this.summary.netIncome >= 0 ? 'rgba(54, 162, 235, 0.6)' : 'rgba(255, 159, 64, 0.6)'
            ],
            borderColor: [
              'rgba(75, 192, 192, 1)',
              'rgba(255, 99, 132, 1)',
              this.summary.netIncome >= 0 ? 'rgba(54, 162, 235, 1)' : 'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => '$' + value.toLocaleString('es-MX')
              }
            }
          }
        }
      });
    },

    calculateEntryTotal(entry) {
      if (!entry.lines) return 0;
      return entry.lines.reduce((sum, line) => {
        return sum + parseFloat(line.debit || 0) + parseFloat(line.credit || 0);
      }, 0) / 2; // Dividir entre 2 porque sumamos débitos y créditos
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
  },
  beforeUnmount() {
    if (this.chart) {
      this.chart.destroy();
    }
  }
};
</script>

<style scoped>
.accounting-dashboard {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-title {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 30px;
}

.financial-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.summary-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
}

.summary-card.revenue {
  border-left: 4px solid #4caf50;
}

.summary-card.expenses {
  border-left: 4px solid #f44336;
}

.summary-card.profit {
  border-left: 4px solid #2196f3;
}

.summary-card.loss {
  border-left: 4px solid #ff9800;
}

.card-icon {
  font-size: 2.5rem;
}

.card-content h3 {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
}

.card-content .amount {
  margin: 5px 0 0 0;
  font-size: 1.8rem;
  font-weight: bold;
  color: #2c3e50;
}

.period-selector {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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

.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.btn-action {
  background: #2196f3;
  color: white;
  padding: 15px 20px;
  border-radius: 8px;
  text-decoration: none;
  text-align: center;
  font-weight: bold;
  transition: background 0.3s;
}

.btn-action:hover {
  background: #1976d2;
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

.chart-container {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.chart-container h2 {
  margin-top: 0;
  color: #2c3e50;
}

.chart-container canvas {
  max-height: 300px;
}

.recent-entries {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.recent-entries h2 {
  margin-top: 0;
  color: #2c3e50;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f5f5f5;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
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

/* Payment Methods Summary */
.payment-methods-summary {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.payment-methods-summary h2 {
  margin-top: 0;
  color: #2c3e50;
  text-align: center;
}

.payment-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.payment-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.2s;
}

.payment-card:hover {
  transform: translateY(-3px);
}

.payment-card.cash {
  border-left: 4px solid #4caf50;
}

.payment-card.pos {
  border-left: 4px solid #2196f3;
}

.payment-card.mobile {
  border-left: 4px solid #ff9800;
}

.payment-card .card-content small {
  display: block;
  margin-top: 5px;
  color: #999;
  font-size: 0.85rem;
}
</style>
