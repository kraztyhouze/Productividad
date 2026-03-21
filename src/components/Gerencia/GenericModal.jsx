import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const GenericModal = ({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-3xl' }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        onClick={onClose}
                        className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-md" 
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className={`bg-white w-full ${maxWidth} rounded-[64px] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <header className="p-8 pb-4 flex justify-between items-start border-b border-slate-50">
                            <div>
                                {subtitle && <span className="text-[10px] font-black text-[#FF8C9D] uppercase tracking-[0.3em] mb-1 block">{subtitle}</span>}
                                <h3 className="text-2xl font-black text-[#1A365D] uppercase tracking-tighter">{title}</h3>
                            </div>
                            <button onClick={onClose} className="p-4 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-[#1A365D] rounded-full transition-all">
                                <X size={24} />
                            </button>
                        </header>
                        <div className="p-10 pt-6 overflow-y-auto custom-scrollbar flex-1">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default GenericModal;
