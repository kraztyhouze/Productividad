import React, { useState, useEffect } from 'react';
import { useAuth, ROLES } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Save, X, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

const PriceList = () => {
    const { user } = useAuth();
    const { currentStore } = useStore();
    const canEdit = [ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.RESPONSIBLE].includes(user?.role);

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [newItem, setNewItem] = useState(null); // { category: 'CONSOLA', brand: '', ... }

    // Fetch Items
    const fetchItems = async () => {
        setLoading(true);
        try {
            const storeId = currentStore || 'store_1';
            const res = await fetch('/api/market-prices', {
                headers: { 'x-store-id': storeId }
            });
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (err) {
            console.error("Error fetching prices", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [currentStore]);

    // Group items by category for rendering
    // Categories: 'THERMOMIX', 'PS5', 'PS4', 'SWITCH', etc.
    // We should probably allow the user to type the category or select from existing.
    // For simplicity, let's categorize by the 'category' field in DB.

    const handleSave = async (item) => {
        const storeId = currentStore || 'store_1';
        try {
            const url = item.id ? `/api/market-prices/${item.id}` : '/api/market-prices';
            const method = item.id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-store-id': storeId
                },
                body: JSON.stringify(item)
            });

            if (res.ok) {
                fetchItems();
                setEditingId(null);
                setNewItem(null);
            }
        } catch (err) {
            alert("Error al guardar");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que quieres borrar este precio?")) return;
        try {
            await fetch(`/api/market-prices/${id}`, { method: 'DELETE' });
            fetchItems();
        } catch (err) {
            alert("Error al borrar");
        }
    };

    const startEdit = (item) => {
        setEditingId(item.id);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setNewItem(null);
    };

    // Initial Data from User Image
    const INITIAL_DATA = [
        { category: 'THERMOMIX', brand: 'VORWERK', model: 'TM21', price_a: 0, price_b: 219, price_c: 199 },
        { category: 'THERMOMIX', brand: 'VORWERK', model: 'TM31', price_a: 0, price_b: 399, price_c: 349 },
        { category: 'THERMOMIX', brand: 'VORWERK', model: 'TM5', price_a: 429, price_b: 379, price_c: 349 },
        { category: 'THERMOMIX', brand: 'VORWERK', model: 'TM6', price_a: 749, price_b: 679, price_c: 649 },
        { category: 'THERMOMIX', brand: 'VORWERK', model: 'TM6 BLACK cocodrilo', price_a: 899, price_b: 829, price_c: 749 },
        { category: 'THERMOMIX', brand: 'VORWERK', model: 'TM6 Blanco perlado', price_a: 899, price_b: 829, price_c: 749 },
        { category: 'THERMOMIX', brand: 'VORWERK', model: 'TM6 BLACK', price_a: 749, price_b: 679, price_c: 649 },
        { category: 'THERMOMIX', brand: 'VORWERK', model: 'TM7', price_a: 1349, price_b: 1249, price_c: 1149 },
        { category: 'THERMOMIX', brand: 'VORWERK', model: 'FRIEND', price_a: 179, price_b: 129, price_c: 99 },

        { category: 'PS5', brand: 'sony', model: 'ps5 Pro', price_a: 699, price_b: 629, price_c: 579 },
        { category: 'PS5', brand: 'sony', model: 'ps5 slim', price_a: 429, price_b: 399, price_c: 369 },
        { category: 'PS5', brand: 'sony', model: 'ps5 digital slim', price_a: 329, price_b: 299, price_c: 279 },
        { category: 'PS5', brand: 'sony', model: 'ps5', price_a: 399, price_b: 369, price_c: 339 },
        { category: 'PS5', brand: 'sony', model: 'ps5 digital', price_a: 279, price_b: 259, price_c: 239 },

        { category: 'PS4', brand: 'sony', model: 'PS4 500GB', price_a: 0, price_b: 89, price_c: 79 },
        { category: 'PS4', brand: 'sony', model: 'PS4 1TB', price_a: 0, price_b: 99, price_c: 89 },
        { category: 'PS4', brand: 'sony', model: 'PS4 SLIM 500GB', price_a: 0, price_b: 109, price_c: 99 },
        { category: 'PS4', brand: 'sony', model: 'PS4 SLIM 1TB', price_a: 0, price_b: 129, price_c: 109 },
        { category: 'PS4', brand: 'sony', model: 'PS4 PRO', price_a: 179, price_b: 149, price_c: 129 },

        { category: 'SWITCH', brand: 'Nintendo', model: 'Switch Oled', price_a: 229, price_b: 199, price_c: 179 },
        { category: 'SWITCH', brand: 'Nintendo', model: 'Switch', price_a: 169, price_b: 149, price_c: 129 },
        { category: 'SWITCH', brand: 'Nintendo', model: 'Switch Lite', price_a: 105, price_b: 95, price_c: 85 },
        { category: 'SWITCH', brand: 'Nintendo', model: 'Switch 2', price_a: 429, price_b: 419, price_c: 399 },
    ];

    const populateData = async () => {
        if (!window.confirm("¿Cargar todos los datos iniciales? Se duplicarán si ya existen.")) return;
        const storeId = currentStore || 'store_1';
        setLoading(true);
        for (const item of INITIAL_DATA) {
            await fetch('/api/market-prices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-store-id': storeId },
                body: JSON.stringify(item)
            });
        }
        fetchItems();
    };

    const EditableRow = ({ item, onSave, onCancel, isNew }) => {
        // Local state for the form row to prevent parent re-renders from killing input focus/state
        const [formData, setFormData] = useState({ ...item });

        const handleChange = (e) => {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        };

        const handleSubmit = () => onSave(formData);

        const cellClass = "p-3 text-sm";
        const inputClass = "w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs outline-none focus:border-amber-500 transition-colors";

        return (
            <tr className="bg-slate-800/50 border-b border-white/5 animate-in fade-in">
                <td className={cellClass}>
                    <input name="category" value={formData.category} onChange={handleChange} className={inputClass} placeholder="CAT" list="categories" autoFocus />
                </td>
                <td className={cellClass}>
                    <input name="brand" value={formData.brand} onChange={handleChange} className={inputClass} placeholder="Marca" />
                </td>
                <td className={cellClass}>
                    <input name="model" value={formData.model} onChange={handleChange} className={inputClass} placeholder="Modelo" />
                </td>
                <td className={cellClass}><input name="price_a" type="number" value={formData.price_a} onChange={handleChange} className={inputClass} placeholder="€" /></td>
                <td className={cellClass}><input name="price_b" type="number" value={formData.price_b} onChange={handleChange} className={inputClass} placeholder="€" /></td>
                <td className={cellClass}><input name="price_c" type="number" value={formData.price_c} onChange={handleChange} className={inputClass} placeholder="€" /></td>
                <td className={cellClass}>
                    <div className="flex gap-2">
                        <button onClick={handleSubmit} className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"><Save size={14} /></button>
                        <button onClick={onCancel} className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded transition-colors"><X size={14} /></button>
                    </div>
                </td>
            </tr>
        );
    };

    const StaticRow = ({ item }) => {
        // Only render headers if this is the first item of its category
        // But we handle headers in the parent map loop.
        const rowClass = "border-b border-white/5 hover:bg-white/5 transition-colors group";
        const cellClass = "p-3 text-sm";

        return (
            <tr className={rowClass}>
                <td className={`${cellClass} font-bold text-slate-500 uppercase text-[10px] w-24 group-hover:text-slate-300 transition-colors`}>{item.category}</td>
                <td className={`${cellClass} text-slate-400 w-32 uppercase text-[10px]`}>{item.brand}</td>
                <td className={`${cellClass} font-bold text-white`}>{item.model}</td>
                <td className={`${cellClass} font-mono text-amber-400 font-bold text-right w-24`}>{item.price_a > 0 ? item.price_a + '€' : '-'}</td>
                <td className={`${cellClass} font-mono text-slate-300 text-right w-24`}>{item.price_b > 0 ? item.price_b + '€' : '-'}</td>
                <td className={`${cellClass} font-mono text-slate-500 text-right w-24`}>{item.price_c > 0 ? item.price_c + '€' : '-'}</td>
                {canEdit && (
                    <td className={cellClass}>
                        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(item)} className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-white rounded"><Edit2 size={14} /></button>
                            <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-red-500 rounded"><Trash2 size={14} /></button>
                        </div>
                    </td>
                )}
            </tr>
        );
    };

    // Group items
    // We want to render them in blocks?
    // Actually, a single table sorted by category is fine, or we can add visual headers.
    // Let's do visual headers when category changes.

    return (
        <div className="max-w-6xl mx-auto w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-[#1e293b] rounded-2xl p-8 border border-white/5 shadow-2xl relative overflow-hidden min-h-[600px]">
                {/* Header */}
                <div className="flex justify-between items-center mb-8 relative z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <ShoppingCart className="text-emerald-500" /> PVP Consolas y Thermomix
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">Listado oficial de precios de compra.</p>
                    </div>
                    {canEdit && (
                        <button
                            onClick={() => setNewItem({ category: 'CONSOLA', brand: '', model: '', price_a: '', price_b: '', price_c: '' })}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/40"
                        >
                            <Plus size={16} /> Añadir Precio
                        </button>
                    )}
                </div>

                {/* Datalist for categories */}
                <datalist id="categories">
                    <option value="THERMOMIX" />
                    <option value="PS5" />
                    <option value="PS4" />
                    <option value="SWITCH" />
                    <option value="XBOX" />
                </datalist>

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-white/10 relative z-10">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900 border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">
                                <th className="p-4 font-bold">Categoría</th>
                                <th className="p-4 font-bold">Marca</th>
                                <th className="p-4 font-bold">Modelo</th>
                                <th className="p-4 font-bold text-right text-amber-500">A (Impecable)</th>
                                <th className="p-4 font-bold text-right">B (Bueno)</th>
                                <th className="p-4 font-bold text-right">C (Usado)</th>
                                {canEdit && <th className="p-4 text-right">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {newItem && (
                                <EditableRow item={newItem} onSave={handleSave} onCancel={cancelEdit} isNew={true} />
                            )}
                            {items.map((item, idx) => {
                                const prev = items[idx - 1];
                                const showHeader = !prev || prev.category !== item.category;

                                return (
                                    <React.Fragment key={item.id}>
                                        {showHeader && idx > 0 && <tr className="h-4 bg-transparent border-none"><td colSpan="7"></td></tr>}
                                        {showHeader && (
                                            <tr className="bg-slate-950/30">
                                                <td colSpan="7" className="px-4 py-2 text-xs font-bold text-slate-500 border-l-4 border-emerald-500 uppercase tracking-widest bg-gradient-to-r from-slate-900 to-transparent">
                                                    {item.category}
                                                </td>
                                            </tr>
                                        )}
                                        {editingId === item.id ? (
                                            <EditableRow item={item} onSave={handleSave} onCancel={cancelEdit} />
                                        ) : (
                                            <StaticRow item={item} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                            {items.length === 0 && !loading && !newItem && (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center text-slate-500 flex flex-col items-center gap-4">
                                        <p>No hay precios definidos.</p>
                                        {canEdit && (
                                            <button onClick={populateData} className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg text-xs font-bold border border-white/5 transition-colors">
                                                Cargar Datos Iniciales (Ejemplo)
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PriceList;
