import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth, ROLES } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useGerencia } from '../hooks/useGerencia';
import { useMeetings } from '../hooks/useMeetings';
import { useAgenda } from '../hooks/useAgenda';
import { AnimatePresence } from 'framer-motion';

// Components
import GerenciaDashboard from '../components/Gerencia/GerenciaDashboard';
import TasksView from '../components/Gerencia/TasksView';
import JewelryView from '../components/Gerencia/JewelryView';
import MeetingsView from '../components/Gerencia/MeetingsView';
import CashView from '../components/Gerencia/CashView';
import ReportsView from '../components/Gerencia/ReportsView';
import TrackingView from '../components/Gerencia/TrackingView';
import TaskForm from '../components/Gerencia/TaskForm';
import BatteryForm from '../components/Gerencia/BatteryForm';
import BatteryItemForm from '../components/Gerencia/BatteryItemForm';
import BatteryCheckForm from '../components/Gerencia/BatteryCheckForm';
import ZoneManagerForm from '../components/Gerencia/ZoneManagerForm';
import XPBonusForm from '../components/Gerencia/XPBonusForm';
import GenericModal from '../components/Gerencia/GenericModal';
import CriterionManager from '../components/Gerencia/CriterionManager';
import ScheduleForm from '../components/Gerencia/ScheduleForm';
import { GOLDSMITH_CATEGORIES } from '../constants/gerenciaConstants';

// Jewelry Components
import PartnerForm from '../components/Gerencia/PartnerForm';
import MovementForm from '../components/Gerencia/MovementForm';
import OrderForm from '../components/Gerencia/OrderForm';
import RefineForm from '../components/Gerencia/RefineForm';
import InventoryAdjustmentModal from '../components/Gerencia/InventoryAdjustmentModal';
import OrderClosureModal from '../components/Gerencia/OrderClosureModal';

