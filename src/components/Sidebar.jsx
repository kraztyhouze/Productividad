import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, ROLES } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { useModule, MODULES } from '../context/ModuleContext';
import { 
    Users, 
    ShoppingBag, 
    LogOut, 
    LayoutGrid, 
    FileText, 
    Search, 
    Download, 
    ChevronLeft, 
    ChevronRight, 
    Briefcase,
    Calendar,
    Pocket,
    Calculator,
    BarChart3,
    ArrowLeftRight,
    UserCheck,
    Activity
} from 'lucide-react';

const Sidebar = ({ expanded, setExpanded }) => {
    const { user, logout } = useAuth();
    const { getDisplayName } = useTeam();
    const { activeModule, switchModule } = useModule();
    const navigate = useNavigate();
    const location = useLocation();

    const isGerencia = activeModule === MODULES.GERENCIA;

    const COMPRAS_ITEMS = [
        { section: null, items: [{ to: '/', label: 'Dashboard', icon: LayoutGrid, roles: [ROLES.MANAGER, ROLES.RESPONSIBLE, 'VIEW_ONLY'] }] },
        { section: 'Tienda', items: [
            { to: '/productivity', label: 'Productividad', icon: ShoppingBag, roles: null },
            { to: '/market', label: 'Mercado', icon: Search, roles: null },
            { to: '/reports', label: 'Informes', icon: FileText, roles: [ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.RESPONSIBLE] },
        ]}
    ];

    const GERENCIA_ITEMS = [
        { section: null, items: [{ to: '/gerencia', label: 'Resumen', icon: BarChart3, roles: [ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.RESPONSIBLE] }] },
        { section: 'Control', items: [
            { to: '/gerencia?tab=tasks', label: 'Agenda', icon: Calendar, roles: [ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.RESPONSIBLE] },
            { to: '/team', label: 'Equipo', icon: Users, roles: [ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.RESPONSIBLE] },
            { to: '/gerencia?tab=tracking', label: 'Seguimiento', icon: Activity, roles: [ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.RESPONSIBLE] },
            { to: '/gerencia?tab=jewelry', label: 'Joyería', icon: Pocket, roles: [ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.RESPONSIBLE] },
            { to: '/gerencia?tab=meetings', label: 'Reuniones 1:1', icon: UserCheck, roles: [ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.RESPONSIBLE] },
            { to: '/gerencia?tab=cash', label: 'Conteo', icon: Calculator, roles: [ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.RESPONSIBLE] },
            { to: '/gerencia?tab=reports', label: 'Informes G.', icon: FileText, roles: [ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.RESPONSIBLE] },
        ]}
    ];

    const NAV_ITEMS = isGerencia ? GERENCIA_ITEMS : COMPRAS_ITEMS;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleSwitchModule = () => {
        const nextModule = isGerencia ? MODULES.COMPRAS : MODULES.GERENCIA;
        switchModule(nextModule);
        navigate(nextModule === MODULES.GERENCIA ? '/gerencia' : '/');
    };

    const handleBackup = async () => {
        if (!confirm('¿Descargar copia de seguridad completa de la base de datos?')) return;
        try {
            const res = await fetch('/api/admin/backup');
            if (!res.ok) throw new Error('Error en backup');
            const data = await res.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tiktak_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (e) {
            alert('Error al descargar backup: ' + e.message);
        }
    };

    const canSee = (roles) => {
        if (!roles) return true;
        return roles.includes(user?.role);
    };

    // Helper to check if a NavLink is active considering query params for Gerencia
    const isItemActive = (to) => {
        if (to === '/') return location.pathname === '/' && activeModule === MODULES.COMPRAS;
        if (to === '/gerencia') return location.pathname === '/gerencia' && !location.search;
        if (to.startsWith('/gerencia?tab=')) {
            const tab = to.split('tab=')[1];
            const currentTab = new URLSearchParams(location.search).get('tab');
            return location.pathname === '/gerencia' && currentTab === tab;
        }
        return location.pathname === to;
    };

    const initials = (getDisplayName(user) || user?.name || 'U')
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <aside
            className="fixed top-0 left-0 h-screen z-40 flex flex-col bg-white border-r border-[#E2E8F0] transition-all duration-300 overflow-hidden"
            style={{ width: expanded ? 'var(--sidebar-width)' : 'var(--sidebar-collapsed)' }}
        >
            {/* ── Logo / Header ── */}
            <div className="h-[72px] flex items-center px-4 border-b border-[#E2E8F0] relative shrink-0">
                <div className={`flex items-center gap-3 overflow-hidden ${!expanded ? 'justify-center w-full' : ''}`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-black text-xl italic shadow-sm shrink-0 ${isGerencia ? 'bg-[#1A365D]' : 'bg-[#FF8C9D]'}`}>
                        T
                    </div>
                    <span
                        className={`font-extrabold text-xl tracking-tight text-[#1A365D] whitespace-nowrap transition-all duration-300 ${expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}
                        style={{ fontFamily: '"Inter", sans-serif' }}
                    >
                        TikTak <span className="text-[#CBD5E0] font-normal text-sm">2.1</span>
                    </span>
                </div>

                {expanded && (
                    <button
                        onClick={() => setExpanded(false)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#A0AEC0] hover:text-[#1A365D] hover:bg-[#F4F7FA] transition-all"
                        title="Colapsar"
                        id="sidebar-collapse-btn"
                    >
                        <ChevronLeft size={16} />
                    </button>
                )}
                {!expanded && (
                    <button
                        onClick={() => setExpanded(true)}
                        className="absolute inset-0 z-10 w-full h-full cursor-pointer opacity-0"
                        title="Expandir"
                        id="sidebar-expand-btn"
                    />
                )}
            </div>

            {/* ── Navigation ── */}
            <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
                {/* Module Badge (when expanded) */}
                {expanded && (
                    <div className="px-3 mb-6">
                        <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] inline-block ${isGerencia ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-500'}`}>
                            {isGerencia ? 'Módulo Gerencia' : 'Módulo Compras'}
                        </div>
                    </div>
                )}

                {NAV_ITEMS.map((group, gi) => (
                    <div key={gi}>
                        {group.section && expanded && (
                            <p className="px-3 pt-4 pb-1 text-[10px] font-bold text-[#A0AEC0] uppercase tracking-widest select-none">
                                {group.section}
                            </p>
                        )}
                        {group.section && !expanded && <div className="my-3 mx-3 border-t border-[#E2E8F0]" />}

                        {group.items.filter(item => canSee(item.roles)).map(item => {
                            const active = isItemActive(item.to);
                            return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    id={`nav-${item.label.toLowerCase()}`}
                                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                                        ${!expanded ? 'justify-center' : ''}
                                        ${active
                                            ? (isGerencia ? 'bg-blue-50 text-blue-600' : 'bg-[#fff0f2] text-[#FF8C9D]')
                                            : 'text-[#718096] hover:bg-[#F4F7FA] hover:text-[#1A365D]'
                                        }`
                                    }
                                >
                                    {isActiveParam => (
                                        <>
                                            {active && (
                                                <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full ${isGerencia ? 'bg-blue-600' : 'bg-[#FF8C9D]'}`} />
                                            )}
                                            <item.icon
                                                size={20}
                                                className={`shrink-0 transition-transform ${active ? (isGerencia ? 'text-blue-600' : 'text-[#FF8C9D]') : 'text-[#A0AEC0] group-hover:text-[#1A365D]'}`}
                                            />
                                            {expanded && (
                                                <span className={`text-sm font-semibold whitespace-nowrap ${active ? (isGerencia ? 'text-blue-600' : 'text-[#FF8C9D]') : ''}`}>
                                                    {item.label}
                                                </span>
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            );
                        })}
                    </div>
                ))}

                {/* Switch Module Button — Authorized only */}
                {[ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.RESPONSIBLE].includes(user?.role) && (
                    <div className="pt-4 mt-4 border-t border-slate-50">
                        <button
                            onClick={handleSwitchModule}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${!expanded ? 'justify-center' : ''} ${isGerencia ? 'text-rose-500 hover:bg-rose-50' : 'text-blue-600 hover:bg-blue-50'}`}
                            title={`Cambiar a ${isGerencia ? 'Compras' : 'Gerencia'}`}
                        >
                            <ArrowLeftRight size={20} className="shrink-0" />
                            {expanded && (
                                <span className="text-sm font-bold uppercase tracking-tight">
                                    Ir a {isGerencia ? 'Compras' : 'Gerencia'}
                                </span>
                            )}
                        </button>
                    </div>
                )}
            </nav>

            {/* ── Footer ── */}
            <div className="border-t border-[#E2E8F0] p-3 shrink-0">
                {/* Backup — Manager only */}
                {[ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.RESPONSIBLE].includes(user?.role) && (
                    <button
                        onClick={handleBackup}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 mb-2 rounded-lg text-[#A0AEC0] hover:bg-[#F4F7FA] hover:text-[#4299E1] transition-all group ${!expanded ? 'justify-center' : ''}`}
                    >
                        <Download size={18} className="shrink-0" />
                        {expanded && <span className="text-xs font-bold uppercase tracking-widest">Backup</span>}
                    </button>
                )}

                {/* User card */}
                <div className={`flex items-center gap-3 p-2 rounded-lg bg-[#F4F7FA] mb-2 overflow-hidden ${!expanded ? 'justify-center' : ''}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm ${isGerencia ? 'bg-blue-600' : 'bg-[#FF8C9D]'}`}>
                        {initials}
                    </div>
                    {expanded && (
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold text-[#1A365D] truncate">{getDisplayName(user) || 'Usuario'}</p>
                            <p className="text-[10px] text-[#A0AEC0] uppercase font-bold tracking-tighter truncate">{user?.role || 'Invitado'}</p>
                        </div>
                    )}
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#A0AEC0] hover:bg-red-50 hover:text-red-500 transition-colors ${!expanded ? 'justify-center' : ''}`}
                >
                    <LogOut size={16} />
                    {expanded && <span className="text-xs font-bold uppercase tracking-widest">Salir</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
