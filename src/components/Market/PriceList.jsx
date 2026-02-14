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

    // Render Row Helper
    const RenderRow = ({ item, isEditing, isNew }) => {
        const [formData, setFormData] = useState({ ...item });

        const handleChange = (e) => {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        };

        const onSave = () => handleSave(formData);

        const rowClass = "border-b border-white/5 hover:bg-white/5 transition-colors";
        const cellClass = "p-3 text-sm";
        const inputClass = "w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs outline-none focus:border-amber-500";

        if (isEditing || isNew) {
            return (
                <tr className={`${rowClass} bg-slate-800/50`}>
                    <td className={cellClass}>
                        <input name="category" value={formData.category} onChange={handleChange} className={inputClass} placeholder="CAT" list="categories" />
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
                            <button onClick={onSave} className="p-1.5 bg-green-600 text-white rounded"><Save size={14} /></button>
                            <button onClick={cancelEdit} className="p-1.5 bg-red-600 text-white rounded"><X size={14} /></button>
                        </div>
                    </td>
                </tr>
            );
        }

        return (
            <tr className={rowClass}>
                <td className={`${cellClass} font-bold text-slate-400 uppercase text-xs w-24`}>{item.category}</td>
                <td className={`${cellClass} text-slate-300 w-32`}>{item.brand}</td>
                <td className={`${cellClass} font-bold text-white`}>{item.model}</td>
                <td className={`${cellClass} font-mono text-amber-400 font-bold text-right w-24`}>{item.price_a}€</td>
                <td className={`${cellClass} font-mono text-slate-300 text-right w-24`}>{item.price_b}€</td>
                <td className={`${cellClass} font-mono text-slate-500 text-right w-24`}>{item.price_c}€</td>
                {canEdit && (
                    <td className={cellClass}>
                        <div className="flex gap-2 justify-end">
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
                                <RenderRow item={newItem} isNew={true} />
                            )}
                            {items.map((item, idx) => {
                                // Add separator logic if needed, but categories are sorted.
                                // Let's add a visual separator row if category changes?
                                const prev = items[idx - 1];
                                const showHeader = !prev || prev.category !== item.category;

                                return (
                                    <React.Fragment key={item.id}>
                                        {showHeader && idx > 0 && <tr className="h-4 bg-transparent border-none"><td colSpan="7"></td></tr>}
                                        {showHeader && (
                                            <tr className="bg-slate-950/30">
                                                <td colSpan="7" className="px-4 py-2 text-xs font-bold text-slate-500 border-l-4 border-emerald-500 uppercase tracking-widest">
                                                    {item.category}
                                                </td>
                                            </tr>
                                        )}
                                        <RenderRow item={item} isEditing={editingId === item.id} />
                                    </React.Fragment>
                                );
                            })}
                            {items.length === 0 && !loading && !newItem && (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-500">
                                        No hay precios definidos.
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
