import React, { useState } from 'react';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';

const InfoPanel = ({
    title,
    items,
    inputValue,
    setInputValue,
    onAdd,
    onRemove,
    isManagerial,
    theme = 'emerald',
    placeholder = "Añadir...",
    className = ""
}) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const styles = theme === 'red' ? {
        bg: 'bg-white',
        border: 'border-[#E2E8F0]',
        titleColor: '#EF4444',
        dot: 'bg-red-400',
        inputFocus: 'focus:border-red-400',
        btnBg: 'bg-[#FF8C9D]',
        btnText: 'text-white',
        btnBorder: 'border-transparent',
        itemBg: 'bg-[#F4F7FA]', 
        itemBorder: 'border-[#E2E8F0]',
        itemText: 'text-[#1A365D]',
        iconHover: 'hover:text-red-500'
    } : {
        bg: 'bg-white',
        border: 'border-[#E2E8F0]',
        titleColor: '#48BB78',
        dot: 'bg-[#48BB78]',
        inputFocus: 'focus:border-[#48BB78]',
        btnBg: 'bg-[#48BB78]',
        btnText: 'text-white',
        btnBorder: 'border-transparent',
        itemBg: 'bg-[#F4F7FA]', 
        itemBorder: 'border-[#E2E8F0]',
        itemText: 'text-[#1A365D]',
        iconHover: 'hover:text-red-500'
    };

    return (
        <div
            className={`flex flex-col relative overflow-hidden bg-white border border-[#E2E8F0] rounded-[16px] p-5 transition-all duration-300 ${isExpanded ? 'flex-1' : 'flex-none h-fit'} ${className}`}
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
        >
            <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <h3
                    className="font-black uppercase tracking-[0.15em] text-[10px] flex items-center gap-2"
                    style={{ color: styles.titleColor }}
                >
                    <div className={`w-1.5 h-1.5 rounded-full ${styles.dot}`}></div>
                    {title} <span className="text-[#A0AEC0] font-bold text-[8px] ml-1">({items.length})</span>
                </h3>
                <div className="text-[#A0AEC0] hover:text-[#1A365D] transition-colors">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
            </div>

            {isExpanded && (
                <div className="flex flex-col flex-1 min-h-0 animate-in fade-in slide-in-from-top-1">
                    {/* Input Area */}
                    {isManagerial && (
                        <div className="flex gap-2 mb-4 shrink-0">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && onAdd()}
                                placeholder={placeholder}
                                className="flex-1 bg-white border border-[#E2E8F0] rounded-xl px-4 py-2 text-xs text-[#1A365D] font-medium focus:border-[#FF8C9D] focus:ring-4 focus:ring-[#FF8C9D]/5 outline-none placeholder:text-[#A0AEC0] transition-all"
                            />
                            <button
                                onClick={onAdd}
                                className={`${styles.btnBg} ${styles.btnText} rounded-xl px-4 py-2 transition-all shadow-sm hover:translate-y-[-1px] active:scale-95`}
                            >
                                <Plus size={16} strokeWidth={3} />
                            </button>
                        </div>
                    )}

                    {/* List */}
                    <div className="flex-1 overflow-y-auto pr-1 flex flex-wrap gap-2 content-start custom-scrollbar">
                        {items.length > 0 ? (
                            items.map(item => (
                                <div
                                    key={item.id}
                                    className="group flex items-center gap-2 bg-[#F4F7FA] border border-[#E2E8F0]/50 rounded-full px-4 py-1 transition-all hover:bg-white hover:border-[#FF8C9D]/30 shadow-sm"
                                >
                                    <span className="text-[#1A365D] text-[10px] font-bold uppercase tracking-wide">{item.name}</span>
                                    {isManagerial && (
                                        <button
                                            onClick={() => onRemove(item.id)}
                                            className="text-[#A0AEC0] hover:text-red-500 transition-colors"
                                        >
                                            <X size={10} strokeWidth={2.5} />
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="w-full flex flex-col items-center justify-center py-4 opacity-30">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#A0AEC0]">Vacio</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InfoPanel;