const Gerencia = () => {
    const { user } = useAuth();
    const { currentStore } = useStore();
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Core data and state
    const data = useGerencia();
    const meetings = useMeetings();
    const agenda = useAgenda(data.tasks);

    // Tab and Sidebar State - sync with URL
    const activeTab = searchParams.get('tab') || 'dashboard';
    const setActiveTab = (tab) => setSearchParams({ tab });

    useEffect(() => {
        const isMobile = window.innerWidth < 1024;
        if (isMobile && !searchParams.get('tab')) {
            setActiveTab('tasks');
        }
    }, []);
    const [activeZoneId, setActiveZoneId] = useState('');

    // Modal States
    const [modal, setModal] = useState({ type: null, data: null });

    const openModal = (type, modalData = null) => setModal({ type, data: modalData });
    const closeModal = () => setModal({ type: null, data: null });

    // --- AGENDA & TASKS ACTIONS ---
    const handleSaveTask = async (taskData) => {
        const res = await agenda.saveTask(taskData);
        if (res.success) {
            data.refresh();
            closeModal();
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('¿Eliminar esta tarea y sus futuras repeticiones?')) return;
        try {
            const res = await fetch(`/api/tasks/${taskId}`, { 
                method: 'DELETE',
                headers: { 'x-store-id': currentStore }
            });
            if (res.ok) {
                data.refresh();
                closeModal();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSaveBattery = async (batteryData) => {
        try {
            const method = batteryData.id ? 'PUT' : 'POST';
            const url = batteryData.id ? `/api/task-batteries/${batteryData.id}` : '/api/task-batteries';
            const res = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json', 
                    'x-store-id': currentStore,
                    'x-user-role': user?.role === ROLES.MANAGER ? 'Gerente' : user?.role
                },
                body: JSON.stringify(batteryData)
            });
            if (res.ok) {
                data.refresh();
                closeModal();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddBatteryItem = async (itemData) => {
        try {
            const res = await fetch(`/api/task-batteries/${itemData.battery_id}/items`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'x-store-id': currentStore,
                    'x-user-role': user?.role === ROLES.MANAGER ? 'Gerente' : user?.role
                },
                body: JSON.stringify({ description: itemData.description })
            });
            if (res.ok) {
                data.refresh();
                closeModal();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleCheckBatteryItem = async (itemId, status, signerName) => {
        try {
            const res = await fetch(`/api/task-batteries/items/${itemId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json', 
                    'x-store-id': currentStore,
                    'x-user-role': user?.role === ROLES.MANAGER ? 'Gerente' : user?.role
                },
                body: JSON.stringify({ is_done: status, completed_by: signerName })
            });
            if (res.ok) {
                data.refresh();
                closeModal();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteBattery = async (id) => {
        if (!window.confirm('¿Eliminar plan?')) return;
        try {
            const res = await fetch(`/api/task-batteries/${id}`, { 
                method: 'DELETE', 
                headers: { 'x-store-id': currentStore }
            });
            if (res.ok) data.refresh();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteBatteryItem = async (itemId) => {
        if (!window.confirm('¿Eliminar tarea de la lista?')) return;
        try {
            const res = await fetch(`/api/task-batteries/items/${itemId}`, { 
                method: 'DELETE',
                headers: { 'x-store-id': currentStore }
            });
            if (res.ok) data.refresh();
        } catch (e) {
            console.error(e);
        }
    };

    const handleSaveZone = async (zoneData) => {
        try {
            const method = zoneData.id ? 'PUT' : 'POST';
            const url = zoneData.id ? `/api/gerencia/store-zones/${zoneData.id}` : '/api/gerencia/store-zones';
            const res = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json', 
                    'x-store-id': currentStore,
                    'x-user-role': user?.role === ROLES.MANAGER ? 'Gerente' : user?.role
                },
                body: JSON.stringify(zoneData)
            });
            if (res.ok) {
                data.refresh();
                closeModal();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleMoveBattery = async (batteryId, direction) => {
        const zoneBatteries = data.batteries.filter(b => b.zone_id === data.batteries.find(bt => bt.id === batteryId)?.zone_id);
        const currentIndex = zoneBatteries.findIndex(b => b.id === batteryId);
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (newIndex >= 0 && newIndex < zoneBatteries.length) {
            const currentBattery = zoneBatteries[currentIndex];
            const otherBattery = zoneBatteries[newIndex];

            const currentOrder = currentBattery.sort_order || currentIndex;
            const otherOrder = otherBattery.sort_order || newIndex;

            await Promise.all([
                fetch(`/api/task-batteries/${currentBattery.id}/sort-order`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'x-store-id': currentStore },
                    body: JSON.stringify({ sort_order: otherOrder })
                }),
                fetch(`/api/task-batteries/${otherBattery.id}/sort-order`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'x-store-id': currentStore },
                    body: JSON.stringify({ sort_order: currentOrder })
                })
            ]);
            data.refresh();
        }
    };

    const handleDeleteZone = async (id) => {
        if (!window.confirm('¿Borrar zona?')) return;
        try {
            const res = await fetch(`/api/gerencia/store-zones/${id}`, { 
                method: 'DELETE',
                headers: { 'x-store-id': currentStore }
            });
            if (res.ok) data.refresh();
        } catch (e) {
            console.error(e);
        }
    };

    // --- JEWELRY ACTIONS ---
    const handleSavePartner = async (partnerData) => {
        try {
            const method = partnerData.id ? 'PUT' : 'POST';
            const url = partnerData.id ? `/api/gerencia/goldsmith/partners/${partnerData.id}` : '/api/gerencia/goldsmith/partners';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'x-store-id': currentStore },
                body: JSON.stringify(partnerData)
            });
            if (res.ok) {
                data.refresh();
                closeModal();
            }
        } catch (e) { console.error(e); }
    };

    const handleDeletePartner = async (id) => {
        if (!window.confirm('¿Eliminar socio y todo su historial?')) return;
        try {
            const res = await fetch(`/api/gerencia/goldsmith/partners/${id}`, {
                method: 'DELETE',
                headers: { 'x-store-id': currentStore }
            });
            if (res.ok) data.refresh();
        } catch (e) { console.error(e); }
    };

    const handleSaveMovement = async (moveData) => {
        try {
            const res = await fetch('/api/gerencia/goldsmith/movements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-store-id': currentStore },
                body: JSON.stringify(moveData)
            });
            if (res.ok) {
                data.refresh();
                closeModal();
            }
        } catch (e) { console.error(e); }
    };

    const handleDeleteMovement = async (id) => {
        if (!window.confirm('¿Borrar este movimiento? El stock se revertirá.')) return;
        try {
            const res = await fetch(`/api/gerencia/goldsmith/movements/${id}`, {
                method: 'DELETE',
                headers: { 'x-store-id': currentStore }
            });
            if (res.ok) data.refresh();
        } catch (e) { console.error(e); }
    };

    const handleRefineFinish = async (refineData) => {
        try {
            const res = await fetch(`/api/gerencia/goldsmith/movements/${refineData.movementId}/refine`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-store-id': currentStore },
                body: JSON.stringify(refineData)
            });
            if (res.ok) {
                data.refresh();
                closeModal();
            }
        } catch (e) { console.error(e); }
    };

    const handleSaveOrder = async (orderData) => {
        try {
            const res = await fetch('/api/gerencia/goldsmith/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-store-id': currentStore },
                body: JSON.stringify(orderData)
            });
            if (res.ok) {
                data.refresh();
                closeModal();
            }
        } catch (e) { console.error(e); }
    };

    const handleCloseOrder = async (closureData) => {
        try {
            const res = await fetch(`/api/gerencia/goldsmith/orders/${closureData.orderId}/receive`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-store-id': currentStore },
                body: JSON.stringify(closureData)
            });
            if (res.ok) {
                data.refresh();
                closeModal();
            }
        } catch (e) { console.error(e); }
    };

    const handleAdjustInventory = async (adjustData) => {
        try {
            const res = await fetch('/api/gerencia/goldsmith/inventory/adjust', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-store-id': currentStore },
                body: JSON.stringify(adjustData)
            });
            if (res.ok) {
                data.refresh();
                closeModal();
            }
        } catch (e) { console.error(e); }
    };

    // --- CASH ACTIONS ---
    const handleSaveCash = async (cashData) => {
        try {
            const res = await fetch('/api/gerencia/cash-control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-store-id': currentStore },
                body: JSON.stringify(cashData)
            });
            if (res.ok) {
                data.refresh();
                alert(cashData.is_closed ? 'Cierre de caja completado con éxito.' : 'Borrador de caja guardado.');
            }
        } catch (e) { console.error(e); }
    };

    // --- OTHER ACTIONS ---
    const handleGiveXP = async (xpData) => {
        try {
            const res = await fetch('/api/employees/reward-xp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-store-id': currentStore },
                body: JSON.stringify(xpData)
            });
            if (res.ok) {
                data.refresh();
                closeModal();
            }
        } catch (e) { console.error(e); }
    };

    const handleManageCriteria = async (criteriaData) => {
        try {
            const method = criteriaData.id ? 'PUT' : 'POST';
            const url = criteriaData.id ? `/api/gerencia/meetings/criteria/${criteriaData.id}` : '/api/gerencia/meetings/criteria';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'x-store-id': currentStore },
                body: JSON.stringify(criteriaData)
            });
            if (res.ok) meetings.refresh();
        } catch (e) { console.error(e); }
    };

    const handleDeleteCriterion = async (id) => {
        if (!window.confirm('¿Eliminar criterio?')) return;
        try {
            const res = await fetch(`/api/gerencia/meetings/criteria/${id}`, { 
                method: 'DELETE',
                headers: { 'x-store-id': currentStore }
            });
            if (res.ok) meetings.refresh();
        } catch (e) { console.error(e); }
    };

    const handleScheduleMeeting = async (scheduleData) => {
        try {
            const res = await fetch('/api/gerencia/meetings/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-store-id': currentStore },
                body: JSON.stringify(scheduleData)
            });
            if (res.ok) {
                meetings.refresh();
                closeModal();
            }
        } catch (e) { console.error(e); }
    };

    const handleDeleteMeetingSchedule = async (id) => {
        if (!window.confirm('¿Cancelar cita?')) return;
        try {
            const res = await fetch(`/api/gerencia/meetings/schedules/${id}`, { 
                method: 'DELETE',
                headers: { 'x-store-id': currentStore }
            });
            if (res.ok) meetings.refresh();
        } catch (e) { console.error(e); }
    };

    const cumulativeCashDiff = useMemo(() => {
        if (!Array.isArray(data.cashHistory)) return 0;
        return data.cashHistory.reduce((acc, h) => acc + (Number(h.total || 0) - Number(h.expected_total || 0)), 0);
    }, [data.cashHistory]);

    return (
        <div className="min-h-screen bg-[#F8F9FB] flex flex-col font-sans selection:bg-[#FF8C9D]/20">
            <main className="flex-1 px-4 md:px-10 max-w-[1920px] mx-auto w-full pt-10">
                {activeTab === 'dashboard' && (
                    <GerenciaDashboard 
                        tasks={data.tasks} batteries={data.batteries}
                        employees={data.employees} inventory={data.inventory}
                        orders={data.orders} partners={data.partners}
                        movements={data.movements} cashHistory={data.cashHistory}
                        auditAlerts={data.auditAlerts} cumulativeCashDiff={cumulativeCashDiff}
                        meetingSchedules={meetings.schedules} activeZoneId={activeZoneId}
                        onRefresh={data.refresh} onXPBonus={(emp) => openModal('xp_bonus', emp)}
                        onTabSwitch={setActiveTab}
                    />
                )}

                {activeTab === 'tasks' && (
                    <TasksView 
                        tasks={data.tasks} batteries={data.batteries}
                        zones={data.zones} activeZoneId={activeZoneId}
                        onAdd={() => openModal('task_form')}
                        onEdit={(t) => openModal('task_form', t)}
                        onAddBattery={() => openModal('battery_form')}
                        onEditBattery={(b) => openModal('battery_form', b)}
                        onAddBatteryItem={(b) => openModal('battery_item_form', b)}
                        onCheckBattery={(item) => openModal('battery_check_form', item)}
                        onDeleteBattery={handleDeleteBattery}
                        onDeleteBatteryItem={handleDeleteBatteryItem}
                        onMoveBattery={handleMoveBattery}
                        onManageZones={() => openModal('zone_manager')}
                        onCheckTask={(t) => agenda.toggleTaskStatus(t.id, t.status)}
                        onDeleteTask={handleDeleteTask}
                    />
                )}

                {activeTab === 'tracking' && (
                    <TrackingView currentStore={currentStore} employees={data.employees} />
                )}

                {activeTab === 'jewelry' && (
                    <JewelryView 
                        inventory={data.inventory} partners={data.partners}
                        movements={data.movements} orders={data.orders}
                        onRefresh={data.refresh}
                        onAddMovement={(type) => openModal('movement_form', { type })}
                        onRefine={(m) => openModal('refine_form', m)}
                        onDeleteMovement={handleDeleteMovement}
                        onAddOrder={() => openModal('order_form')}
                        onReceiveOrder={(o) => openModal('order_closure', o)}
                        onAddPartner={() => openModal('partner_form')}
                        onEditPartner={(p) => openModal('partner_form', p)}
                        onDeletePartner={handleDeletePartner}
                        onAdjustInventory={(item) => openModal('inventory_adjust', item)}
                    />
                )}

                {activeTab === 'team' && (
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
                        <div className="xl:col-span-3">
                             <h2 className="text-3xl font-black text-[#1A365D] tracking-tighter uppercase mb-2">Nuestro Equipo</h2>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 italic">Seguimiento de rendimiento y gestión de talento operativo</p>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {data.employees.map(emp => (
                                    <div key={emp.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center font-black text-xl group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                                                    {emp.nombre?.charAt(0) || 'E'}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-black text-[#1A365D] uppercase leading-tight">{emp.nombre || emp.username}</h3>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{emp.role}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => openModal('xp_bonus', emp)} className="bg-amber-50 text-amber-500 p-2.5 rounded-xl hover:bg-amber-500 hover:text-white transition-all">
                                                <span className="text-[10px] font-black">★</span>
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase">
                                                <span>Experiencia</span>
                                                <span className="text-indigo-500">{emp.xp || 0} XP</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${Math.min(100, (emp.xp || 0) / 10)}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                        <aside className="space-y-6">
                            <div className="bg-[#1A365D] text-white p-8 rounded-[40px] shadow-2xl">
                                <h3 className="text-sm font-black uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Ajustes Rápidos</h3>
                                <button onClick={() => openModal('zone_manager')} className="w-full py-4 bg-white/10 rounded-2xl font-black text-[10px] uppercase hover:bg-white/20 transition-all mb-4">Gestionar Zonas</button>
                                <button className="w-full py-4 bg-white/10 rounded-2xl font-black text-[10px] uppercase hover:bg-white/20 transition-all" onClick={() => setActiveTab('reports')}>Ver Historial XP</button>
                            </div>
                        </aside>
                    </div>
                )}

                {activeTab === 'meetings' && (
                    <MeetingsView 
                        storeId={currentStore} employees={data.employees} user={user}
                        schedules={meetings.schedules} onSchedule={() => openModal('meeting_schedule')}
                        onManageCriteria={() => openModal('criterion_manager')}
                        onDeleteSchedule={handleDeleteMeetingSchedule} meetings={meetings}
                    />
                )}

                {activeTab === 'cash' && (
                    <CashView 
                        history={data.cashHistory || []} storeId={currentStore}
                        onSave={handleSaveCash} employees={data.employees}
                        user={user} cumulativeCashDiff={cumulativeCashDiff}
                    />
                )}

                {activeTab === 'reports' && (
                    <ReportsView 
                        tasks={data.tasks} cashHistory={data.cashHistory}
                        movements={data.movements} partners={data.partners}
                        batteries={data.batteries} activeZoneId={activeZoneId}
                    />
                )}
            </main>

            <AnimatePresence>
                {modal.type === 'task_form' && (
                    <GenericModal isOpen={true} onClose={closeModal} title={modal.data ? "Editar Tarea" : "Nueva Tarea"}>
                        <TaskForm initialData={modal.data} zones={data.zones} employees={data.employees} onSave={handleSaveTask} onCancel={closeModal} onDelete={handleDeleteTask} />
                    </GenericModal>
                )}
                {modal.type === 'battery_form' && (
                    <GenericModal isOpen={true} onClose={closeModal} title={modal.data ? "Editar Plan" : "Nuevo Plan"}>
                        <BatteryForm initialData={modal.data} zones={data.zones} onSave={handleSaveBattery} onCancel={closeModal} />
                    </GenericModal>
                )}
                {modal.type === 'battery_item_form' && (
                    <GenericModal isOpen={true} onClose={closeModal} title="Añadir Tarea Extra">
                        <BatteryItemForm batteryId={modal.data.id} onSave={handleAddBatteryItem} onCancel={closeModal} />
                    </GenericModal>
                )}
                {modal.type === 'battery_check_form' && (
                    <GenericModal isOpen={true} onClose={closeModal} title="Confirmar Tarea">
                        <BatteryCheckForm item={modal.data} onConfirm={handleCheckBatteryItem} onCancel={closeModal} />
                    </GenericModal>
                )}
                {modal.type === 'zone_manager' && (
                    <GenericModal isOpen={true} onClose={closeModal} title="Gestionar Espacios Operativos">
                        <ZoneManagerForm zones={data.zones} employees={data.employees} onSave={handleSaveZone} onDelete={handleDeleteZone} />
                    </GenericModal>
                )}
                {modal.type === 'xp_bonus' && (
                    <GenericModal isOpen={true} onClose={closeModal} title={`Bono XP para ${modal.data.nombre}`}>
                        <XPBonusForm employee={modal.data} onSave={handleGiveXP} onCancel={closeModal} />
                    </GenericModal>
                )}
                {modal.type === 'criterion_manager' && (
                    <GenericModal isOpen={true} onClose={closeModal} title="Criterios Evaluación">
                        <CriterionManager criteria={meetings.criteria} onSave={handleManageCriteria} onDelete={handleDeleteCriterion} />
                    </GenericModal>
                )}
                {modal.type === 'meeting_schedule' && (
                    <GenericModal isOpen={true} onClose={closeModal} title="Programar Reunión">
                        <ScheduleForm employees={data.employees} onSave={handleScheduleMeeting} onCancel={closeModal} />
                    </GenericModal>
                )}

                {/* JEWELRY MODALS */}
                {modal.type === 'partner_form' && (
                    <GenericModal isOpen={true} onClose={closeModal} title={modal.data ? "Editar Socio" : "Nuevo Socio"}>
                        <PartnerForm initialData={modal.data} onSave={handleSavePartner} onCancel={closeModal} />
                    </GenericModal>
                )}
                {modal.type === 'movement_form' && (
                    <GenericModal isOpen={true} onClose={closeModal} title={`Nuevo Movimiento: ${modal.data.type}`}>
                        <MovementForm type={modal.data.type} partners={data.partners} categories={GOLDSMITH_CATEGORIES} onSave={handleSaveMovement} onCancel={closeModal} />
                    </GenericModal>
                )}
                {modal.type === 'order_form' && (
                    <GenericModal isOpen={true} onClose={closeModal} title="Lanzar Nuevo Pedido">
                        <OrderForm partners={data.partners} categories={GOLDSMITH_CATEGORIES} onSave={handleSaveOrder} onCancel={closeModal} />
                    </GenericModal>
                )}
                {modal.type === 'order_closure' && (
                    <GenericModal isOpen={true} onClose={closeModal} title="Recepción de Pedido">
                        <OrderClosureModal order={modal.data} onConfirm={handleCloseOrder} onCancel={closeModal} />
                    </GenericModal>
                )}
                {modal.type === 'refine_form' && (
                    <GenericModal isOpen={true} onClose={closeModal} title="Cierre de Fundición / Refinado">
                        <RefineForm movement={modal.data} onSave={handleRefineFinish} onCancel={closeModal} />
                    </GenericModal>
                )}
                {modal.type === 'inventory_adjust' && (
                    <GenericModal isOpen={true} onClose={closeModal} title="Ajuste de Stock">
                        <InventoryAdjustmentModal item={modal.data} onSave={handleAdjustInventory} onCancel={closeModal} />
                    </GenericModal>
                )}
            </AnimatePresence>

            {data.isRefreshing && (
                <div className="fixed bottom-10 right-10 bg-white/80 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl border border-white flex items-center gap-3 animate-bounce z-50">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                    <span className="text-[10px] font-black text-[#1A365D] uppercase tracking-widest">Sincronizando...</span>
                </div>
            )}
        </div>
    );
};

export default Gerencia;
