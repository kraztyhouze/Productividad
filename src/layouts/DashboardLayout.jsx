import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth, ROLES } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { Users, ShoppingBag, LogOut, LayoutGrid, FileText, Search } from 'lucide-react';

const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const { getDisplayName } = useTeam();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const [expanded, setExpanded] = React.useState(true);

    return (
        <div className="flex bg-slate-950 min-h-screen font-sans text-slate-50 selection:bg-blue-500/30">
            {/* Sidebar */}
            <aside className={`${expanded ? 'w-64' : 'w-20'} fixed h-screen z-40 bg-slate-950/50 backdrop-blur-xl border-r border-slate-800/50 flex flex-col transition-all duration-300`}>
                <div className="h-24 flex items-center justify-between px-4 border-b border-slate-800/50 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-pink-600/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                    <div className={`flex items-center gap-3 transition-all duration-300 ${!expanded ? 'justify-center w-full' : ''}`}>
                        {/* Logo Image */}
                        <img src="/logo_tiktak.jpg" alt="TikTak" className="h-10 w-auto object-contain shadow-lg shadow-pink-500/20 shrink-0" />
                        <span className={`font-extrabold text-2xl tracking-tight text-white transition-opacity duration-300 ${expanded ? 'opacity-100' : 'opacity-0 hidden'}`} style={{ fontFamily: '"Varela Round", sans-serif' }}>
                            TikTak
                        </span>
                    </div>

                    <button onClick={() => setExpanded(!expanded)} className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-all ${expanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <LayoutGrid size={16} className="rotate-90" />
                    </button>
                    {/* Floating toggle for collapsed state */}
                    {!expanded && (
                        <button onClick={() => setExpanded(true)} className="absolute inset-0 z-20 w-full h-full cursor-pointer opacity-0" title="Expandir"></button>
                    )}
                </div>

                <nav className="flex-1 py-8 px-3 space-y-2 overflow-y-auto custom-scrollbar">

                    <NavLink to="/" className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group ${isActive ? 'bg-pink-600 shadow-lg shadow-pink-500/20 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'} ${!expanded ? 'justify-center' : ''}`}>
                        <LayoutGrid size={20} className="shrink-0 group-hover:scale-110 transition-transform" />
                        <span className={`font-bold text-sm transition-opacity duration-300 ${expanded ? 'opacity-100' : 'opacity-0 hidden'}`}>Dashboard</span>
                    </NavLink>

                    <p className={`px-3 text-xs font-bold text-slate-500 uppercase tracking-widest mt-6 mb-2 transition-opacity duration-300 ${expanded ? 'opacity-100' : 'opacity-0 hidden'}`}>Gestión</p>

                    {(user?.role === ROLES.MANAGER || user?.role === ROLES.RESPONSIBLE) && (
                        <>
                            <NavLink to="/team" className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group ${isActive ? 'bg-rose-600 shadow-lg shadow-rose-500/20 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'} ${!expanded ? 'justify-center' : ''}`}>
                                <Users size={20} className="shrink-0 group-hover:scale-110 transition-transform" />
                                <span className={`font-bold text-sm transition-opacity duration-300 ${expanded ? 'opacity-100' : 'opacity-0 hidden'}`}>Equipo</span>
                            </NavLink>

                            <NavLink to="/reports" className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group ${isActive ? 'bg-fuchsia-600 shadow-lg shadow-fuchsia-500/20 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'} ${!expanded ? 'justify-center' : ''}`}>
                                <FileText size={20} className="shrink-0 group-hover:scale-110 transition-transform" />
                                <span className={`font-bold text-sm transition-opacity duration-300 ${expanded ? 'opacity-100' : 'opacity-0 hidden'}`}>Informes</span>
                            </NavLink>
                        </>
                    )}

                    <NavLink to="/productivity" className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group ${isActive ? 'bg-emerald-600 shadow-lg shadow-emerald-500/20 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'} ${!expanded ? 'justify-center' : ''}`}>
                        <ShoppingBag size={20} className="shrink-0 group-hover:scale-110 transition-transform" />
                        <span className={`font-bold text-sm transition-opacity duration-300 ${expanded ? 'opacity-100' : 'opacity-0 hidden'}`}>Productividad</span>
                    </NavLink>

                    <NavLink to="/market" className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group ${isActive ? 'bg-amber-600 shadow-lg shadow-amber-500/20 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'} ${!expanded ? 'justify-center' : ''}`}>
                        <Search size={20} className="shrink-0 group-hover:scale-110 transition-transform" />
                        <span className={`font-bold text-sm transition-opacity duration-300 ${expanded ? 'opacity-100' : 'opacity-0 hidden'}`}>Mercado</span>
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-slate-800/50">
                    <div className={`bg-slate-900/50 rounded-xl p-3 flex items-center gap-3 border border-slate-800 mb-3 ${!expanded ? 'justify-center' : ''}`}>
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
                            {user?.avatar || user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>
                            <p className="text-sm font-bold text-slate-100 truncate">{getDisplayName(user) || 'Usuario'}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.role || 'Invitado'}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className={`w-full flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors ${!expanded ? 'justify-center' : ''}`}>
                        <LogOut size={18} />
                        <span className={`font-bold text-sm transition-opacity duration-300 ${expanded ? 'opacity-100' : 'opacity-0 hidden'}`}>Salir</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 p-6 lg:p-10 transition-all duration-300 ${expanded ? 'ml-64' : 'ml-20'}`}>
                <div className="max-w-[1920px] mx-auto animate-in fade-in duration-500">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
