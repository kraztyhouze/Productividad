import React, { useState, useEffect } from 'react';
import { useAuth, ROLES } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Save, X, Plus, Trash2, ShoppingCart, ChevronDown, ChevronRight } from 'lucide-react';
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



    const [expandedCategories, setExpandedCategories] = useState({});

    // Group items by category
    const groupedItems = items.reduce((acc, item) => {
        const cat = item.category || 'OTROS';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {});

    const toggleCategory = (cat) => {
        setExpandedCategories(prev => ({
            ...prev,
            [cat]: !prev[cat]
        }));
    };

    const EditableRow = ({ item, onSave, onCancel, isNew }) => {
        // Local state for the form row
        const [formData, setFormData] = useState({ ...item });

        const handleChange = (e) => {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        };

        const handleSubmit = () => onSave(formData);

        // Common styles
        const cellClass = "p-3 text-sm align-middle";
        const inputClass = "w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs outline-none focus:border-amber-500 transition-colors";

        return (
            <tr className="bg-slate-800/50 border-b border-white/5 animate-in fade-in">
                {!isNew && <td className={cellClass}></td>}
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
        const rowClass = "border-b border-white/5 hover:bg-white/5 transition-colors group";
        const cellClass = "p-3 text-sm align-middle";

        return (
            <tr className={rowClass}>
                <td className={`${cellClass} text-slate-400 w-32 uppercase text-[10px]`}>{item.brand}</td>
                <td className={`${cellClass} font-bold text-white text-xs`}>{item.model}</td>
                <td className={`${cellClass} font-mono text-amber-400 font-bold text-right w-24`}>{item.price_a > 0 ? item.price_a + '€' : '-'}</td>
                <td className={`${cellClass} font-mono text-emerald-400 text-right w-24`}>{item.price_b > 0 ? item.price_b + '€' : '-'}</td>
                <td className={`${cellClass} font-mono text-slate-400 text-right w-24`}>{item.price_c > 0 ? item.price_c + '€' : '-'}</td>
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

    return (
        <div className="max-w-6xl mx-auto w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-[#1e293b] rounded-2xl p-6 border border-white/5 shadow-2xl relative overflow-hidden min-h-[600px]">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 relative z-10 gap-4">
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

                {/* New Item Form Area */}
                <AnimatePresence>
                    {newItem && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-8 overflow-hidden"
                        >
                            <div className="bg-slate-900/50 border border-emerald-500/30 rounded-xl p-4">
                                <h3 className="text-emerald-400 font-bold text-sm mb-4 uppercase tracking-wider">Nuevo Registro</h3>
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-xs uppercase text-slate-500 border-b border-white/5">
                                            <th className="p-2">Cat</th>
                                            <th className="p-2">Marca</th>
                                            <th className="p-2">Modelo</th>
                                            <th className="p-2">A</th>
                                            <th className="p-2">B</th>
                                            <th className="p-2">C</th>
                                            <th className="p-2">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <EditableRow item={newItem} onSave={handleSave} onCancel={cancelEdit} isNew={true} />
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Collapsible Categories */}
                <div className="flex flex-col gap-4 relative z-10">
                    {Object.keys(groupedItems).length === 0 && !loading && (
                        <div className="text-center p-12 text-slate-500">
                            <p>No hay precios definidos.</p>
                            {canEdit && (
                                <button onClick={populateData} className="mt-4 px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg text-xs font-bold border border-white/5 transition-colors">
                                    Cargar Datos Iniciales (Ejemplo)
                                </button>
                            )}
                        </div>
                    )}

                    {Object.entries(groupedItems).sort((a, b) => a[0].localeCompare(b[0])).map(([category, catItems]) => {
                        const isExpanded = expandedCategories[category];

                        return (
                            <div key={category} className="bg-slate-900/40 border border-white/5 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => toggleCategory(category)}
                                    className={`w-full flex items-center justify-between p-4 transition-all ${isExpanded ? 'bg-slate-800/80 text-emerald-400' : 'bg-slate-900/20 text-slate-300 hover:bg-slate-800/50 hover:text-white'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${isExpanded ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                        </div>
                                        <div className="text-left">
                                            <span className="font-bold text-lg tracking-wide uppercase">{category}</span>
                                            <span className="text-xs text-slate-500 font-medium ml-3 bg-slate-950 px-2 py-0.5 rounded-full border border-white/5">{catItems.length} Modelos</span>
                                        </div>
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="overflow-x-auto border-t border-white/5">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-slate-950/50 text-[10px] uppercase tracking-wider text-slate-500">
                                                            <th className="p-3 font-bold">Marca</th>
                                                            <th className="p-3 font-bold">Modelo</th>
                                                            <th className="p-3 font-bold text-right text-amber-500">A (Impecable)</th>
                                                            <th className="p-3 font-bold text-right text-emerald-500">B (Bueno)</th>
                                                            <th className="p-3 font-bold text-right text-slate-400">C (Usado)</th>
                                                            {canEdit && <th className="p-3 text-right">Acciones</th>}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5">
                                                        {catItems.map((item) => (
                                                            <React.Fragment key={item.id}>
                                                                {editingId === item.id ? (
                                                                    <EditableRow item={item} onSave={handleSave} onCancel={cancelEdit} />
                                                                ) : (
                                                                    <StaticRow item={item} />
                                                                )}
                                                            </React.Fragment>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PriceList;
