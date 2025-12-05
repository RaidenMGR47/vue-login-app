const express = require('express');
const router = express.Router();
const db = require('../config/db');
const accountingService = require('../services/accountingService');
const pdfService = require('../services/pdfService');

const sendResponse = (res, success, data = null, message = "") => {
    res.json({ success, data, message });
};

// GET /accounting/chart-of-accounts - Obtener catálogo de cuentas
router.get('/chart-of-accounts', async (req, res) => {
    try {
        const { type, active_only } = req.query;
        
        let query = 'SELECT * FROM chart_of_accounts WHERE 1=1';
        const params = [];

        if (type) {
            query += ' AND account_type = ?';
            params.push(type);
        }

        if (active_only === 'true') {
            query += ' AND is_active = 1';
        }

        query += ' ORDER BY id';

        const [accounts] = await db.query(query, params);
        sendResponse(res, true, { accounts });
    } catch (error) {
        sendResponse(res, false, null, 'Error: ' + error.message);
    }
});

// POST /accounting/chart-of-accounts - Crear nueva cuenta
router.post('/chart-of-accounts', async (req, res) => {
    try {
        const { id, name, account_type, parent_id, balance_type, description } = req.body;

        if (!id || !name || !account_type || !balance_type) {
            return sendResponse(res, false, null, 'Faltan datos obligatorios');
        }

        const query = `
            INSERT INTO chart_of_accounts (id, name, account_type, parent_id, balance_type, description)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        await db.query(query, [id, name, account_type, parent_id || null, balance_type, description || null]);
        
        sendResponse(res, true, { account: { id, name, account_type, parent_id, balance_type, description } }, 'Cuenta creada exitosamente');
    } catch (error) {
        sendResponse(res, false, null, 'Error: ' + error.message);
    }
});

// GET /accounting/journal-entries - Obtener asientos contables
router.get('/journal-entries', async (req, res) => {
    try {
        const { start_date, end_date, reference_type, limit } = req.query;

        let query = 'SELECT * FROM journal_entries WHERE 1=1';
        const params = [];

        if (start_date && end_date) {
            query += ' AND entry_date BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        if (reference_type) {
            query += ' AND reference_type = ?';
            params.push(reference_type);
        }

        query += ' ORDER BY entry_date DESC, id DESC';

        if (limit) {
            query += ' LIMIT ?';
            params.push(parseInt(limit));
        }

        const [entries] = await db.query(query, params);

        // Obtener las líneas de cada asiento
        for (let entry of entries) {
            const [lines] = await db.query(`
                SELECT jel.*, coa.name as account_name, coa.account_type
                FROM journal_entry_lines jel
                LEFT JOIN chart_of_accounts coa ON jel.account_id = coa.id
                WHERE jel.journal_entry_id = ?
                ORDER BY jel.id
            `, [entry.id]);
            
            entry.lines = lines;
        }

        sendResponse(res, true, { entries });
    } catch (error) {
        sendResponse(res, false, null, 'Error: ' + error.message);
    }
});

// POST /accounting/journal-entries - Crear asiento contable manual
router.post('/journal-entries', async (req, res) => {
    try {
        const { entry_date, description, reference_type, reference_id, created_by, lines } = req.body;

        if (!description || !lines || lines.length < 2) {
            return sendResponse(res, false, null, 'Faltan datos obligatorios o líneas insuficientes');
        }

        const entryData = {
            entry_date: entry_date || new Date(),
            description,
            reference_type: reference_type || 'MANUAL',
            reference_id: reference_id || null,
            created_by: created_by || 'admin'
        };

        const entry = await accountingService.createJournalEntry(entryData, lines);
        
        sendResponse(res, true, { entry }, 'Asiento contable creado exitosamente');
    } catch (error) {
        sendResponse(res, false, null, 'Error: ' + error.message);
    }
});

// POST /accounting/expenses - Registrar un gasto
router.post('/expenses', async (req, res) => {
    try {
        const { date, description, amount, expense_account_id, payment_account_id, created_by } = req.body;

        if (!description || !amount || !expense_account_id) {
            return sendResponse(res, false, null, 'Faltan datos obligatorios');
        }

        const expenseData = {
            date: date || new Date(),
            description,
            amount: parseFloat(amount),
            expense_account_id,
            payment_account_id: payment_account_id || '1.1.02', // Banco por defecto
            created_by: created_by || 'admin'
        };

        const entry = await accountingService.recordExpense(expenseData);
        
        sendResponse(res, true, { entry }, 'Gasto registrado exitosamente');
    } catch (error) {
        sendResponse(res, false, null, 'Error: ' + error.message);
    }
});

// GET /accounting/reports/income-statement - Estado de Resultados
router.get('/reports/income-statement', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        if (!start_date || !end_date) {
            return sendResponse(res, false, null, 'Faltan parámetros: start_date y end_date');
        }

        const report = await accountingService.generateIncomeStatement(start_date, end_date);
        sendResponse(res, true, { report });
    } catch (error) {
        sendResponse(res, false, null, 'Error: ' + error.message);
    }
});

// GET /accounting/reports/balance-sheet - Balance General
router.get('/reports/balance-sheet', async (req, res) => {
    try {
        const { as_of_date } = req.query;

        if (!as_of_date) {
            return sendResponse(res, false, null, 'Falta parámetro: as_of_date');
        }

        const report = await accountingService.generateBalanceSheet(as_of_date);
        sendResponse(res, true, { report });
    } catch (error) {
        sendResponse(res, false, null, 'Error: ' + error.message);
    }
});

// GET /accounting/reports/trial-balance - Balance de Comprobación
router.get('/reports/trial-balance', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        if (!start_date || !end_date) {
            return sendResponse(res, false, null, 'Faltan parámetros: start_date y end_date');
        }

        const report = await accountingService.getTrialBalance(start_date, end_date);
        sendResponse(res, true, { report });
    } catch (error) {
        sendResponse(res, false, null, 'Error: ' + error.message);
    }
});

// GET /accounting/account-balances - Saldos de cuentas
router.get('/account-balances', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        if (!start_date || !end_date) {
            return sendResponse(res, false, null, 'Faltan parámetros: start_date y end_date');
        }

        const balances = await accountingService.calculateAccountBalances(start_date, end_date);
        sendResponse(res, true, { balances });
    } catch (error) {
        sendResponse(res, false, null, 'Error: ' + error.message);
    }
});

// GET /accounting/export/pdf - Exportar reportes a PDF
router.get('/export/pdf', async (req, res) => {
    try {
        const { report_type, start_date, end_date, as_of_date } = req.query;

        if (!report_type) {
            return res.status(400).json({ success: false, message: 'Falta parámetro: report_type' });
        }

        switch (report_type) {
            case 'income-statement':
                if (!start_date || !end_date) {
                    return res.status(400).json({ success: false, message: 'Faltan parámetros de fecha' });
                }
                const incomeData = await accountingService.generateIncomeStatement(start_date, end_date);
                await pdfService.generateIncomeStatementPDF(incomeData, res);
                break;

            case 'balance-sheet':
                if (!as_of_date) {
                    return res.status(400).json({ success: false, message: 'Falta parámetro: as_of_date' });
                }
                const balanceData = await accountingService.generateBalanceSheet(as_of_date);
                await pdfService.generateBalanceSheetPDF(balanceData, res);
                break;

            case 'trial-balance':
                if (!start_date || !end_date) {
                    return res.status(400).json({ success: false, message: 'Faltan parámetros de fecha' });
                }
                const trialData = await accountingService.getTrialBalance(start_date, end_date);
                await pdfService.generateTrialBalancePDF(trialData, res);
                break;

            default:
                return res.status(400).json({ success: false, message: 'Tipo de reporte no válido' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error: ' + error.message });
    }
});

module.exports = router;
