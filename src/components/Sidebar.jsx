import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth, ROLES } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { Users, ShoppingBag, LogOut, LayoutGrid, FileText, Search, Download, ChevronLeft, ChevronRight, Briefcase } from 'lucide-react';

const NAV_ITEMS = [
    {
        section: null,
        items: [
            { to: '/', label: 'Dashboard', icon: LayoutGrid, roles: [ROLES.MANAGER, ROLES.RESPONSIBLE, 'VIEW_ONLY'] },
        ]
    },
    {
        section: 'Gestión',
        items: [
            { to: '/team', label: 'Equipo', icon: Users, roles: [ROLES.MANAGER, ROLES.RESPONSIBLE] },
            { to: '/reports', label: 'Informes', icon: FileText, roles: [ROLES.MANAGER, ROLES.RESPONSIBLE] },
            { to: '/productivity', label: 'Productividad', icon: ShoppingBag, roles: null }, // all roles
            { to: '/market', label: 'Mercado', icon: Search, roles: null },
            { to: '/gerencia', label: 'Gerencia', icon: Briefcase, roles: [ROLES.MANAGER] },
        ]
    }
];

const Sidebar = ({ expanded, setExpanded }) => {
    const { user, logout } = useAuth();
    const { getDisplayName } = useTeam();
    const navigate = useNavigate();



    const handleLogout = () => {
        logout();
        navigate('/login');
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
                    <img
                        src="/logo_tiktak.jpg"
                        alt="TikTak"
                        className="h-9 w-auto object-contain rounded-lg shrink-0"
                    />
                    <span
                        className={`font-extrabold text-xl tracking-tight text-[#1A365D] whitespace-nowrap transition-all duration-300 ${expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}
                        style={{ fontFamily: '"Inter", sans-serif' }}
                    >
                        TikTak
                    </span>
                </div>

                {/* Collapse toggle */}
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
                {NAV_ITEMS.map((group, gi) => (
                    <div key={gi}>
                        {/* Section label */}
                        {group.section && expanded && (
                            <p className="px-3 pt-4 pb-1 text-[10px] font-bold text-[#A0AEC0] uppercase tracking-widest select-none">
                                {group.section}
                            </p>
                        )}
                        {group.section && !expanded && <div className="my-3 mx-3 border-t border-[#E2E8F0]" />}

                        {group.items.filter(item => canSee(item.roles)).map(item => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.to === '/'}
                                id={`nav-${item.label.toLowerCase()}`}
                                className={({ isActive }) =>
                                    `relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                                    ${!expanded ? 'justify-center' : ''}
                                    ${isActive
                                        ? 'bg-[#fff0f2] text-[#FF8C9D]'
                                        : 'text-[#718096] hover:bg-[#F4F7FA] hover:text-[#1A365D]'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        {/* Active accent bar */}
                                        {isActive && (
                                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#FF8C9D] rounded-r-full" />
                                        )}
                                        <item.icon
                                            size={20}
                                            className={`shrink-0 transition-transform ${isActive ? 'text-[#FF8C9D]' : 'text-[#A0AEC0] group-hover:text-[#1A365D]'}`}
                                        />
                                        {expanded && (
                                            <span className={`text-sm font-semibold whitespace-nowrap ${isActive ? 'text-[#FF8C9D]' : ''}`}>
                                                {item.label}
                                            </span>
                                        )}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>
                ))}

                {/* Backup — Manager only */}
                {user?.role === ROLES.MANAGER && (
                    <button
                        onClick={handleBackup}
                        id="sidebar-backup-btn"
                        className={`w-full flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg text-[#A0AEC0] hover:bg-[#F4F7FA] hover:text-[#4299E1] transition-all group ${!expanded ? 'justify-center' : ''}`}
                    >
                        <Download size={20} className="shrink-0" />
                        {expanded && <span className="text-sm font-semibold">Backup DB</span>}
                    </button>
                )}
            </nav>

            {/* ── Footer / User ── */}
            <div className="border-t border-[#E2E8F0] p-3 shrink-0">
                {/* User card */}
                <div className={`flex items-center gap-3 p-3 rounded-lg bg-[#F4F7FA] mb-2 overflow-hidden ${!expanded ? 'justify-center' : ''}`}>
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#FF8C9D] to-[#e87589] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                        {initials}
                    </div>
                    {expanded && (
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-[#1A365D] truncate">{getDisplayName(user) || 'Usuario'}</p>
                            <p className="text-xs text-[#A0AEC0] truncate">{user?.role || 'Invitado'}</p>
                        </div>
                    )}
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    id="sidebar-logout-btn"
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#A0AEC0] hover:bg-red-50 hover:text-red-500 transition-colors ${!expanded ? 'justify-center' : ''}`}
                >
                    <LogOut size={18} />
                    {expanded && <span className="text-sm font-semibold">Salir</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
