import { format, parseISO } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const downloadCSV = (data, fileName) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
            const val = row[header] === null || row[header] === undefined ? '' : row[header].toString();
            return `"${val.replace(/"/g, '""')}"`;
        }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.csv`;
    link.click();
};

export const downloadWeeklyPDF = (batteries, tasks) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text(`PLAN SEMANAL TIKTAK - ${format(new Date(), 'dd/MM/yyyy')}`, 14, 20);
    
    let y = 35;
    batteries.forEach(b => {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.setTextColor(26, 54, 93);
        doc.text(`BATERIA: ${b.title.toUpperCase()}`, 14, y);
        y += 10;
        
        autoTable(doc, {
            startY: y,
            head: [['Tarea', 'Estado', 'Firma']],
            body: (b.items || []).map(i => [i.description, i.is_done ? 'HECHA' : 'PENDIENTE', '']),
            theme: 'grid',
            headStyles: { fillGray: 200, textColor: 0, fontStyle: 'bold' }
        });
        y = doc.lastAutoTable.finalY + 15;
    });

    doc.addPage();
    doc.text('AGENDA DE TAREAS PENDIENTES', 14, 20);
    autoTable(doc, {
        startY: 30,
        head: [['Fecha/Hora', 'Título', 'Firma']],
        body: (tasks || []).filter(t => t.status !== 'Hecha').map(t => {
            let dateStr = 'N/A';
            try {
                if (t.date) dateStr = format(parseISO(t.date), 'dd/MM');
            } catch (e) { console.error("PDF Date Error:", e); }
            
            return [
                `${dateStr} ${t.time || ''}`,
                t.title,
                ''
            ];
        }),
        theme: 'striped'
    });

    doc.save(`TikTak_Agenda_Semanal_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const downloadCashPDF = (history) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("HISTORICO DE ARQUEOS TIKTAK", 14, 22);
    autoTable(doc, {
        startY: 30,
        head: [['Fecha', 'Resp.', 'Esperado', 'Real', 'Diff']],
        body: history.map(h => {
            let dateStr = 'N/A';
            try {
                if (h.date) dateStr = format(parseISO(h.date), 'dd/MM/yy');
            } catch (e) {}
            return [
                dateStr,
                h.responsible_1 || 'N/A',
                `${Number(h.expected_total || 0).toFixed(2)}€`,
                `${Number(h.total || 0).toFixed(2)}€`,
                `${(Number(h.total || 0) - Number(h.expected_total || 0)).toFixed(2)}€`
            ];
        })
    });
    doc.save(`Arqueos_TikTak_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const downloadJewelryPDF = (movements) => {
    const doc = new jsPDF();
    doc.text("INFORME OPERATIVA JOYERÍA", 14, 20);
    autoTable(doc, {
        startY: 30,
        head: [['Fecha', 'Tipo', 'Socio', 'Peso', 'Costo', 'Valor Final']],
        body: movements.map(m => {
            let dateStr = 'N/A';
            try {
                if (m.date) dateStr = format(parseISO(m.date), 'dd/MM/yy');
            } catch (e) {}
            return [
                dateStr,
                m.type || 'N/A',
                m.partner_name || 'N/A',
                `${m.weight || 0}g`,
                m.acquisition_cost ? `${Number(m.acquisition_cost).toFixed(2)}€` : '-',
                m.received_amount ? `${Number(m.received_amount).toFixed(2)}€` : '-'
            ];
        })
    });
    doc.save(`Joyeria_TikTak_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const downloadPerformancePDF = (stats, employees, startDate, endDate) => {
    const doc = new jsPDF('landscape');
    const sortedEmpIds = Object.keys(stats).sort((a, b) => stats[b].totalGroups - stats[a].totalGroups);

    doc.setFontSize(20);
    doc.setTextColor(26, 54, 93);
    doc.text(`INFORME DE RENDIMIENTO TIKTAK`, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`Periodo: ${startDate} al ${endDate} | Generado: ${format(new Date(), 'dd/MM/yy HH:mm')}`, 14, 28);

    const body = sortedEmpIds.map(empId => {
        const data = stats[empId];
        const emp = employees.find(e => e.id === parseInt(empId));
        
        const shiftHours = data.totalSeconds / 3600;
        const buyingHours = data.clientSeconds / 3600;
        const totalInt = data.totalGroups + (data.noDeal || 0);

        const h = Math.floor(data.totalSeconds / 3600);
        const m = Math.floor((data.totalSeconds % 3600) / 60);
        const shiftStr = `${h}h ${m}m`;

        return [
            emp?.alias || emp?.firstName || 'Auto',
            data.daysActive.size,
            shiftStr,
            buyingHours > 0 ? (data.totalGroups / buyingHours).toFixed(1) : '0.0',
            data.totalGroups,
            data.standard,
            data.jewelry,
            data.recoverable,
            data.noDeal || 0,
            totalInt > 0 ? `${((data.totalGroups / totalInt) * 100).toFixed(0)}%` : '0%',
            data.totalSeconds > 0 ? `${((data.clientSeconds / data.totalSeconds) * 100).toFixed(0)}%` : '0%'
        ];
    });

    autoTable(doc, {
        startY: 35,
        head: [['Empleado', 'Días', 'T. Turno', 'Gr/h (C)', 'Total Gr', 'Gen', 'Joy', 'Rec', 'N.C.', 'Hit%', 'Efic%']],
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [26, 54, 93], fontSize: 8 },
        styles: { fontSize: 8 },
        columnStyles: {
            0: { fontStyle: 'bold', fontSize: 9 },
            4: { fontStyle: 'bold', textColor: [225, 29, 72] }
        }
    });

    const glossary = [
        ["Gr/h (C)", "Gramos comprados por cada hora de atencion directa."],
        ["Hit Rate", "Tasa de exito: Compras finalizadas / Clientes atendidos."],
        ["Eficiencia", "Porcentaje de la jornada dedicada a atencion directa."]
    ];

    doc.setFontSize(12);
    doc.text("GLOSARIO", 14, doc.lastAutoTable.finalY + 15);
    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        body: glossary,
        theme: 'plain',
        styles: { fontSize: 7, cellPadding: 1 }
    });

    doc.save(`Rendimiento_${startDate}_${endDate}.pdf`);
};
