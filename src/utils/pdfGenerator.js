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

export const generateWatchCertificate = (data) => {
    const doc = new jsPDF();

    // COLORS
    const AMBER = [245, 158, 11]; // Amber-500
    const DARK = [15, 23, 42];    // Slate-900
    const GRAY = [100, 116, 139]; // Slate-500

    // HEADER
    doc.setFillColor(...DARK);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("INSPECCIÓN RELOJERÍA", 14, 25);

    doc.setFontSize(10);
    doc.setTextColor(...AMBER);
    doc.text("CERTIFICADO DE AUTENTICIDAD Y ESTADO", 14, 32);

    // DATE
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    const dateStr = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
    doc.text(dateStr, 196, 20, { align: "right" });

    // --- WATCH DETAILS BOX ---
    doc.setFillColor(255, 251, 235); // Amber-50
    doc.setDrawColor(251, 191, 36);  // Amber-400
    doc.roundedRect(14, 50, 182, 35, 3, 3, 'FD');

    doc.setTextColor(...DARK);
    doc.setFontSize(14);
    doc.text(data.brand.toUpperCase(), 20, 62);

    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    doc.text("MARCA", 20, 75);

    doc.setTextColor(...DARK);
    doc.setFontSize(14);
    doc.text(data.model.toUpperCase(), 90, 62);

    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    doc.text("MODELO", 90, 75);

    // --- TIMEGRAPHER RESULTS (The User's Request) ---
    const tgY = 95;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text("RESULTADOS CRONOCOMPARADOR", 14, tgY);

    // Rate
    doc.setFillColor(241, 245, 249); // Slate-100
    doc.roundedRect(14, tgY + 5, 55, 25, 2, 2, 'F');
    doc.setFontSize(16);
    doc.setTextColor(...(data.rate.includes('-') || parseInt(data.rate) > 10 ? [220, 38, 38] : [22, 163, 74])); // Red if high deviation
    doc.text(`${data.rate} s/d`, 41, tgY + 18, { align: "center" });
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text("RATE (MARCHA)", 41, tgY + 26, { align: "center" });

    // Amplitude
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(77, tgY + 5, 55, 25, 2, 2, 'F');
    doc.setFontSize(16);
    // Healthy amplitude usually > 250
    doc.setTextColor(...(parseInt(data.amplitude) < 220 ? [220, 38, 38] : [22, 163, 74]));
    doc.text(`${data.amplitude}°`, 104, tgY + 18, { align: "center" });
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text("AMPLITUD", 104, tgY + 26, { align: "center" });

    // Beat Error
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(140, tgY + 5, 56, 25, 2, 2, 'F');
    doc.setFontSize(16);
    // Healthy Beat Error < 0.8ms
    doc.setTextColor(...(parseFloat(data.beatError) > 0.8 ? [220, 38, 38] : [22, 163, 74]));
    doc.text(`${data.beatError} ms`, 168, tgY + 18, { align: "center" });
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text("BEAT ERROR", 168, tgY + 26, { align: "center" });

    // --- CHECKLIST TABLE ---
    // Transform keys like "Inspección Visual:Cristal" -> ["Cristal", "OK/FALLO"]
    const rows = Object.entries(data.checklist).map(([key, val]) => {
        const label = key.split(':')[1] || key;
        const status = val === true ? "APROBADO" : "FALLO";
        return [label, status];
    });

    autoTable(doc, {
        startY: tgY + 40,
        head: [['PUNTO DE INSPECCIÓN', 'ESTADO']],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [...AMBER], textColor: 255 },
        columnStyles: {
            0: { width: 120 },
            1: { fontStyle: 'bold' }
        },
        didParseCell: function (cellData) {
            if (cellData.section === 'body' && cellData.column.index === 1) {
                if (cellData.cell.raw === 'FALLO') cellData.cell.styles.textColor = [220, 38, 38];
                else cellData.cell.styles.textColor = [22, 163, 74];
            }
        }
    });

    // FOOTER
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Generado por TikTak Suite 2.1 - ${new Date().getFullYear()}`, 105, 285, { align: "center" });
    }

    doc.save(`Reloj_${data.brand}_${data.model}.pdf`);
};

export const generateMeetingPDF = (meetingData) => {
    const { employeeName, interviewerName, date, category, metrics, summary } = meetingData;
    const doc = new jsPDF();

    // COLORS
    const ACCENT = [26, 54, 93]; // Deep Blue
    const GRAY = [107, 114, 128]; // Text Gray
    const SUCCESS = [22, 163, 74];

    // TOP BAR
    doc.setFillColor(...ACCENT);
    doc.rect(0, 0, 210, 4, 'F');

    // LOGO / HEADER
    // Attempt to load logo (as data URL or standard fetch)
    // For now, simple text branding or placeholder
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(...ACCENT);
    doc.text("TIKTAK", 14, 25);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("SUITE GESTIÓN CENTRALIZADA", 14, 30);

    // REPORT TYPE
    doc.setFillColor(243, 244, 246);
    doc.rect(130, 15, 66, 20, 'F');
    doc.setTextColor(...ACCENT);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("ACTA DE REUNIÓN 1:1", 163, 23, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(category.toUpperCase(), 163, 28, { align: "center" });

    // PARTICIPANTS BOX
    const partY = 50;
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(14, partY, 182, 35, 2, 2, 'D');

    // Col 1
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("EMPLEADO", 20, partY + 10);
    doc.setFontSize(11);
    doc.setTextColor(...ACCENT);
    doc.text(employeeName ? employeeName.toUpperCase() : 'N/A', 20, partY + 16);

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("ENTREVISTADOR", 20, partY + 25);
    doc.setFontSize(11);
    doc.setTextColor(...ACCENT);
    doc.text(interviewerName ? interviewerName.toUpperCase() : 'N/A', 20, partY + 31);

    // Col 2
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("FECHA REUNIÓN", 110, partY + 10);
    doc.setFontSize(11);
    doc.setTextColor(...ACCENT);
    doc.text(date, 110, partY + 16);

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("ESTADO", 110, partY + 25);
    doc.setFontSize(11);
    doc.setTextColor(...SUCCESS);
    doc.text("COMPLETADA / FIRMADA", 110, partY + 31);

    // PERFORMANCE TABLE
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...ACCENT);
    doc.text("MÉTRICAS DE RENDIMIENTO ANALIZADAS", 14, 100);

    const tableData = metrics.map(m => [
        m.metric_name,
        m.metric_value,
        m.target || '-',
        m.achievement ? `${m.achievement}%` : '-'
    ]);

    autoTable(doc, {
        startY: 105,
        head: [['KPI / MÉTRICA', 'VALOR REAL', 'OBJETIVO', 'LOGRO']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [...ACCENT], textColor: 255, fontSize: 10 },
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: {
            0: { fontStyle: 'bold' },
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'center', fontStyle: 'bold' }
        }
    });

    // SUMMARY / NOTES
    let finalY = doc.lastAutoTable.finalY + 15;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...ACCENT);
    doc.text("ACUERDOS Y NOTAS", 14, finalY);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(50);
    const splitText = doc.splitTextToSize(summary || 'No hay notas adicionales del ciclo.', 182);
    doc.text(splitText, 14, finalY + 8);

    // SIGNATURES
    const sigY = 240;
    doc.setDrawColor(200);
    doc.line(14, sigY, 90, sigY);
    doc.line(120, sigY, 196, sigY);

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("FIRMADO (EMPLEADO)", 52, sigY + 5, { align: "center" });
    doc.text("FIRMADO (ENTREVISTADOR)", 158, sigY + 5, { align: "center" });

    // FOOTER
    doc.setFontSize(7);
    doc.setTextColor(180);
    doc.text(`TikTak Suite Management Systems · v2.1 · Identificador: ${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 105, 290, { align: "center" });

    doc.save(`Reunion_1_1_${employeeName.replace(/\s+/g, '_')}_${date}.pdf`);
};

