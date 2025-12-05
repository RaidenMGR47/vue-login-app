const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFService {
    /**
     * Generar PDF de Estado de Resultados
     */
    async generateIncomeStatementPDF(data, res) {
        const doc = new PDFDocument({ margin: 50 });

        // Stream directo a la respuesta HTTP
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=estado_resultados_${data.period.startDate}_${data.period.endDate}.pdf`);
        doc.pipe(res);

        // Encabezado
        doc.fontSize(20).text('ESTADO DE RESULTADOS', { align: 'center' });
        doc.fontSize(12).text(`Período: ${this.formatDate(data.period.startDate)} al ${this.formatDate(data.period.endDate)}`, { align: 'center' });
        doc.moveDown(2);

        // Ingresos
        doc.fontSize(14).text('INGRESOS', { underline: true });
        doc.moveDown(0.5);

        data.revenues.forEach(rev => {
            doc.fontSize(10)
               .text(`  ${rev.name}`, 100, doc.y, { continued: true, width: 300 })
               .text(`$${this.formatMoney(rev.amount)}`, { align: 'right' });
            doc.moveDown(0.3);
        });

        doc.moveDown(0.5);
        doc.fontSize(12)
           .text('Total Ingresos', 100, doc.y, { continued: true, width: 300, bold: true })
           .text(`$${this.formatMoney(data.totalRevenue)}`, { align: 'right', bold: true });
        
        doc.moveDown(1);
        doc.moveTo(100, doc.y).lineTo(500, doc.y).stroke();
        doc.moveDown(1);

        // Gastos
        doc.fontSize(14).text('GASTOS', { underline: true });
        doc.moveDown(0.5);

        data.expenses.forEach(exp => {
            doc.fontSize(10)
               .text(`  ${exp.name}`, 100, doc.y, { continued: true, width: 300 })
               .text(`$${this.formatMoney(exp.amount)}`, { align: 'right' });
            doc.moveDown(0.3);
        });

        doc.moveDown(0.5);
        doc.fontSize(12)
           .text('Total Gastos', 100, doc.y, { continued: true, width: 300, bold: true })
           .text(`$${this.formatMoney(data.totalExpenses)}`, { align: 'right', bold: true });

        doc.moveDown(1);
        doc.moveTo(100, doc.y).lineTo(500, doc.y).stroke();
        doc.moveDown(1);

        // Utilidad/Pérdida Neta
        const resultLabel = data.isProfit ? 'UTILIDAD NETA' : 'PÉRDIDA NETA';
        const resultColor = data.isProfit ? 'green' : 'red';
        
        doc.fontSize(14)
           .fillColor(resultColor)
           .text(resultLabel, 100, doc.y, { continued: true, width: 300, bold: true })
           .text(`$${this.formatMoney(Math.abs(data.netIncome))}`, { align: 'right', bold: true });

        doc.moveTo(100, doc.y + 5).lineTo(500, doc.y + 5).stroke();
        doc.moveTo(100, doc.y + 8).lineTo(500, doc.y + 8).stroke();

        // Pie de página
        doc.moveDown(3);
        doc.fontSize(8).fillColor('gray').text(
            `Generado: ${new Date().toLocaleString('es-MX')}`,
            { align: 'center' }
        );

        doc.end();
    }

    /**
     * Generar PDF de Balance General
     */
    async generateBalanceSheetPDF(data, res) {
        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=balance_general_${data.asOfDate}.pdf`);
        doc.pipe(res);

        // Encabezado
        doc.fontSize(20).text('BALANCE GENERAL', { align: 'center' });
        doc.fontSize(12).text(`Al: ${this.formatDate(data.asOfDate)}`, { align: 'center' });
        doc.moveDown(2);

        // ACTIVOS
        doc.fontSize(14).text('ACTIVOS', { underline: true });
        doc.moveDown(0.5);

        this.renderAccountHierarchy(doc, data.assets, 0);

        doc.moveDown(0.5);
        doc.fontSize(12)
           .text('Total Activos', 100, doc.y, { continued: true, width: 300, bold: true })
           .text(`$${this.formatMoney(data.totalAssets)}`, { align: 'right', bold: true });

        doc.moveDown(1);
        doc.moveTo(100, doc.y).lineTo(500, doc.y).stroke();
        doc.moveDown(1);

        // PASIVOS
        doc.fontSize(14).text('PASIVOS', { underline: true });
        doc.moveDown(0.5);

        this.renderAccountHierarchy(doc, data.liabilities, 0);

        doc.moveDown(0.5);
        doc.fontSize(12)
           .text('Total Pasivos', 100, doc.y, { continued: true, width: 300, bold: true })
           .text(`$${this.formatMoney(data.totalLiabilities)}`, { align: 'right', bold: true });

        doc.moveDown(1);
        doc.moveTo(100, doc.y).lineTo(500, doc.y).stroke();
        doc.moveDown(1);

        // PATRIMONIO
        doc.fontSize(14).text('PATRIMONIO', { underline: true });
        doc.moveDown(0.5);

        this.renderAccountHierarchy(doc, data.equity, 0);

        doc.moveDown(0.5);
        doc.fontSize(12)
           .text('Total Patrimonio', 100, doc.y, { continued: true, width: 300, bold: true })
           .text(`$${this.formatMoney(data.totalEquity)}`, { align: 'right', bold: true });

        doc.moveDown(1);
        doc.moveTo(100, doc.y).lineTo(500, doc.y).stroke();
        doc.moveDown(1);

        // TOTAL PASIVO + PATRIMONIO
        doc.fontSize(14)
           .fillColor('blue')
           .text('TOTAL PASIVO + PATRIMONIO', 100, doc.y, { continued: true, width: 300, bold: true })
           .text(`$${this.formatMoney(data.totalLiabilitiesAndEquity)}`, { align: 'right', bold: true });

        doc.moveTo(100, doc.y + 5).lineTo(500, doc.y + 5).stroke();
        doc.moveTo(100, doc.y + 8).lineTo(500, doc.y + 8).stroke();

        // Validación
        doc.moveDown(2);
        const validationText = data.isBalanced ? 
            '✓ El balance está cuadrado (Activos = Pasivos + Patrimonio)' : 
            '⚠ ADVERTENCIA: El balance NO está cuadrado';
        const validationColor = data.isBalanced ? 'green' : 'red';
        
        doc.fontSize(10).fillColor(validationColor).text(validationText, { align: 'center' });

        // Pie de página
        doc.moveDown(2);
        doc.fontSize(8).fillColor('gray').text(
            `Generado: ${new Date().toLocaleString('es-MX')}`,
            { align: 'center' }
        );

        doc.end();
    }

    /**
     * Generar PDF de Balance de Comprobación
     */
    async generateTrialBalancePDF(data, res) {
        const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=balance_comprobacion_${data.period.startDate}_${data.period.endDate}.pdf`);
        doc.pipe(res);

        // Encabezado
        doc.fontSize(18).text('BALANCE DE COMPROBACIÓN', { align: 'center' });
        doc.fontSize(11).text(`Período: ${this.formatDate(data.period.startDate)} al ${this.formatDate(data.period.endDate)}`, { align: 'center' });
        doc.moveDown(2);

        // Encabezados de columnas
        const colX = {
            code: 50,
            name: 120,
            debit: 450,
            credit: 600
        };

        doc.fontSize(10).fillColor('black');
        doc.text('Código', colX.code, doc.y);
        doc.text('Cuenta', colX.name, doc.y);
        doc.text('Débito', colX.debit, doc.y);
        doc.text('Crédito', colX.credit, doc.y);
        
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(750, doc.y).stroke();
        doc.moveDown(0.5);

        // Cuentas
        data.accounts.forEach(acc => {
            const currentY = doc.y;
            
            doc.fontSize(9);
            doc.text(acc.id, colX.code, currentY, { width: 60 });
            doc.text(acc.name, colX.name, currentY, { width: 310 });
            doc.text(`$${this.formatMoney(acc.total_debit)}`, colX.debit, currentY, { width: 130, align: 'right' });
            doc.text(`$${this.formatMoney(acc.total_credit)}`, colX.credit, currentY, { width: 130, align: 'right' });
            
            doc.moveDown(0.7);
        });

        // Línea de totales
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(750, doc.y).stroke();
        doc.moveDown(0.5);

        // Totales
        const totalY = doc.y;
        doc.fontSize(10).fillColor('black');
        doc.text('TOTALES', colX.name, totalY, { bold: true });
        doc.text(`$${this.formatMoney(data.totalDebits)}`, colX.debit, totalY, { width: 130, align: 'right', bold: true });
        doc.text(`$${this.formatMoney(data.totalCredits)}`, colX.credit, totalY, { width: 130, align: 'right', bold: true });

        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(750, doc.y).stroke();
        doc.moveTo(50, doc.y + 3).lineTo(750, doc.y + 3).stroke();

        // Validación
        doc.moveDown(2);
        const validationText = data.isBalanced ? 
            '✓ Balance cuadrado (Débitos = Créditos)' : 
            '⚠ ADVERTENCIA: Débitos y Créditos NO coinciden';
        const validationColor = data.isBalanced ? 'green' : 'red';
        
        doc.fontSize(10).fillColor(validationColor).text(validationText, { align: 'center' });

        // Pie de página
        doc.fontSize(8).fillColor('gray').text(
            `Generado: ${new Date().toLocaleString('es-MX')}`,
            { align: 'center' }
        );

        doc.end();
    }

    /**
     * Renderizar jerarquía de cuentas
     */
    renderAccountHierarchy(doc, accounts, level = 0) {
        const indent = 100 + (level * 20);
        
        accounts.forEach(acc => {
            const isParent = acc.id.split('.').length <= 2;
            const fontSize = isParent ? 11 : 10;
            const isBold = isParent;

            doc.fontSize(fontSize);
            
            if (parseFloat(acc.amount) !== 0) {
                doc.text(acc.name, indent, doc.y, { continued: true, width: 400 - (level * 20) })
                   .text(`$${this.formatMoney(Math.abs(acc.amount))}`, { align: 'right' });
                doc.moveDown(0.3);
            }
        });
    }

    /**
     * Formatear fecha
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    /**
     * Formatear dinero
     */
    formatMoney(amount) {
        return parseFloat(amount).toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
}

module.exports = new PDFService();
