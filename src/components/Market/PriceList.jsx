import React, { useState, useEffect } from 'react';
import { useAuth, ROLES } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Save, X, Plus, Trash2, ShoppingCart, ChevronDown, ChevronRight, Package, Info } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

const PriceList = () => {
    const { user } = useAuth();
    const { currentStore } = useStore();
    const canEdit = [ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.RESPONSIBLE].includes(user?.role);

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [newItem, setNewItem] = useState(null);

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
        const [formData, setFormData] = useState({ ...item });
        const handleChange = (e) => {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        };
        const handleSubmit = () => onSave(formData);

        const cellClass = "p-4 text-sm align-middle";
        const inputClass = "w-full bg-white border-2 border-[#E2E8F0] focus:border-[#48BB78] rounded-xl px-4 py-2.5 text-[#1A365D] text-xs font-black outline-none transition-all shadow-inner";

        return (
            <tr className="bg-[#F0FFF4]/50 border-b border-[#E2E8F0] animate-in fade-in">
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
                        <button onClick={handleSubmit} className="p-2.5 bg-[#48BB78] hover:bg-[#38A169] text-white rounded-xl shadow-md transition-all active:scale-95"><Save size={14} /></button>
                        <button onClick={onCancel} className="p-2.5 bg-[#F56565] hover:bg-[#E53E3E] text-white rounded-xl shadow-md transition-all active:scale-95"><X size={14} /></button>
                    </div>
                </td>
            </tr>
        );
    };

    const StaticRow = ({ item }) => {
        const rowClass = "border-b border-[#F4F7FA] hover:bg-[#F4F7FA]/30 transition-colors group";
        const cellClass = "p-5 text-sm align-middle";

        return (
            <tr className={rowClass}>
                <td className={`${cellClass} text-[#A0AEC0] w-32 uppercase text-[10px] font-black tracking-widest`}>{item.brand}</td>
                <td className={`${cellClass} font-black text-[#1A365D] text-sm tracking-tight`}>{item.model}</td>
                <td className={`${cellClass} font-mono text-[#D69E2E] font-black text-right w-24 text-[13px] italic bg-[#FFFBEB]/30`}>{item.price_a > 0 ? item.price_a + '€' : '-'}</td>
                <td className={`${cellClass} font-mono text-[#2F855A] font-black text-right w-24 text-[13px] bg-[#F0FFF4]/30`}>{item.price_b > 0 ? item.price_b + '€' : '-'}</td>
                <td className={`${cellClass} font-mono text-[#718096] font-black text-right w-24 text-[13px] opacity-60`}>{item.price_c > 0 ? item.price_c + '€' : '-'}</td>
                {canEdit && (
                    <td className={cellClass}>
                        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                            <button onClick={() => startEdit(item)} className="p-2 hover:bg-[#EBF8FF] text-[#4299E1] rounded-xl transition-all"><Edit2 size={16} /></button>
                            <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-[#FFF5F5] text-[#F56565] rounded-xl transition-all"><Trash2 size={16} /></button>
                        </div>
                    </td>
                )}
            </tr>
        );
    };

    return (
        <div className="max-w-6xl mx-auto w-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="bg-white border border-[#E2E8F0] rounded-[56px] p-12 shadow-[0_32px_128px_-16px_rgba(26,54,93,0.1)] relative overflow-hidden min-h-[700px]">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#48BB78]/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#4299E1]/5 rounded-full blur-[120px] -ml-64 -mb-64 pointer-events-none"></div>

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 relative z-10 gap-8">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-[#F0FFF4] rounded-[24px] border border-[#48BB78]/20 shadow-sm">
                            <ShoppingCart className="text-[#48BB78]" size={32} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-[#1A365D] uppercase tracking-tighter leading-none mb-1">
                                Precios de Mercado
                            </h2>
                            <p className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.3em] pl-1">Listado Oficial de Adquisición</p>
                        </div>
                    </div>
                    {canEdit && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setNewItem({ category: 'CONSOLA', brand: '', model: '', price_a: '', price_b: '', price_c: '' })}
                            className="bg-gradient-to-r from-[#48BB78] to-[#68D391] text-white px-8 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-[#48BB78]/20"
                        >
                            <Plus size={20} /> Añadir Precio
                        </motion.button>
                    )}
                </div>

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
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="mb-10 overflow-hidden relative z-20"
                        >
                            <div className="bg-[#F0FFF4]/30 border-2 border-[#48BB78]/30 rounded-[40px] p-8 shadow-inner">
                                <h3 className="text-[#2F855A] font-black text-[10px] mb-6 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className="w-2 h-2 bg-[#48BB78] rounded-full animate-ping"></div>
                                    Nuevo Registro de Inventario
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[9px] font-black uppercase text-[#A0AEC0] tracking-widest border-b border-[#48BB78]/10">
                                                <th className="p-4">Categoría</th>
                                                <th className="p-4">Marca</th>
                                                <th className="p-4">Modelo</th>
                                                <th className="p-4 text-amber-600">PVP A</th>
                                                <th className="p-4 text-[#2F855A]">PVP B</th>
                                                <th className="p-4 text-[#718096]">PVP C</th>
                                                <th className="p-4">Gestión</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <EditableRow item={newItem} onSave={handleSave} onCancel={cancelEdit} isNew={true} />
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Collapsible Categories */}
                <div className="flex flex-col gap-6 relative z-10">
                    {Object.keys(groupedItems).length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-32 h-32 bg-[#F4F7FA] rounded-[48px] border-4 border-dashed border-[#E2E8F0] flex items-center justify-center mb-8 shadow-inner">
                                <Package size={64} className="text-[#A0AEC0] opacity-20" />
                            </div>
                            <p className="text-[12px] font-black text-[#A0AEC0] uppercase tracking-[0.4em]">No hay datos registrados</p>
                            {canEdit && (
                                <button onClick={populateData} className="mt-8 px-8 py-3 bg-white text-[#1A365D] hover:bg-[#F4F7FA] rounded-[20px] text-[10px] font-black uppercase tracking-widest border border-[#E2E8F0] shadow-sm transition-all">
                                    Importar Listado Base
                                </button>
                            )}
                        </div>
                    )}

                    {Object.entries(groupedItems).sort((a, b) => a[0].localeCompare(b[0])).map(([category, catItems]) => {
                        const isExpanded = expandedCategories[category];

                        return (
                            <div key={category} className={`border-2 transition-all rounded-[40px] overflow-hidden ${isExpanded ? 'bg-white border-[#E2E8F0] shadow-xl scale-[1.01]' : 'bg-[#F4F7FA]/50 border-transparent hover:border-[#E2E8F0]'}`}>
                                <button
                                    onClick={() => toggleCategory(category)}
                                    className={`w-full flex items-center justify-between p-8 transition-all ${isExpanded ? 'bg-[#F4F7FA]/30' : 'hover:bg-white'}`}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`p-4 rounded-[24px] shadow-sm transition-all ${isExpanded ? 'bg-[#1A365D] text-white rotate-180' : 'bg-white text-[#A0AEC0]'}`}>
                                            <ChevronDown size={24} />
                                        </div>
                                        <div className="text-left">
                                            <span className="font-black text-xl tracking-tighter text-[#1A365D] uppercase">{category}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#48BB78]"></div>
                                                <span className="text-[9px] text-[#A0AEC0] font-black uppercase tracking-widest">{catItems.length} Registros activos</span>
                                            </div>
                                        </div>
                                    </div>
                                    {!isExpanded && (
                                        <div className="flex -space-x-2">
                                            {[...new Set(catItems.map(i => i.brand))].slice(0, 3).map((brand, bIdx) => (
                                                <div key={bIdx} className="w-8 h-8 rounded-full bg-[#1A365D] border-2 border-white flex items-center justify-center text-[8px] font-black text-white uppercase overflow-hidden shadow-sm">
                                                    {brand.substring(0, 2)}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </button>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.4, ease: "easeOut" }}
                                        >
                                            <div className="overflow-x-auto p-4 pt-0">
                                                <div className="bg-white rounded-[32px] overflow-hidden">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead>
                                                            <tr className="bg-[#F4F7FA]/50 text-[9px] font-black uppercase text-[#A0AEC0] tracking-[0.2em]">
                                                                <th className="p-5">Fabricante</th>
                                                                <th className="p-5">Versión/Modelo</th>
                                                                <th className="p-5 text-right">PVP A (Exc)</th>
                                                                <th className="p-5 text-right">PVP B (Std)</th>
                                                                <th className="p-5 text-right text-[#A0AEC0]/40">PVP C (Inc)</th>
                                                                {canEdit && <th className="p-5 text-right">Acciones</th>}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-[#F4F7FA]">
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
                                                <div className="mt-6 flex items-start gap-4 p-6 bg-[#EBF8FF] rounded-[32px] border border-[#BEE3F8] mb-4 mx-4">
                                                    <div className="p-2.5 bg-[#4299E1] text-white rounded-xl shadow-md">
                                                        <Info size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-black text-[#2B6CB0] leading-none uppercase tracking-tight mb-1">Nota de Calidad</p>
                                                        <p className="text-[10px] font-bold text-[#4299E1] leading-tight opacity-80">
                                                            Los precios 'A' requieren caja original y todos los accesorios. Los precios 'C' pueden presentar mermas estéticas leves.
                                                        </p>
                                                    </div>
                                                </div>
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
