import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
    DndContext, 
    DragOverlay, 
    closestCorners, 
    closestCenter,
    rectIntersection,
    PointerSensor, 
    KeyboardSensor, 
    useSensor, 
    useSensors,
    defaultDropAnimationSideEffects,
    useDroppable
} from '@dnd-kit/core';
import { 
    arrayMove, 
    SortableContext, 
    sortableKeyboardCoordinates, 
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, 
    LayoutGrid, 
    ClipboardList, 
    Plus, 
    Search, 
    Clock, 
    Zap,
    ChevronRight,
    AlertCircle,
    X,
    Download,
    FileText,
    Trash2
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTeam } from '../../context/TeamContext';
import { useStore } from '../../context/StoreContext';

// --- STYLES & CONSTANTS ---
const ZONES = [
    { id: 'ventas', name: 'Ventas', color: 'emerald', border: 'border-emerald-200', glow: 'shadow-emerald-100', bg: 'bg-emerald-50/50' },
    { id: 'compras', name: 'Compras', color: 'amber', border: 'border-amber-200', glow: 'shadow-amber-100', bg: 'bg-amber-50/50' },
    { id: 'almacen', name: 'Almacén', color: 'blue', border: 'border-blue-200', glow: 'shadow-blue-100', bg: 'bg-blue-50/50' },
    { id: 'web', name: 'Web', color: 'violet', border: 'border-violet-200', glow: 'shadow-violet-100', bg: 'bg-violet-50/50' }
];

const GLASS_STYLE = "bg-white/90 backdrop-blur-xl border border-white shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[32px]";
const LIGHT_BG = "bg-[#F8FAFC] text-slate-800";

// --- SUB-COMPONENTS ---

const DraggableItem = React.memo(({ id, type, data, children, isGhost = false }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id, data: { type, ...data } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging || isGhost ? 0.3 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            {children}
        </div>
    );
});

