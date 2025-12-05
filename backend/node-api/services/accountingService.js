const db = require("../config/db");

class AccountingService {
  /**
   * Crear un asiento contable con validación de partida doble
   * @param {Object} entryData - Datos del asiento principal
   * @param {Array} lines - Líneas del asiento (débitos y créditos)
   * @returns {Object} El asiento creado
   */
  async createJournalEntry(entryData, lines) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Validar que haya al menos 2 líneas (débito y crédito)
      if (!lines || lines.length < 2) {
        throw new Error(
          "Un asiento contable debe tener al menos 2 líneas (débito y crédito)"
        );
      }

      // Validar partida doble: Suma de débitos = Suma de créditos
      const totalDebits = lines.reduce(
        (sum, line) => sum + parseFloat(line.debit || 0),
        0
      );
      const totalCredits = lines.reduce(
        (sum, line) => sum + parseFloat(line.credit || 0),
        0
      );

      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        throw new Error(
          `El asiento no está balanceado. Débitos: ${totalDebits}, Créditos: ${totalCredits}`
        );
      }

      // Validar que cada línea tenga solo débito O crédito, no ambos
      for (const line of lines) {
        const hasDebit = parseFloat(line.debit || 0) > 0;
        const hasCredit = parseFloat(line.credit || 0) > 0;

        if (hasDebit && hasCredit) {
          throw new Error(
            "Una línea no puede tener débito y crédito al mismo tiempo"
          );
        }
        if (!hasDebit && !hasCredit) {
          throw new Error("Cada línea debe tener débito o crédito");
        }
      }

      // Insertar el asiento principal
      const [entryResult] = await connection.query(
        `INSERT INTO journal_entries (entry_date, description, reference_type, reference_id, created_by)
                 VALUES (?, ?, ?, ?, ?)`,
        [
          entryData.entry_date || new Date(),
          entryData.description,
          entryData.reference_type || null,
          entryData.reference_id || null,
          entryData.created_by || "system",
        ]
      );

      const journalEntryId = entryResult.insertId;

      // Insertar las líneas del asiento
      for (const line of lines) {
        await connection.query(
          `INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, description)
                     VALUES (?, ?, ?, ?, ?)`,
          [
            journalEntryId,
            line.account_id,
            parseFloat(line.debit || 0),
            parseFloat(line.credit || 0),
            line.description || entryData.description,
          ]
        );
      }

      await connection.commit();

      // Retornar el asiento completo
      const [entry] = await connection.query(
        "SELECT * FROM journal_entries WHERE id = ?",
        [journalEntryId]
      );

      const [entryLines] = await connection.query(
        `SELECT jel.*, coa.name as account_name 
                 FROM journal_entry_lines jel
                 LEFT JOIN chart_of_accounts coa ON jel.account_id = coa.id
                 WHERE jel.journal_entry_id = ?`,
        [journalEntryId]
      );

      return {
        ...entry[0],
        lines: entryLines,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Generar asiento automático para venta de entradas
   * @param {Object} purchaseData - Datos de la compra
   */
  async recordTicketSale(purchaseData) {
    const entryData = {
      entry_date: purchaseData.date || new Date(),
      description:
        purchaseData.description ||
        `Venta de entradas - ${purchaseData.movieTitle}`,
      reference_type: "PURCHASE",
      reference_id: purchaseData.reference,
      created_by: purchaseData.username || "system",
    };

    const lines = [
      {
        account_id: "1.1.01", // Caja (Débito - aumenta activo)
        debit: purchaseData.amount,
        credit: 0,
        description: `Cobro por ${purchaseData.tickets} entrada(s)`,
      },
      {
        account_id: "4.1.01", // Ingresos por Venta de Entradas (Crédito - aumenta ingreso)
        debit: 0,
        credit: purchaseData.amount,
        description: `Venta de ${purchaseData.tickets} boleto(s) - ${purchaseData.movieTitle}`,
      },
    ];

    return await this.createJournalEntry(entryData, lines);
  }

  /**
   * Generar asiento para registro de gastos
   * @param {Object} expenseData - Datos del gasto
   */
  async recordExpense(expenseData) {
    const entryData = {
      entry_date: expenseData.date || new Date(),
      description: expenseData.description,
      reference_type: "EXPENSE",
      reference_id: expenseData.reference || null,
      created_by: expenseData.created_by || "admin",
    };

    const lines = [
      {
        account_id: expenseData.expense_account_id, // Cuenta de gasto (Débito - aumenta gasto)
        debit: expenseData.amount,
        credit: 0,
        description: expenseData.description,
      },
      {
        account_id: expenseData.payment_account_id || "1.1.02", // Bancos por defecto (Crédito - disminuye activo)
        debit: 0,
        credit: expenseData.amount,
        description: `Pago de ${expenseData.description}`,
      },
    ];

    return await this.createJournalEntry(entryData, lines);
  }

  /**
   * Calcular saldos de cuentas en un período
   * @param {String} startDate - Fecha inicio
   * @param {String} endDate - Fecha fin
   */
  async calculateAccountBalances(startDate, endDate) {
    const query = `
            SELECT 
                coa.id,
                coa.name,
                coa.account_type,
                coa.balance_type,
                SUM(jel.debit) as total_debit,
                SUM(jel.credit) as total_credit,
                CASE 
                    WHEN coa.balance_type = 'DEBIT' 
                    THEN SUM(jel.debit) - SUM(jel.credit)
                    ELSE SUM(jel.credit) - SUM(jel.debit)
                END as balance
            FROM chart_of_accounts coa
            LEFT JOIN journal_entry_lines jel ON coa.id = jel.account_id
            LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
            WHERE coa.is_active = 1
                AND (je.entry_date IS NULL OR (je.entry_date >= ? AND je.entry_date <= ?))
            GROUP BY coa.id, coa.name, coa.account_type, coa.balance_type
            HAVING total_debit > 0 OR total_credit > 0
            ORDER BY coa.id
        `;

    const [rows] = await db.query(query, [startDate, endDate]);
    return rows;
  }

  /**
   * Generar Estado de Resultados (Income Statement)
   * @param {String} startDate - Fecha inicio
   * @param {String} endDate - Fecha fin
   */
  async generateIncomeStatement(startDate, endDate) {
    // Obtener todos los ingresos
    const [revenues] = await db.query(
      `
            SELECT 
                coa.id,
                coa.name,
                SUM(jel.credit - jel.debit) as amount
            FROM chart_of_accounts coa
            LEFT JOIN journal_entry_lines jel ON coa.id = jel.account_id
            LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
            WHERE coa.account_type = 'REVENUE'
                AND je.entry_date >= ? AND je.entry_date <= ?
            GROUP BY coa.id, coa.name
            HAVING amount > 0
            ORDER BY coa.id
        `,
      [startDate, endDate]
    );

    const totalRevenue = revenues.reduce(
      (sum, r) => sum + parseFloat(r.amount),
      0
    );

    // Obtener todos los gastos
    const [expenses] = await db.query(
      `
            SELECT 
                coa.id,
                coa.name,
                SUM(jel.debit - jel.credit) as amount
            FROM chart_of_accounts coa
            LEFT JOIN journal_entry_lines jel ON coa.id = jel.account_id
            LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
            WHERE coa.account_type = 'EXPENSE'
                AND je.entry_date >= ? AND je.entry_date <= ?
            GROUP BY coa.id, coa.name
            HAVING amount > 0
            ORDER BY coa.id
        `,
      [startDate, endDate]
    );

    const totalExpenses = expenses.reduce(
      (sum, e) => sum + parseFloat(e.amount),
      0
    );

    const netIncome = totalRevenue - totalExpenses;

    return {
      period: { startDate, endDate },
      revenues,
      totalRevenue,
      expenses,
      totalExpenses,
      netIncome,
      isProfit: netIncome >= 0,
    };
  }

  /**
   * Generar Balance General (Balance Sheet)
   * @param {String} asOfDate - Fecha de corte
   */
  async generateBalanceSheet(asOfDate) {
    // Obtener activos
    const [assets] = await db.query(
      `
            SELECT 
                coa.id,
                coa.name,
                coa.parent_id,
                SUM(jel.debit - jel.credit) as amount
            FROM chart_of_accounts coa
            LEFT JOIN journal_entry_lines jel ON coa.id = jel.account_id
            LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
            WHERE coa.account_type = 'ASSET'
                AND (je.entry_date IS NULL OR je.entry_date <= ?)
            GROUP BY coa.id, coa.name, coa.parent_id
            HAVING amount != 0
            ORDER BY coa.id
        `,
      [asOfDate]
    );

    const totalAssets = assets.reduce(
      (sum, a) => sum + parseFloat(a.amount),
      0
    );

    // Obtener pasivos
    const [liabilities] = await db.query(
      `
            SELECT 
                coa.id,
                coa.name,
                coa.parent_id,
                SUM(jel.credit - jel.debit) as amount
            FROM chart_of_accounts coa
            LEFT JOIN journal_entry_lines jel ON coa.id = jel.account_id
            LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
            WHERE coa.account_type = 'LIABILITY'
                AND (je.entry_date IS NULL OR je.entry_date <= ?)
            GROUP BY coa.id, coa.name, coa.parent_id
            HAVING amount != 0
            ORDER BY coa.id
        `,
      [asOfDate]
    );

    const totalLiabilities = liabilities.reduce(
      (sum, l) => sum + parseFloat(l.amount),
      0
    );

    // Obtener patrimonio (sin utilidad del ejercicio)
    const [equity] = await db.query(
      `
            SELECT 
                coa.id,
                coa.name,
                coa.parent_id,
                SUM(jel.credit - jel.debit) as amount
            FROM chart_of_accounts coa
            LEFT JOIN journal_entry_lines jel ON coa.id = jel.account_id
            LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
            WHERE coa.account_type = 'EQUITY'
                AND coa.id != '3.3'
                AND (je.entry_date IS NULL OR je.entry_date <= ?)
            GROUP BY coa.id, coa.name, coa.parent_id
            HAVING amount != 0
            ORDER BY coa.id
        `,
      [asOfDate]
    );

    // Calcular utilidad del ejercicio (ingresos - gastos hasta la fecha)
    const incomeStmt = await this.generateIncomeStatement(
      "2000-01-01",
      asOfDate
    );
    const currentYearEarnings = incomeStmt.netIncome;

    // Agregar utilidad del ejercicio al patrimonio
    if (currentYearEarnings !== 0) {
      equity.push({
        id: "3.3",
        name: "Utilidad del Ejercicio",
        parent_id: "3",
        amount: currentYearEarnings,
      });
    }

    const totalEquity = equity.reduce(
      (sum, e) => sum + parseFloat(e.amount),
      0
    );

    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    return {
      asOfDate,
      assets,
      totalAssets,
      liabilities,
      totalLiabilities,
      equity,
      totalEquity,
      totalLiabilitiesAndEquity,
      isBalanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01,
    };
  }

  /**
   * Obtener balance de comprobación
   * @param {String} startDate
   * @param {String} endDate
   */
  async getTrialBalance(startDate, endDate) {
    const query = `
            SELECT 
                coa.id,
                coa.name,
                coa.account_type,
                coa.balance_type,
                COALESCE(SUM(jel.debit), 0) as total_debit,
                COALESCE(SUM(jel.credit), 0) as total_credit
            FROM chart_of_accounts coa
            LEFT JOIN journal_entry_lines jel ON coa.id = jel.account_id
            LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
            WHERE coa.is_active = 1
                AND (je.entry_date IS NULL OR (je.entry_date >= ? AND je.entry_date <= ?))
            GROUP BY coa.id, coa.name, coa.account_type, coa.balance_type
            HAVING total_debit > 0 OR total_credit > 0
            ORDER BY coa.id
        `;

    const [rows] = await db.query(query, [startDate, endDate]);

    const totalDebits = rows.reduce(
      (sum, r) => sum + parseFloat(r.total_debit),
      0
    );
    const totalCredits = rows.reduce(
      (sum, r) => sum + parseFloat(r.total_credit),
      0
    );

    return {
      period: { startDate, endDate },
      accounts: rows,
      totalDebits,
      totalCredits,
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
    };
  }
}

module.exports = new AccountingService();