export const generateTalentMeetingPDF = (employeeName, interviewerName, data, criteriaByZone) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let currentY = 25;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(31, 41, 55); // Dark text
    doc.text('ACTA DE REUNIÓN INDIVIDUAL', margin, currentY);
    currentY += 8;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128); // Gray text
    doc.text(`TIKTAK SUITE · GESTIÓN DE TALENTO`, margin, currentY);
    currentY += 10;

    // Metadata / Participants Box (Perfect alignment & encuadrado)
    doc.setFillColor(249, 250, 251); // Gray-50
    doc.setDrawColor(229, 231, 235); // Gray-200
    doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 25, 2, 2, 'FD');

    // Column 1: Empleado
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175); // Slate-400
    doc.text("EMPLEADO", margin + 6, currentY + 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55);
    doc.text(employeeName || 'N/A', margin + 6, currentY + 16);

    // Column 2: Entrevistador
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text("ENTREVISTADOR", margin + 80, currentY + 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55);
    doc.text(interviewerName || 'N/A', margin + 80, currentY + 16);

    // Column 3: Fecha
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text("FECHA REUNIÓN", margin + 140, currentY + 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55);
    const meetingDate = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    doc.text(meetingDate, margin + 140, currentY + 16);

    currentY += 35; // Advance past the box

    // Criteria Summary Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(31, 41, 55);
    doc.text('Evaluación por Zonas', margin, currentY);
    currentY += 8;

    Object.entries(criteriaByZone).forEach(([zone, criteria]) => {
        const tableData = criteria.map(c => {
            const val = data.evaluation?.[c.id] || 'N/A';
            const color = val === 'Verde' ? 'CORRECTO' : val === 'Ámbar' ? 'A MEJORAR' : val === 'Rojo' ? 'CRÍTICO' : 'N/A';
            return [c.title, color, data.comments?.[c.id] || ''];
        });

        // Ensure there is enough space on page to start a new zone table (min 40 units)
        if (currentY + 40 > pageHeight - 20) {
            doc.addPage();
            currentY = 25;
        }

        autoTable(doc, {
            startY: currentY,
            head: [[zone, 'Estado', 'Observaciones']],
            body: tableData,
            theme: 'grid', // 'grid' is perfectly framed/encuadrado
            headStyles: { fillColor: [55, 65, 81], textColor: [255, 255, 255], fontStyle: 'bold' },
            margin: { left: margin, right: margin },
            columnStyles: {
                0: { cellWidth: 55, fontStyle: 'bold' },
                1: { cellWidth: 25, halign: 'center' },
                2: { cellWidth: 'auto' }
            },
            styles: { fontSize: 9, cellPadding: 4 },
            didParseCell: function (cellData) {
                if (cellData.section === 'body' && cellData.column.index === 1) {
                    const text = cellData.cell.raw;
                    if (text === 'CRÍTICO') {
                        cellData.cell.styles.textColor = [220, 38, 38]; // Red
                        cellData.cell.styles.fontStyle = 'bold';
                    } else if (text === 'A MEJORAR') {
                        cellData.cell.styles.textColor = [217, 119, 6]; // Amber
                        cellData.cell.styles.fontStyle = 'bold';
                    } else if (text === 'CORRECTO') {
                        cellData.cell.styles.textColor = [22, 163, 74]; // Green
                        cellData.cell.styles.fontStyle = 'bold';
                    }
                }
            }
        });
        currentY = doc.lastAutoTable.finalY + 8;
    });

    // Final Summary Title
    if (currentY + 40 > pageHeight - 20) {
        doc.addPage();
        currentY = 25;
    }
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(31, 41, 55);
    doc.text('Compromisos y Acuerdos', margin, currentY);
    currentY += 10;

    const sections = [
        { label: 'Fortalezas Identificadas', value: data.summary?.strengths },
        { label: 'Puntos de Mejora', value: data.summary?.improvements },
        { label: 'Acciones de Compromiso', value: data.summary?.commitments }
    ];

    sections.forEach(sec => {
        const labelHeight = 8;
        const lineHeight = 6;
        
        // Check if there is enough space for label and at least 1 line of text
        if (currentY + labelHeight + lineHeight + 10 > pageHeight - 20) {
            doc.addPage();
            currentY = 25;
        }

        // Draw section label
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`${sec.label}:`, margin, currentY);
        currentY += labelHeight;

        // Draw section text line by line to prevent overflow and loss of information
        doc.setFont("helvetica", "normal");
        const splitText = doc.splitTextToSize(sec.value || 'No se han definido puntos específicos en esta sección.', pageWidth - (margin * 2));
        
        splitText.forEach(line => {
            if (currentY + lineHeight > pageHeight - 25) { // Leave room for footer
                doc.addPage();
                currentY = 25;
            }
            doc.text(line, margin, currentY);
            currentY += lineHeight;
        });
        
        currentY += 6; // Space after section
    });

    // Signatures
    const signaturesHeight = 35;
    if (currentY + signaturesHeight > pageHeight - 15) {
        doc.addPage();
        currentY = 25;
    }

    currentY = Math.max(currentY, pageHeight - 40);
    doc.setDrawColor(31, 41, 55);
    doc.line(margin, currentY, margin + 70, currentY);
    doc.line(pageWidth - margin - 70, currentY, pageWidth - margin, currentY);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text('Firma Empleado', margin + 35, currentY + 5, { align: "center" });
    doc.text('Firma Entrevistador', pageWidth - margin - 35, currentY + 5, { align: "center" });

    // Dynamic Footers on all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(156, 163, 175);
        doc.text(`Documento generado por TikTak Suite 2.1 - Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: "center" });
    }

    // Download
    const fileName = `Acta_Talento_${employeeName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
};
