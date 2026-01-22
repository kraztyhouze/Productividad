import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateDiagnosticCertificate = (session, type = 'mobile') => {
    if (!session || !session.results) return;
    const doc = new jsPDF();

    // Define Brand Colors
    const PRIMARY = [6, 182, 212]; // Cyan-500
    const DARK = [15, 23, 42];     // Slate-900
    const GRAY = [100, 116, 139];  // Slate-500
    const GREEN = [22, 163, 74];   // Green-600
    const RED = [220, 38, 38];     // Red-600

    // Header Branding
    doc.setFillColor(...DARK);
    doc.rect(0, 0, 210, 40, 'F');

    // Title Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    const title = type === 'laptop' ? "PC Diagnostics" : "PhoneCheck AI";
    doc.text(title, 14, 25);

    doc.setFontSize(10);
    doc.setTextColor(...PRIMARY);
    doc.text("CERTIFICADO DE ESTADO TÉCNICO", 14, 32);

    // Reference Info (Top Right)
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    const dateStr = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
    doc.text(dateStr, 196, 20, { align: "right" });

    if (session.sessionId) {
        doc.text(`REF: ${session.sessionId.toUpperCase().slice(0, 8)}`, 196, 26, { align: "right" });
    }

    // --- DEVICE SPECS BOX ---
    const info = session.deviceInfo || {};

    // Background for specs
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.setDrawColor(226, 232, 240); // Slate-200

    let specsHeight = 45;
    let specsStartY = 50;

    // Adjust box height based on content
    if (type === 'laptop') specsHeight = 55;

    doc.roundedRect(14, specsStartY, 182, specsHeight, 3, 3, 'FD');

    doc.setTextColor(...DARK);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("ESPECIFICACIONES DEL SISTEMA", 20, specsStartY + 10);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);

    // Dynamic Specs Grid
    let specsData = [];

    if (type === 'laptop') {
        specsData = [
            { label: "CPU", value: info.cpuModel || info.cpu || 'Genérico' },
            { label: "RAM", value: info.ramTotal || info.ram || 'N/A' },
            { label: "ALMACENAMIENTO", value: info.storage || 'No detectado' },
            { label: "GRAFICA (GPU)", value: `${info.gpu || 'Integrada'} ${info.gpuDetails ? `(${info.gpuDetails})` : ''}` },
            { label: "SISTEMA SEGURO", value: info.secureBoot ? 'Secure Boot Activado' : 'Estándar' },
            { label: "SISTEMA OPERATIVO", value: info.os || 'Windows' },
        ];
    } else {
        specsData = [
            { label: "MODELO", value: info.model || "Desconocido" },
            { label: "PLATAFORMA", value: info.platform || "-" },
            { label: "PANTALLA", value: info.screen || "-" },
            { label: "NAVEGADOR", value: info.userAgent ? "Detectado" : "-" }
        ];
    }

    let col1X = 20;
    let col2X = 110;
    let currentY = specsStartY + 20;

    specsData.forEach((item, index) => {
        const isLeft = index % 2 === 0;
        const xPos = isLeft ? col1X : col2X;

        doc.setFont("helvetica", "bold");
        doc.setTextColor(...GRAY);
        doc.text(item.label, xPos, currentY);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...DARK);
        doc.text(String(item.value).substring(0, 45), xPos, currentY + 5);

        if (!isLeft) currentY += 12; // Advance row after second column
    });


    // --- SCORE STAMP ---
    const rs = Array.isArray(session.results) ? session.results : Object.values(session.results);
    const failedCount = rs.filter(r => r.passed === false).length; // Explicit check, skipped is usually OK-ish
    const skippedCount = rs.filter(r => r.skipped).length;
    const passedCount = rs.filter(r => r.passed === true).length;

    // Overall Status
    let statusText = "APTO";
    let statusColor = GREEN;

    if (failedCount > 0) {
        statusText = "REVISAR";
        statusColor = RED;
    } else if (passedCount === 0 && skippedCount > 0) {
        statusText = "INCOMPLETO";
        statusColor = GRAY;
    }

    // Stamp Position (Top Right over header/box intersection)
    const stampX = 160;
    const stampY = 48; // Overlapping white area

    // Circle background for stamp
    doc.setFillColor(255, 255, 255);
    doc.setCheckIcon = false;

    doc.setDrawColor(...statusColor);
    doc.setLineWidth(1.5);
    doc.roundedRect(stampX, stampY, 36, 20, 2, 2, 'D');
    doc.setFillColor(255, 255, 255);

    doc.setFontSize(11);
    doc.setTextColor(...statusColor);
    doc.setFont("helvetica", "bold");
    doc.text(statusText, stampX + 18, stampY + 11, { align: "center" });

    doc.setFontSize(7);
    doc.text(`${failedCount} Fallos / ${passedCount} OK`, stampX + 18, stampY + 16, { align: "center" });


    // --- RESULTS TABLE ---
    const tableRows = rs.map(r => {
        let status = 'CORRECTO';
        if (r.skipped) status = 'SALTADO';
        if (r.passed === false) status = 'FALLO';

        return [
            r.name.toUpperCase(),
            status,
            r.details || '-'
        ];
    });

    autoTable(doc, {
        startY: specsStartY + specsHeight + 15,
        head: [['PRUEBA', 'ESTADO', 'NOTAS TÉCNICAS']],
        body: tableRows,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: {
            fillColor: [...DARK],
            textColor: 255,
            fontStyle: 'bold',
            halign: 'left'
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
            0: { fontStyle: 'bold', width: 50 },
            1: { fontStyle: 'bold', width: 35 },
            2: { fontStyle: 'italic' }
        },
        didParseCell: function (data) {
            if (data.section === 'body' && data.column.index === 1) {
                const text = data.cell.raw;
                if (text === 'FALLO') data.cell.styles.textColor = [...RED];
                else if (text === 'SALTADO') data.cell.styles.textColor = [234, 88, 12]; // Orange
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
        doc.text(`Generado por TikTak Suite 2.1 - ${new Date().getFullYear()}`, 105, 285, { align: "center" });
        doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: "center" });
    }

    doc.save(`Diagnostico_${type.toUpperCase()}_${session.sessionId ? session.sessionId.slice(0, 8) : 'Manual'}.pdf`);
};
