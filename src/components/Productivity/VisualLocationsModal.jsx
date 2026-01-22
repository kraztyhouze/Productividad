import React, { useState, useEffect } from 'react';
import { X, Box, Check, LayoutGrid, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CONFIG = {
    libre: { color: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400', label: 'LIBRE', dot: 'bg-emerald-500' },
    parcial: { color: 'bg-orange-500/20 border-orange-500/50 text-orange-400', label: 'PARCIAL', dot: 'bg-orange-500' },
    lleno: { color: 'bg-red-500/20 border-red-500/50 text-red-400', label: 'LLENO', dot: 'bg-red-500' }
};

const VisualLocationsModal = ({ isOpen, onClose }) => {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null); // The ID of the card currently showing the change menu

    // Creation State
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [creationData, setCreationData] = useState({ prefix: '', count: 1, zone: 'Almacén' });

    useEffect(() => {
        if (isOpen) fetchLocations();
    }, [isOpen]);

    const fetchLocations = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/locations');
            if (res.ok) {
                const data = await res.json();
                setLocations(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        // Optimistic UI
        setLocations(prev => prev.map(loc => loc.id === id ? { ...loc, status: newStatus } : loc));
        setEditingId(null);

        try {
            await fetch(`/api/locations/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
        } catch (err) {
            console.error("Failed to update location", err);
            // Revert on error could be implemented here
            fetchLocations();
        }
    };

    const handleCreateWrapper = async (e) => {
        e.preventDefault();
        if (!creationData.prefix) return;

        try {
            const res = await fetch('/api/locations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(creationData)
            });
            if (res.ok) {
                // Refresh
                fetchLocations();
                setShowCreateForm(false);
                setCreationData({ prefix: '', count: 1, zone: 'Almacén' });
            }
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Seguro que quieres eliminar esta ubicación?')) return;

        // Optimistic UI
        setLocations(prev => prev.filter(loc => loc.id !== id));

        try {
            await fetch(`/api/locations/${id}`, { method: 'DELETE' });
        } catch (err) { console.error(err); fetchLocations(); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-6xl h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div>
                        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Box className="text-pink-500" size={32} />
                            Gestión Visual de Ubicaciones
                        </h2>
                        <p className="text-slate-400 text-sm mt-1 ml-1">Control de ocupación en tiempo real</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            className="flex items-center gap-2 p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-bold text-sm"
                        >
                            <Plus size={18} />
                            {showCreateForm ? 'Cancelar' : 'Añadir'}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Creation Form */}
                <AnimatePresence>
                    {showCreateForm && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-slate-800 border-b border-white/5 overflow-hidden"
                        >
                            <form onSubmit={handleCreateWrapper} className="p-6 flex flex-wrap gap-4 items-end">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre / Prefijo</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Estantería A"
                                        value={creationData.prefix}
                                        onChange={e => setCreationData({ ...creationData, prefix: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                                        autoFocus
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Cantidad</label>
                                    <input
                                        type="number"
                                        min="1" max="50"
                                        value={creationData.count}
                                        onChange={e => setCreationData({ ...creationData, count: parseInt(e.target.value) || 1 })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none text-center"
                                    />
                                </div>
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Zona</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Almacén Principal"
                                        value={creationData.zone}
                                        onChange={e => setCreationData({ ...creationData, zone: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold p-3 rounded-xl transition-colors min-w-[120px]">
                                    {creationData.count > 1 ? `Crear ${creationData.count}` : 'Crear Ubicación'}
                                </button>
                            </form>
                            <div className="px-6 pb-4 text-xs text-slate-500">
                                ℹ️ Si cantidad es mayor a 1, se añadirán números automáticos (Ej: "A" + 5 = A1, A2, A3, A4, A5).
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-950/30">
                    {loading ? (
                        <div className="flex h-full items-center justify-center text-slate-500">
                            Cargando mapa de almacén...
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {locations.map((loc) => {
                                const style = STATUS_CONFIG[loc.status] || STATUS_CONFIG.libre;
                                const isEditing = editingId === loc.id;

                                return (
                                    <motion.div
                                        layout
                                        key={loc.id}
                                        className={`relative h-40 rounded-2xl border-2 p-4 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] shadow-lg ${style.color} ${style.color.includes('bg-') ? '' : 'bg-slate-800'}`} // Fallback bg if not in config
                                        onClick={() => setEditingId(isEditing ? null : loc.id)}
                                    >
                                        {/* Header of Card */}
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-bold opacity-60 uppercase tracking-widest">{loc.zone || 'GEN'}</span>
                                            <div className={`w-3 h-3 rounded-full ${style.dot} shadow-[0_0_10px_currentColor]`}></div>
                                        </div>

                                        {/* Name */}
                                        <h3 className="text-xl font-black text-white leading-tight break-words">
                                            {loc.name}
                                        </h3>

                                        {/* Status Label (if not editing) */}
                                        {!isEditing && (
                                            <div className="flex items-center gap-2 mt-auto">
                                                <span className="text-xs font-bold text-white bg-black/20 px-2 py-1 rounded-lg border border-white/5">
                                                    {style.label}
                                                </span>
                                            </div>
                                        )}

                                        {/* Editing Overlay/Menu */}
                                        <AnimatePresence>
                                            {isEditing && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    className="absolute inset-0 bg-slate-900/95 backdrop-blur flex flex-col justify-center gap-2 p-2 z-10"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest font-bold mb-1">Cambiar Estado</p>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {Object.entries(STATUS_CONFIG).map(([key, conf]) => (
                                                            <button
                                                                key={key}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    updateStatus(loc.id, key);
                                                                }}
                                                                className={`px-3 py-2 rounded-lg text-xs font-bold uppercase flex items-center justify-between border transition-colors ${loc.status === key
                                                                    ? `${conf.color} bg-opacity-20`
                                                                    : 'bg-slate-800 text-slate-400 border-white/5 hover:bg-slate-700'
                                                                    }`}
                                                            >
                                                                {conf.label}
                                                                {loc.status === key && <Check size={14} />}
                                                            </button>
                                                        ))}

                                                        {/* Delete Button */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(loc.id);
                                                            }}
                                                            className="px-3 py-2 mt-2 rounded-lg text-xs font-bold uppercase flex items-center justify-between border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                                                        >
                                                            ELIMINAR
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default VisualLocationsModal;
