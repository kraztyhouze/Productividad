import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
    LayoutGrid, 
    Calendar, 
    Smartphone, 
    Users,
    Pocket,
    LogOut
} from 'lucide-react';
import { useAuth, ROLES } from '../context/AuthContext';
import { useModule, MODULES } from '../context/ModuleContext';

const MobileNavbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const { activeModule, switchModule, isPathEnabled } = useModule();

    const isGerencia = activeModule === MODULES.GERENCIA;

    const navItems = [
        { 
            to: isGerencia ? '/gerencia' : '/', 
            label: 'Inicio', 
            icon: LayoutGrid,
            active: location.pathname === (isGerencia ? '/gerencia' : '/') && !location.search
        },
        { 
            to: '/gerencia?tab=tasks', 
            label: 'Agenda', 
            icon: Calendar,
            active: location.search.includes('tab=tasks')
        },
        { 
            to: '/mobile/tasks', 
            label: 'Consola', 
            icon: Smartphone,
            active: location.pathname === '/mobile/tasks' 
        },
        { 
            to: '/gerencia?tab=jewelry', 
            label: 'Joyería', 
            icon: Pocket,
            active: location.search.includes('tab=jewelry')
        }
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-slate-100 z-50 h-20 px-4 flex items-center justify-around pb-2">
            {navItems.filter(item => isPathEnabled(item.to)).map((item, i) => {
                const Icon = item.icon;
                const isActive = item.active;

                return (
                    <NavLink
                        key={i}
                        to={item.to}
                        className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative ${isActive ? (isGerencia ? 'text-blue-600' : 'text-rose-500 scale-110') : 'text-slate-400 opacity-60'}`}
                    >
                        <div className={`p-2 rounded-2xl transition-all ${isActive ? (isGerencia ? 'bg-blue-50' : 'bg-rose-50') : ''}`}>
                            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                            {item.label}
                        </span>
                        {isActive && (
                            <div className={`absolute -bottom-1 w-1 h-1 rounded-full ${isGerencia ? 'bg-blue-600' : 'bg-rose-500'}`} />
                        )}
                    </NavLink>
                );
            })}
            
            {/* Logout/Action specialized */}
            <button 
                onClick={() => { if(confirm('¿Cerrar sesión?')) { logout(); navigate('/login'); } }}
                className="flex flex-col items-center gap-1.5 text-slate-300 opacity-40"
            >
                <div className="p-2 rounded-2xl">
                    <LogOut size={20} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest opacity-0">Salir</span>
            </button>
        </nav>
    );
};

export default MobileNavbar;
