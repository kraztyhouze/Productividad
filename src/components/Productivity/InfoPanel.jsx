import React from 'react';
import { Plus, X } from 'lucide-react';

const InfoPanel = ({
    title,
    items,
    inputValue,
    setInputValue,
    onAdd,
    onRemove,
    isManagerial,
    theme = 'emerald',
    placeholder = "Añadir..."
}) => {
    // Definir estilos basados en el tema
    const styles = theme === 'red' ? {
        bg: 'bg-[#1e293b]/60 shadow-[0_0_20px_-5px_rgba(239,68,68,0.1)]', // Red Tint Shadow
        border: 'border-white/5',
        corner: 'bg-red-500/10',
        title: 'text-red-400',
        dot: 'bg-red-500',
        inputBorder: 'border-white/10',
        focusBorder: 'focus:border-red-500',
        btnBg: 'bg-red-500/10',
        btnHover: 'hover:bg-red-500/20',
        btnText: 'text-red-300',
        itemBg: 'bg-slate-900/40',
        itemBorder: 'border-white/5',
        iconHover: 'hover:text-red-400'
    } : {
        bg: 'bg-[#1e293b]/60 shadow-[0_0_20px_-5px_rgba(16,185,129,0.1)]', // Emerald Tint Shadow
        border: 'border-white/5',
        corner: 'bg-emerald-500/10',
        title: 'text-emerald-400',
        dot: 'bg-emerald-500',
        inputBorder: 'border-white/10',
        focusBorder: 'focus:border-emerald-500',
        btnBg: 'bg-emerald-500/10',
        btnHover: 'hover:bg-emerald-500/20',
        btnText: 'text-emerald-300',
        itemBg: 'bg-slate-900/40',
        itemBorder: 'border-white/5',
        iconHover: 'hover:text-red-400'
    };

    return (
        <div className={`w-1/2 ${styles.bg} border ${styles.border} rounded-3xl p-5 flex flex-col relative overflow-hidden backdrop-blur-sm`}>
            {/* Corner Decoration */}
            <div className={`absolute top-0 right-0 w-20 h-20 ${styles.corner} rounded-full blur-xl pointer-events-none`}></div>

            <h3 className={`${styles.title} font-bold uppercase tracking-widest text-xs mb-3 flex items-center gap-2`}>
                <div className={`w-2 h-2 rounded-full ${styles.dot} animate-pulse`}></div>
                {title}
            </h3>

            {/* Input Area */}
            {isManagerial && (
                <div className="flex gap-2 mb-3">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onAdd()}
                        placeholder={placeholder}
                        className={`flex-1 bg-slate-900/50 border ${styles.inputBorder} rounded-lg px-3 py-1.5 text-sm text-white ${styles.focusBorder} outline-none placeholder-slate-500`}
                    />
                    <button
                        onClick={onAdd}
                        className={`${styles.btnBg} ${styles.btnHover} ${styles.btnText} rounded-lg px-3 py-1.5 transition-colors border ${styles.inputBorder}`}
                    >
                        <Plus size={16} />
                    </button>
                </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                {items.length > 0 ? (
                    items.map(item => (
                        <div key={item.id} className={`group flex items-center justify-between ${styles.itemBg} border ${styles.itemBorder} rounded-lg px-3 py-2`}>
                            <span className="text-slate-200 text-sm font-medium">{item.name}</span>
                            {isManagerial && (
                                <button
                                    onClick={() => onRemove(item.id)}
                                    className={`text-slate-500/50 ${styles.iconHover} opacity-0 group-hover:opacity-100 transition-opacity`}
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-slate-600 text-xs italic text-center mt-4">Sin registros.</p>
                )}
            </div>
        </div>
    );
};

export default InfoPanel;
