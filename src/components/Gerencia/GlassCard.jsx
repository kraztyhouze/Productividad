import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({ children, title, icon: Icon, className = "", description, action }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
                relative overflow-hidden
                bg-white/40 backdrop-blur-xl
                border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]
                rounded-3xl p-6
                ${className}
            `}
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    {Icon && (
                        <div className="p-3 bg-white/60 rounded-2xl shadow-sm text-pink-500">
                            <Icon size={24} />
                        </div>
                    )}
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h3>
                        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
                    </div>
                </div>
                {action && (
                    <div className="text-pink-500 hover:text-pink-600 transition-colors">
                        {action}
                    </div>
                )}
            </div>
            
            <div className="relative z-10">
                {children}
            </div>
            
            {/* Subtle Gradient Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-pink-100/30 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-100/20 blur-[80px] rounded-full pointer-events-none" />
        </motion.div>
    );
};

export default GlassCard;