const StaffCard = React.memo(({ staff, tasks = [], onRemove, onRemoveTask, isDropTarget = false }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `droppable-${staff.id}`,
        data: { type: 'staff_card', staffId: staff.id }
    });

    const isOutOfSchedule = useMemo(() => {
        if (!staff || !staff.start_time || !staff.end_time || !staff.start_time.includes(':')) return false;
        try {
            const now = new Date();
            const currentHour = now.getHours() + now.getMinutes() / 60;
            
            const [sH, sM] = staff.start_time.split(':').map(Number);
            const [eH, eM] = staff.end_time.split(':').map(Number);
            const start = sH + (sM || 0) / 60;
            const end = eH + (eM || 0) / 60;
            
            return currentHour < start || currentHour > end;
        } catch (e) { return false; }
    }, [staff.start_time, staff.end_time]);

    return (
        <motion.div 
            layout
            ref={setNodeRef}
            className={`p-4 ${GLASS_STYLE} flex flex-col gap-2 relative group hover:bg-slate-50 transition-all 
                ${isOutOfSchedule ? 'ring-2 ring-red-400/50 bg-red-50' : ''}
                ${isOver ? 'ring-2 ring-pink-500 bg-pink-50/50 scale-[1.02] shadow-2xl' : ''}
            `}
        >
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${isOutOfSchedule ? 'from-red-500 to-rose-600' : 'from-indigo-500 to-purple-600'} flex items-center justify-center font-black text-white shadow-lg`}>
                    {staff.initials}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black uppercase truncate tracking-tight">{staff.name}</h4>
                    <div className={`flex items-center gap-1.5 opacity-40 text-[10px] font-black uppercase tracking-widest ${isOutOfSchedule ? 'text-red-400' : ''}`}>
                        <Clock size={10} /> {staff.start_time} - {staff.end_time}
                    </div>
                </div>
                {onRemove && (
                    <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-red-400">
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
            
            {tasks.length > 0 && (
                <div className="mt-2 space-y-1">
                    {tasks.map(t => (
                        <div key={t.id} className="group/task flex items-center justify-between text-[9px] font-black uppercase tracking-wider bg-slate-100 hover:bg-slate-200 px-2 py-1.5 rounded-lg border border-slate-200 transition-all text-slate-600">
                            <span className="truncate flex-1">{t.title}</span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onRemoveTask(t.id); }}
                                className="opacity-0 group-hover/task:opacity-100 ml-1 text-slate-400 hover:text-red-500 transition-all font-black"
                                title="Quitar Tarea"
                            >
                                <X size={10} strokeWidth={4} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
});

const ZoneContainer = ({ zone, staffers = [], assignments = {}, onRemoveStaffer, onRemoveTaskFromStaffer, id }) => {
    const { setNodeRef } = useDroppable({
        id: id || zone.id,
        data: { type: 'zone', zoneId: zone.id }
    });

    return (
        <div ref={setNodeRef} className={`flex flex-col h-full ${GLASS_STYLE} overflow-hidden border ${zone.border} ${zone.bg}`}>
            <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/50">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full bg-${zone.color}-500 shadow-sm`} />
                    <h3 className="text-xs font-black uppercase tracking-[0.2em]">{zone.name}</h3>
                </div>
                <span className="text-[10px] font-black opacity-30 uppercase">{staffers.length} Staff</span>
            </header>
            
            <div className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar">
                {staffers.map(s => (
                    <DraggableItem key={s.id} id={`staff-assigned-${s.id}`} type="staff_assigned" data={{ staff: s, zoneId: zone.id }}>
                        <StaffCard 
                            staff={s} 
                            tasks={assignments[s.id]?.tasks || []} 
                            onRemove={() => onRemoveStaffer(s.id, zone.id)}
                            onRemoveTask={(taskId) => onRemoveTaskFromStaffer(s.id, taskId)}
                        />
                    </DraggableItem>
                ))}
                
                {staffers.length === 0 && (
                    <div className="h-32 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest opacity-30 text-center px-4">
                        Suelta staff aquí
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MAIN ENTRANCE ---

const WarRoomOrganizer = ({ tasks = [], batteries = [], currentStore, date = format(new Date(), 'yyyy-MM-dd') }) => {
    const { employees: teamEmployees, loading: loadingTeam } = useTeam();
    const { currentStore: storeFromContext } = useStore();

    const [activeTab, setActiveTab] = useState('canvas'); // 'staff', 'canvas', 'tasks' for mobile
    const [staffBank, setStaffBank] = useState([]);
    const [zonesAssignments, setZonesAssignments] = useState({
        ventas: [], compras: [], almacen: [], web: []
    });
    const [staffTasks, setStaffTasks] = useState({}); // { staffId: { tasks: [] } }
    const [searchTerm, setSearchTerm] = useState('');
    const [activeId, setActiveId] = useState(null);
    const [activeData, setActiveData] = useState(null);

    // Reacting to changes in staff or date
    useEffect(() => {
        const fetchSavedOrganization = async () => {
            try {
                const activeStoreId = currentStore || storeFromContext || localStorage.getItem('tiktak_current_store') || 'store_1';
                
                // 1. Fetch saved state
                const res = await fetch(`/api/daily-organizer/${date}`, {
                    headers: { 'x-store-id': activeStoreId }
                });
                const data = await res.json();
                
                // 2. Identify already assigned IDs
                let assignedIds = new Set();
                let savedBank = null;

                if (data.organization_data) {
                    const org = typeof data.organization_data === 'string' ? JSON.parse(data.organization_data) : data.organization_data;
                    setZonesAssignments(org.zones || { ventas: [], compras: [], almacen: [], web: [] });
                    setStaffTasks(org.assignments || {});
                    savedBank = org.bank;
                    
                    // Mark assigned IDs
                    Object.values(org.zones || {}).flat().forEach(s => assignedIds.add(String(s.id)));
                } else {
                    // Reset if no data for this date
                    setZonesAssignments({ ventas: [], compras: [], almacen: [], web: [] });
                    setStaffTasks({});
                }

                // 3. Populate Staff Bank
                // Filter: Active, ShowInWarRoom, and NOT assigned
                const eligibleEmployees = (teamEmployees || [])
                    .filter(e => e.isActive !== false && e.showInWarRoom !== false && !assignedIds.has(String(e.id)));

                const bankForDay = eligibleEmployees.map(e => ({
                    id: e.id,
                    name: e.nombre || e.alias || `${e.firstName} ${e.lastName}`,
                    initials: (e.alias || e.firstName || 'U').substring(0, 2).toUpperCase(),
                    start_time: '00:00',
                    end_time: '23:59'
                }));

                setStaffBank(bankForDay);
            } catch (e) { console.error('Error loading War Room data:', e); }
        };
        
        if (!loadingTeam) {
            fetchSavedOrganization();
        }
    }, [date, currentStore, storeFromContext, teamEmployees, loadingTeam]);

    // Auto-save when assignments change
    useEffect(() => {
        const saveData = async () => {
            try {
                await fetch('/api/daily-organizer', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'x-store-id': currentStore || localStorage.getItem('tiktak_current_store')
                    },
                    body: JSON.stringify({ 
                        date, 
                        organization_data: {
                            zones: zonesAssignments,
                            assignments: staffTasks,
                            bank: staffBank
                        }
                    })
                });
            } catch (e) { console.error('Error saving organization:', e); }
        };
        const timeout = setTimeout(saveData, 1000);
        return () => clearTimeout(timeout);
    }, [zonesAssignments, staffTasks, staffBank, date, currentStore]);

    // Filter tasks not yet assigned
    const unassignedTasks = useMemo(() => {
        // Collect all tasks from batteries and regular tasks
        const allBatteryTasks = batteries.flatMap(b => (b.items || []).map(i => ({
            id: `battery-item-${i.id}`,
            title: i.description,
            category: b.title,
            priority_level: 'Normal', // Default
            source: 'battery',
            originalId: i.id
        })));

        const combinedTasks = [
            ...tasks.map(t => ({ ...t, source: 'regular' })),
            ...allBatteryTasks
        ];

        const assignedTaskIds = Object.values(staffTasks).flatMap(s => (s.tasks || []).map(t => t.id));
        return combinedTasks.filter(t => 
            !assignedTaskIds.includes(t.id) && 
            t.status !== 'Hecha' && // IMPORTANTE: Ocultar las ya terminadas
            (searchTerm === '' || t.title.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [tasks, batteries, staffTasks, searchTerm]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // --- LOGIC ---
    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const dateStr = format(new Date(date), "EEEE d 'de' MMMM", { locale: es });
            
            let isFirstZone = true;

            ZONES.forEach((zone) => {
                const staffersInZone = zonesAssignments[zone.id] || [];
                if (staffersInZone.length === 0) return;

                if (!isFirstZone) {
                    doc.addPage();
                }
                isFirstZone = false;

                let currentY = 20;

                // Page Header
                doc.setFontSize(18);
                doc.setTextColor(30, 41, 59); // Slate-800
                doc.text(`ORGANIZACIÓN DIARIA: ${zone.name}`, pageWidth / 2, currentY, { align: 'center' });
                currentY += 10;

                doc.setFontSize(12);
                doc.setTextColor(100, 116, 139); // Slate-500
                doc.text(dateStr.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
                currentY += 15;

                // Elegant Table
                const tableData = staffersInZone.map(staff => {
                    const tasks = staffTasks[staff.id]?.tasks || [];
                    const taskList = tasks.length > 0 
                        ? tasks.map(t => `• ${t.title}`).join('\n')
                        : 'Sin tareas asignadas';
                    return [staff.name, taskList];
                });

                autoTable(doc, {
                    startY: currentY,
                    head: [['Personal', 'Tareas a Realizar']],
                    body: tableData,
                    theme: 'grid',
                    headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold' },
                    styles: { fontSize: 11, cellPadding: 8, overflow: 'linebreak' },
                    margin: { horizontal: 14 }
                });
            });

            doc.save(`WarRoom_${date}.pdf`);
            console.log('PDF Exportado con éxito');
        } catch (error) {
            console.error('Error al exportar PDF:', error);
            alert('Error al generar el PDF. Asegúrate de tener staff asignado a alguna zona.');
        }
    };

    const handleDragStart = (event) => {
        const { active } = event;
        setActiveId(active.id);
        setActiveData(active.data.current);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveData(null);

        if (!over) return;

        const activeType = active.data.current.type;
        const overId = over.id;
        const overData = over.data.current;
        // Use the overId if it's already a zone ID (like 'ventas'), or get zoneId from data if dropped over a staffer
        const overZoneId = overData?.zoneId || (typeof overId === 'string' && overId.startsWith('zone-') ? overId.replace('zone-', '') : null);

        // 1. Staff from Bank to Zone (or onto another staffer in that zone)
        if (activeType === 'staff_bank' && overZoneId) {
            const staff = active.data.current.staff;
            setStaffBank(prev => prev.filter(s => s.id !== staff.id));
            setZonesAssignments(prev => ({
                ...prev,
                [overZoneId]: [...(prev[overZoneId] || []), staff]
            }));
        }

        // 2. Task from Sidebar to Staff Card
        if (activeType === 'task_sidebar' && active.data.current.task) {
            // Check if dropped over a staff card (either in zone list or sorting)
            const staffId = overData?.staffId || (overData?.type === 'staff_assigned' ? overId : null);
            
            if (staffId) {
                const task = active.data.current.task;
                setStaffTasks(prev => ({
                    ...prev,
                    [staffId]: {
                        ...prev[staffId],
                        tasks: [...(prev[staffId]?.tasks || []), task]
                    }
                }));
            }
        }
    };

    const removeStaffer = (staffId, zoneId) => {
        const staff = zonesAssignments[zoneId].find(s => s.id === staffId);
        if (!staff) return;

        setZonesAssignments(prev => ({
            ...prev,
            [zoneId]: prev[zoneId].filter(s => s.id !== staffId)
        }));
        setStaffBank(prev => [...prev, staff]);
        
        // Remove their tasks too
        setStaffTasks(prev => {
            const copy = { ...prev };
            delete copy[staffId];
            return copy;
        });
    };

    const removeTaskFromStaffer = (staffId, taskId) => {
        setStaffTasks(prev => {
            const currentTasks = prev[staffId]?.tasks || [];
            return {
                ...prev,
                [staffId]: {
                    ...prev[staffId],
                    tasks: currentTasks.filter(t => t.id !== taskId)
                }
            };
        });
    };

    return (
        <div className={`w-full h-[calc(100vh-120px)] p-6 ${LIGHT_BG} overflow-hidden flex flex-col gap-6 animate-in fade-in duration-700`}>
            
            {/* HEADER SIMPLIFICADO CON PDF */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase mb-2">War Room Organizer</h1>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                            {format(new Date(date), "EEEE d 'de' MMMM", { locale: es })}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={exportToPDF}
                        className="flex items-center gap-3 bg-white border-2 border-slate-800 text-slate-800 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-lg active:scale-95"
                    >
                        <Download size={16} /> Exportar Organigrama PDF
                    </button>
                    <div className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-2 cursor-default">
                        <Users size={16} fill="white" /> {staffBank.length + Object.values(zonesAssignments).flat().length} Staff Total
                    </div>
                </div>
            </header>

            {/* TAB NAVIGATION (MOBILE ONLY) */}
            <div className={`grid grid-cols-3 gap-2 lg:hidden ${GLASS_STYLE} p-2`}>
                {[
                    { id: 'staff', label: 'Staff', icon: Users },
                    { id: 'canvas', label: 'Canvas', icon: LayoutGrid },
                    { id: 'tasks', label: 'Tareas', icon: ClipboardList }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col items-center gap-1 py-3 rounded-2xl transition-all ${activeTab === tab.id ? 'bg-white/10 text-white shadow-xl' : 'text-white/40'}`}
                    >
                        <tab.icon size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                    </button>
                ))}
            </div>

            <DndContext 
                sensors={sensors}
                collisionDetection={rectIntersection}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
                    
                    {/* LEFT COLUMN: STAFF BANK (ALL EMPLOYEES) */}
                    <div className={`lg:col-span-2 flex flex-col gap-4 overflow-hidden ${activeTab === 'staff' ? 'flex' : 'hidden lg:flex'}`}>
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <Users size={16} className="text-indigo-400" />
                                <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Banco de Staff</h2>
                            </div>
                            <span className="text-[10px] font-black bg-indigo-50 text-indigo-400 px-2 py-0.5 rounded-lg">{staffBank.length}</span>
                        </div>
                        <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                            {staffBank.map(s => (
                                <DraggableItem key={s.id} id={`staff-bank-${s.id}`} type="staff_bank" data={{ staff: s }}>
                                    <div className={`p-4 ${GLASS_STYLE} border-none hover:bg-white hover:shadow-xl transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden`}>
                                        <div className="absolute top-0 right-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-all" />
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-white text-indigo-500 flex items-center justify-center font-black text-xs border border-indigo-100">
                                                {s.initials}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-black uppercase truncate text-slate-700">{s.name}</p>
                                                <p className="text-[9px] opacity-40 font-bold uppercase tracking-widest">Disponible</p>
                                            </div>
                                        </div>
                                    </div>
                                </DraggableItem>
                            ))}
                        </div>
                    </div>

                    {/* CENTER: ZONES CANVAS */}
                    <div className={`lg:col-span-7 flex flex-col gap-4 ${activeTab === 'canvas' ? 'flex' : 'hidden lg:flex'}`}>
                        <div className="flex items-center gap-2 px-2">
                            <LayoutGrid size={16} className="text-emerald-500" />
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Canvas Operativo</h2>
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-4">
                            {ZONES.map(z => (
                                <ZoneContainer 
                                    key={z.id} 
                                    zone={z} 
                                    id={`zone-${z.id}`}
                                    staffers={zonesAssignments[z.id]} 
                                    assignments={staffTasks}
                                    onRemoveStaffer={removeStaffer}
                                    onRemoveTaskFromStaffer={removeTaskFromStaffer}
                                />
                            ))}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: TASK SIDEBAR */}
                    <div className={`lg:col-span-3 flex flex-col gap-4 overflow-hidden ${activeTab === 'tasks' ? 'flex' : 'hidden lg:flex'}`}>
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <ClipboardList size={16} className="text-pink-500" />
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Tareas Disponibles</h2>
                            </div>
                            <span className="text-[10px] font-black bg-pink-500/20 text-pink-400 px-2 py-0.5 rounded-full">{unassignedTasks.length}</span>
                        </div>
                        
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                            <input 
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Filtrar tareas..."
                                className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-xs font-medium outline-none focus:ring-2 focus:ring-pink-500/10 transition-all shadow-sm"
                            />
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                            {unassignedTasks.map(t => (
                                <DraggableItem key={t.id} id={`task-sidebar-${t.id}`} type="task_sidebar" data={{ task: t }}>
                                    <div className={`p-4 ${GLASS_STYLE} bg-white hover:bg-slate-50 transition-all border-none group cursor-grab`}>
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${t.priority_level === 'Urgente' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                                    <span className="text-[9px] font-black opacity-30 uppercase tracking-widest">
                                                        {t.source === 'battery' ? `Batería: ${t.category}` : t.category}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] font-black uppercase truncate tracking-tight">{t.title}</p>
                                            </div>
                                            <div className="p-2 opacity-0 group-hover:opacity-100 transition-all text-pink-400">
                                                <Zap size={14} />
                                            </div>
                                        </div>
                                    </div>
                                </DraggableItem>
                            ))}
                            {unassignedTasks.length === 0 && (
                                <div className="p-12 text-center opacity-20 flex flex-col items-center gap-4">
                                    <Sparkles size={32} />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Todo asignado</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {createPortal(
                    <DragOverlay dropAnimation={{
                        sideEffects: defaultDropAnimationSideEffects({
                            styles: { active: { opacity: '0.5' } }
                        })
                    }}>
                        {activeId && activeData ? (
                            <div className="scale-105 pointer-events-none transition-transform shadow-2xl z-[9999]">
                                {activeData.staff ? (
                                    <StaffCard staff={activeData.staff} tasks={staffTasks[activeData.staff.id]?.tasks || []} />
                                ) : activeData.task ? (
                                    <div className={`p-4 ${GLASS_STYLE} bg-indigo-600 text-white min-w-[200px] shadow-2xl rounded-2xl`}>
                                        <p className="text-[11px] font-black uppercase truncate">{activeData.task.title}</p>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                    </DragOverlay>,
                    document.body
                )}
            </DndContext>
        </div>
    );
};

export default WarRoomOrganizer;
