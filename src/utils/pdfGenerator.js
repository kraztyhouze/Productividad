import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateDiagnosticCertificate = (session) => {
    if (!session || !session.results) return;
    const doc = new jsPDF();

    // Define Brand Colors
    const PINK = [219, 39, 119];
    const DARK = [15, 23, 42];
    const GRAY = [100, 116, 139];
    const GREEN = [22, 163, 74];
    const RED = [220, 38, 38];

    // --- HEADER ---
    doc.setFillColor(...DARK);
    doc.rect(0, 0, 210, 40, 'F');

    // Title & Subtitle
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    doc.text("PhoneCheck AI", 14, 25);

    doc.setFontSize(10);
    doc.setTextColor(...PINK);
    doc.text("INFORME DE CERTIFICACIÓN DE DISPOSITIVO", 14, 32);

    // Employee Info
    const emp = session.deviceInfo?.employee;
    if (emp) {
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(8);
        doc.text(`TÉCNICO: ${emp.toUpperCase()}`, 14, 37);
    }

    // Date & Ref
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    const dateStr = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
    doc.text(dateStr, 196, 20, { align: "right" });
    doc.text(`REF: ${session.sessionId.toUpperCase().slice(0, 8)}`, 196, 26, { align: "right" });

    // --- DEVICE INFO BOX ---
    const info = session.deviceInfo || {};
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 50, 182, 35, 3, 3, 'FD');

    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    doc.text("DISPOSITIVO", 20, 60);
    doc.text("PLATAFORMA", 100, 60);

    doc.setFontSize(12);
    doc.setTextColor(...DARK);
    doc.setFont("helvetica", "bold");
    doc.text(info.model || "Desconocido", 20, 67);
    doc.text(info.platform || "-", 100, 67);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.text(info.userAgent ? "User-Agent Detectado" : "-", 20, 75);
    if (info.screen) doc.text(`Pantalla: ${info.screen}`, 100, 75);

    // --- SCORE / SUMMARY ---
    const rs = Array.isArray(session.results) ? session.results : Object.values(session.results);
    const failedCount = rs.filter(r => !r.passed).length;
    const totalCount = rs.length;
    const isClean = failedCount === 0 && totalCount > 0;

    // Stamp
    doc.setDrawColor(...(isClean ? GREEN : RED));
    doc.setLineWidth(1);
    doc.roundedRect(150, 55, 40, 25, 2, 2, 'D');

    doc.setFontSize(14);
    doc.setTextColor(...(isClean ? GREEN : RED));
    doc.setFont("helvetica", "bold");
    doc.text(isClean ? "APTO" : "REVISAR", 170, 68, { align: "center" });
    doc.setFontSize(8);
    doc.text(isClean ? "100% FUNCIONAL" : `${failedCount} ERRORES`, 170, 74, { align: "center" });

    // --- TABLE ---
    const rows = rs.map(r => [
        r.name.toUpperCase(),
        r.passed ? 'CORRECTO' : 'FALLO',
        r.details || '-'
    ]);

    autoTable(doc, {
        startY: 95,
        head: [['COMPONENTE / TEST', 'ESTADO', 'DETALLES TÉCNICOS']],
        body: rows,
        theme: 'grid',
        headStyles: {
            fillColor: [...DARK],
            textColor: 255,
            fontStyle: 'bold',
            halign: 'left'
        },
        bodyStyles: { textColor: 50 },
        columnStyles: {
            0: { fontStyle: 'bold', width: 50 },
            1: { fontStyle: 'bold', width: 40 },
            2: { fontStyle: 'italic' }
        },
        didParseCell: function (data) {
            if (data.section === 'body' && data.column.index === 1) {
                if (data.cell.raw === 'FALLO') data.cell.styles.textColor = [...RED];
                else data.cell.styles.textColor = [...GREEN];
            }
        }
    });

    // --- FOOTER ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Generado automáticamente por TikTak Market Suite - Página ${i} de ${pageCount}`, 105, 290, { align: "center" });
    }

    doc.save(`Certificado_${session.sessionId.slice(0, 8)}.pdf`);
};
