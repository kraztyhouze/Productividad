import { format, parseISO } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
        
        doc.autoTable({
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
    doc.autoTable({
        startY: 30,
        head: [['Fecha/Hora', 'Título', 'Firma']],
        body: tasks.filter(t => t.status !== 'Hecha').map(t => [
            `${format(parseISO(t.date), 'dd/MM')} ${t.time || ''}`,
            t.title,
            ''
        ]),
        theme: 'striped'
    });

    doc.save(`TikTak_Agenda_Semanal_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const downloadCashPDF = (history) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("HISTORICO DE ARQUEOS TIKTAK", 14, 22);
    doc.autoTable({
        startY: 30,
        head: [['Fecha', 'Resp.', 'Esperado', 'Real', 'Diff']],
        body: history.map(h => [
            format(parseISO(h.date), 'dd/MM/yy'),
            h.responsible_1,
            `${Number(h.expected_total).toFixed(2)}€`,
            `${Number(h.total).toFixed(2)}€`,
            `${(Number(h.total) - Number(h.expected_total)).toFixed(2)}€`
        ])
    });
    doc.save(`Arqueos_TikTak_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const downloadJewelryPDF = (movements) => {
    const doc = new jsPDF();
    doc.text("INFORME OPERATIVA JOYERÍA", 14, 20);
    doc.autoTable({
        startY: 30,
        head: [['Fecha', 'Tipo', 'Socio', 'Peso', 'Costo', 'Valor Final']],
        body: movements.map(m => [
            format(parseISO(m.date), 'dd/MM/yy'),
            m.type,
            m.partner_name,
            `${m.weight}g`,
            m.acquisition_cost ? `${m.acquisition_cost}€` : '-',
            m.received_amount ? `${m.received_amount}€` : '-'
        ])
    });
    doc.save(`Joyeria_TikTak_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
