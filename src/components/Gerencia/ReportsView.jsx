import React, { useState } from 'react';
import { 
    FileText, 
    Download, 
    Calculator, 
    Pocket 
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { 
    downloadCSV, 
    downloadWeeklyPDF, 
    downloadCashPDF, 
    downloadJewelryPDF 
} from '../../utils/reportUtils';

const ReportsView = ({ batteries, tasks, cashHistory, movements, partners, activeZoneId }) => {
    const safeBatteries = (Array.isArray(batteries) ? batteries : []).filter(b => !activeZoneId || b.zone_id == activeZoneId);
    const safeHistory = Array.isArray(cashHistory) ? cashHistory : [];
    const safeMovements = Array.isArray(movements) ? movements : [];

    const handleDownloadCashCSV = () => {
        const data = safeHistory.map(h => ({
            Fecha: format(parseISO(h.date), 'dd/MM/yyyy'),
            Responsable: h.responsible_1,
            Teorico: h.expected_total,
            Real: h.total,
            Diferencia: (Number(h.total) - Number(h.expected_total)).toFixed(2),
            Observaciones: h.observations
        }));
        downloadCSV(data, `TikTak_Arqueos_${format(new Date(), 'yyyy-MM-dd')}`);
    };

    const handleDownloadJewelryCSV = () => {
        const data = safeMovements.map(m => ({
            Fecha: m.date,
            Tipo: m.type,
            Socio: m.partner_name,
            Peso: m.weight,
            Costo_Adq: m.acquisition_cost,
            Valor_Final: m.received_amount,
            Beneficio: m.status === 'Completado' ? (Number(m.received_amount) - Number(m.acquisition_cost)).toFixed(2) : '0.00',
            Estado: m.status
        }));
        downloadCSV(data, `TikTak_Joyería_${format(new Date(), 'yyyy-MM-dd')}`);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <div className="bg-white/40 backdrop-blur-md p-10 rounded-[40px] border border-white">
                <h2 className="text-3xl font-black text-[#1A365D] tracking-tighter uppercase">Panel de <span className="text-[#FF8C9D]">Informes</span></h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Exportación de datos para contabilidad y control</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* BATERÍAS PDF */}
                <div className="bg-white p-8 rounded-[40px] border border-[#E2E8F0] shadow-sm hover:shadow-xl transition-all group">
                    <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6"><FileText size={28}/></div>
                    <h3 className="text-lg font-black text-[#1A365D] uppercase mb-2">Agenda Semanal</h3>
                    <p className="text-xs text-slate-400 font-bold mb-8">PDF con las tareas de la agenda y las baterías de objetivos vigentes para firma física.</p>
                    <button 
                        onClick={() => downloadWeeklyPDF(safeBatteries, tasks)}
                        className="w-full py-4 bg-[#1A365D] text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-3 group-hover:bg-[#FF8C9D] transition-colors"
                    >
                        <Download size={16}/> GENERAR PDF SEMANAL
                    </button>
                </div>

                {/* ARQUEOS PDF */}
                <div className="bg-white p-8 rounded-[40px] border border-[#E2E8F0] shadow-sm hover:shadow-xl transition-all group">
                    <div className="w-14 h-14 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mb-6"><Calculator size={28}/></div>
                    <h3 className="text-lg font-black text-[#1A365D] uppercase mb-2">Informe Arqueos</h3>
                    <p className="text-xs text-slate-400 font-bold mb-8">PDF profesional con el histórico de cierres de caja, descuadres y auditoría de firmas.</p>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => downloadCashPDF(safeHistory)}
                            className="flex-1 py-4 bg-[#1A365D] text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-3 group-hover:bg-green-600 transition-colors"
                        >
                            <Download size={16}/> PDF
                        </button>
                        <button 
                            onClick={handleDownloadCashCSV}
                            className="px-4 py-4 border-2 border-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-50 transition-all"
                        >
                            CSV
                        </button>
                    </div>
                </div>

                {/* JOYERÍA PDF */}
                <div className="bg-white p-8 rounded-[40px] border border-[#E2E8F0] shadow-sm hover:shadow-xl transition-all group">
                    <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-6"><Pocket size={28}/></div>
                    <h3 className="text-lg font-black text-[#1A365D] uppercase mb-2">Informe Joyería</h3>
                    <p className="text-xs text-slate-400 font-bold mb-8">Reporte corporativo en PDF de fundiciones, beneficios y balances de metales por socio.</p>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => downloadJewelryPDF(safeMovements)}
                            className="flex-1 py-4 bg-[#1A365D] text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-3 group-hover:bg-amber-500 transition-colors"
                        >
                            <Download size={16}/> PDF
                        </button>
                        <button 
                            onClick={handleDownloadJewelryCSV}
                            className="px-4 py-4 border-2 border-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-50 transition-all"
                        >
                            CSV
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsView;
