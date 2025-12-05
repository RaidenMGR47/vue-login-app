<template>
  <div class="financial-reports">
    <h1>📄 Reportes Financieros</h1>

    <div class="report-selector">
      <div class="form-group">
        <label>Tipo de Reporte:</label>
        <select v-model="selectedReport">
          <option value="income-statement">Estado de Resultados</option>
          <option value="balance-sheet">Balance General</option>
          <option value="trial-balance">Balance de Comprobación</option>
        </select>
      </div>

      <div v-if="selectedReport !== 'balance-sheet'" class="form-group">
        <label>Fecha Inicio:</label>
        <input type="date" v-model="startDate" />
      </div>

      <div class="form-group">
        <label>{{ selectedReport === 'balance-sheet' ? 'Fecha de Corte:' : 'Fecha Fin:' }}</label>
        <input type="date" v-model="endDate" />
      </div>

      <button @click="loadReport" class="btn-primary">
        📊 Generar Reporte
      </button>

      <button v-if="reportData" @click="exportToPDF" class="btn-download">
        ⬇ Descargar PDF
      </button>
    </div>

    <!-- Estado de Resultados -->
    <div v-if="reportData && selectedReport === 'income-statement'" class="report-container">
      <h2>Estado de Resultados</h2>
      <p class="period">
        Período: {{ formatDate(reportData.period.startDate) }} al {{ formatDate(reportData.period.endDate) }}
      </p>

      <div class="financial-section">
        <h3>INGRESOS</h3>
        <table>
          <tbody>
            <tr v-for="rev in reportData.revenues" :key="rev.id">
              <td>{{ rev.name }}</td>
              <td class="amount">${{ formatMoney(rev.amount) }}</td>
            </tr>
            <tr class="total-row">
              <td><strong>Total Ingresos</strong></td>
              <td class="amount"><strong>${{ formatMoney(reportData.totalRevenue) }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="financial-section">
        <h3>GASTOS</h3>
        <table>
          <tbody>
            <tr v-for="exp in reportData.expenses" :key="exp.id">
              <td>{{ exp.name }}</td>
              <td class="amount">${{ formatMoney(exp.amount) }}</td>
            </tr>
            <tr class="total-row">
              <td><strong>Total Gastos</strong></td>
              <td class="amount"><strong>${{ formatMoney(reportData.totalExpenses) }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="net-income" :class="{ profit: reportData.isProfit, loss: !reportData.isProfit }">
        <h3>{{ reportData.isProfit ? 'UTILIDAD NETA' : 'PÉRDIDA NETA' }}</h3>
        <div class="amount">${{ formatMoney(Math.abs(reportData.netIncome)) }}</div>
      </div>
    </div>

    <!-- Balance General -->
    <div v-if="reportData && selectedReport === 'balance-sheet'" class="report-container">
      <h2>Balance General</h2>
      <p class="period">Al: {{ formatDate(reportData.asOfDate) }}</p>

      <div class="financial-section">
        <h3>ACTIVOS</h3>
        <table>
          <tbody>
            <tr v-for="asset in reportData.assets" :key="asset.id" :class="getRowClass(asset)">
              <td :style="{ paddingLeft: getIndent(asset) }">{{ asset.name }}</td>
              <td class="amount">${{ formatMoney(Math.abs(asset.amount)) }}</td>
            </tr>
            <tr class="total-row">
              <td><strong>Total Activos</strong></td>
              <td class="amount"><strong>${{ formatMoney(reportData.totalAssets) }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="financial-section">
        <h3>PASIVOS</h3>
        <table>
          <tbody>
            <tr v-for="liability in reportData.liabilities" :key="liability.id" :class="getRowClass(liability)">
              <td :style="{ paddingLeft: getIndent(liability) }">{{ liability.name }}</td>
              <td class="amount">${{ formatMoney(Math.abs(liability.amount)) }}</td>
            </tr>
            <tr class="total-row">
              <td><strong>Total Pasivos</strong></td>
              <td class="amount"><strong>${{ formatMoney(reportData.totalLiabilities) }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="financial-section">
        <h3>PATRIMONIO</h3>
        <table>
          <tbody>
            <tr v-for="eq in reportData.equity" :key="eq.id" :class="getRowClass(eq)">
              <td :style="{ paddingLeft: getIndent(eq) }">{{ eq.name }}</td>
              <td class="amount">${{ formatMoney(Math.abs(eq.amount)) }}</td>
            </tr>
            <tr class="total-row">
              <td><strong>Total Patrimonio</strong></td>
              <td class="amount"><strong>${{ formatMoney(reportData.totalEquity) }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="balance-check" :class="{ balanced: reportData.isBalanced, unbalanced: !reportData.isBalanced }">
        <p v-if="reportData.isBalanced">
          ✓ El balance está cuadrado: Activos = Pasivos + Patrimonio
        </p>
        <p v-else>
          ⚠ ADVERTENCIA: El balance NO está cuadrado
        </p>
      </div>
    </div>

    <!-- Balance de Comprobación -->
    <div v-if="reportData && selectedReport === 'trial-balance'" class="report-container">
      <h2>Balance de Comprobación</h2>
      <p class="period">
        Período: {{ formatDate(reportData.period.startDate) }} al {{ formatDate(reportData.period.endDate) }}
      </p>

      <table class="trial-balance-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Cuenta</th>
            <th>Débito</th>
            <th>Crédito</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="account in reportData.accounts" :key="account.id">
            <td>{{ account.id }}</td>
            <td>{{ account.name }}</td>
            <td class="amount">${{ formatMoney(account.total_debit) }}</td>
            <td class="amount">${{ formatMoney(account.total_credit) }}</td>
          </tr>
          <tr class="total-row">
            <td colspan="2"><strong>TOTALES</strong></td>
            <td class="amount"><strong>${{ formatMoney(reportData.totalDebits) }}</strong></td>
            <td class="amount"><strong>${{ formatMoney(reportData.totalCredits) }}</strong></td>
          </tr>
        </tbody>
      </table>

      <div class="balance-check" :class="{ balanced: reportData.isBalanced, unbalanced: !reportData.isBalanced }">
        <p v-if="reportData.isBalanced">
          ✓ Débitos = Créditos (Balance cuadrado)
        </p>
        <p v-else>
          ⚠ ADVERTENCIA: Débitos ≠ Créditos
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FinancialReports',
  data() {
    return {
      selectedReport: 'income-statement',
      startDate: '',
      endDate: '',
      reportData: null
    };
  },
  mounted() {
    this.initializeDates();
  },
  methods: {
    initializeDates() {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

      this.endDate = today.toISOString().split('T')[0];
      this.startDate = firstDay.toISOString().split('T')[0];
    },

    async loadReport() {
      try {
        let url = '';

        if (this.selectedReport === 'income-statement') {
          url = `http://localhost:3000/accounting/reports/income-statement?start_date=${this.startDate}&end_date=${this.endDate}`;
        } else if (this.selectedReport === 'balance-sheet') {
          url = `http://localhost:3000/accounting/reports/balance-sheet?as_of_date=${this.endDate}`;
        } else if (this.selectedReport === 'trial-balance') {
          url = `http://localhost:3000/accounting/reports/trial-balance?start_date=${this.startDate}&end_date=${this.endDate}`;
        }

        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
          this.reportData = result.data.report;
        } else {
          alert('Error: ' + result.message);
        }
      } catch (error) {
        console.error('Error al cargar reporte:', error);
        alert('Error al cargar el reporte');
      }
    },

    async exportToPDF() {
      try {
        let url = `http://localhost:3000/accounting/export/pdf?report_type=${this.selectedReport}`;

        if (this.selectedReport === 'balance-sheet') {
          url += `&as_of_date=${this.endDate}`;
        } else {
          url += `&start_date=${this.startDate}&end_date=${this.endDate}`;
        }

        window.open(url, '_blank');
      } catch (error) {
        console.error('Error al exportar PDF:', error);
        alert('Error al exportar PDF');
      }
    },

    getRowClass(item) {
      const level = item.id.split('.').length;
      return level <= 2 ? 'parent-account' : '';
    },

    getIndent(item) {
      const level = item.id.split('.').length;
      return (level - 1) * 20 + 'px';
    },

    formatMoney(value) {
      return parseFloat(value || 0).toLocaleString('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    },

    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }
};
</script>

<style scoped>
.financial-reports {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

h1 {
  color: #2c3e50;
  margin-bottom: 20px;
}

.report-selector {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  display: flex;
  gap: 15px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: bold;
  margin-bottom: 5px;
  font-size: 0.9rem;
}

.form-group select,
.form-group input {
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

.btn-download {
  background: #2196f3;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}

.btn-download:hover {
  background: #1976d2;
}

.report-container {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.report-container h2 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  text-align: center;
}

.period {
  text-align: center;
  color: #666;
  margin-bottom: 30px;
}

.financial-section {
  margin-bottom: 30px;
}

.financial-section h3 {
  color: #2c3e50;
  border-bottom: 2px solid #2c3e50;
  padding-bottom: 5px;
  margin-bottom: 10px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

td {
  padding: 8px 12px;
  border-bottom: 1px solid #eee;
}

.amount {
  text-align: right;
  font-family: monospace;
}

.total-row {
  background: #f5f5f5;
  border-top: 2px solid #ddd;
  border-bottom: 2px solid #ddd;
}

.parent-account {
  background: #f9f9f9;
  font-weight: bold;
}

.net-income {
  padding: 20px;
  text-align: center;
  border-radius: 8px;
  margin-top: 20px;
}

.net-income.profit {
  background: #c8e6c9;
  border: 2px solid #4caf50;
  color: #2e7d32;
}

.net-income.loss {
  background: #ffcdd2;
  border: 2px solid #f44336;
  color: #c62828;
}

.net-income h3 {
  margin: 0 0 10px 0;
}

.net-income .amount {
  font-size: 2rem;
  font-weight: bold;
  font-family: monospace;
}

.balance-check {
  margin-top: 20px;
  padding: 15px;
  border-radius: 5px;
  text-align: center;
  font-weight: bold;
}

.balance-check.balanced {
  background: #c8e6c9;
  color: #2e7d32;
}

.balance-check.unbalanced {
  background: #ffcdd2;
  color: #c62828;
}

.trial-balance-table {
  width: 100%;
}

.trial-balance-table thead {
  background: #f5f5f5;
}

.trial-balance-table th {
  padding: 12px;
  text-align: left;
  border-bottom: 2px solid #ddd;
}

.trial-balance-table th:nth-child(3),
.trial-balance-table th:nth-child(4) {
  text-align: right;
}
</style>
