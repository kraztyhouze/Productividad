import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth, ROLES } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { Users, ShoppingBag, LogOut, LayoutGrid, FileText } from 'lucide-react';

const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const { getDisplayName } = useTeam();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex bg-slate-950 min-h-screen font-sans text-slate-50 selection:bg-blue-500/30">
            {/* Sidebar */}
            <aside className="w-20 lg:w-64 fixed h-screen z-40 bg-slate-950/50 backdrop-blur-xl border-r border-slate-800/50 flex flex-col transition-all duration-300">
                <div className="h-24 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800/50 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-pink-600/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    {/* Logo Image */}
                    <img src="/logo_tiktak.jpg" alt="TikTak" className="w-10 h-10 rounded-full object-cover shadow-lg shadow-pink-500/20 shrink-0" />
                    <span className="hidden lg:block ml-3 font-extrabold text-2xl tracking-tight text-white" style={{ fontFamily: '"Varela Round", sans-serif' }}>
                        TikTak
                    </span>
                </div>

                <nav className="flex-1 py-8 px-3 space-y-2 overflow-y-auto custom-scrollbar">

                    <NavLink to="/" className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group ${isActive ? 'bg-pink-600 shadow-lg shadow-pink-500/20 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <LayoutGrid size={20} className="shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="hidden lg:block font-bold text-sm">Dashboard</span>
                    </NavLink>

                    <p className="hidden lg:block px-3 text-xs font-bold text-slate-500 uppercase tracking-widest mt-6 mb-2">Gestión</p>

                    {(user?.role === ROLES.MANAGER || user?.role === ROLES.RESPONSIBLE) && (
                        <>
                            <NavLink to="/team" className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group ${isActive ? 'bg-rose-600 shadow-lg shadow-rose-500/20 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                                <Users size={20} className="shrink-0 group-hover:scale-110 transition-transform" />
                                <span className="hidden lg:block font-bold text-sm">Equipo</span>
                            </NavLink>

                            <NavLink to="/reports" className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group ${isActive ? 'bg-fuchsia-600 shadow-lg shadow-fuchsia-500/20 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                                <FileText size={20} className="shrink-0 group-hover:scale-110 transition-transform" />
                                <span className="hidden lg:block font-bold text-sm">Informes</span>
                            </NavLink>
                        </>
                    )}



                    <NavLink to="/productivity" className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group ${isActive ? 'bg-emerald-600 shadow-lg shadow-emerald-500/20 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <ShoppingBag size={20} className="shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="hidden lg:block font-bold text-sm">Productividad</span>
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-slate-800/50">
                    <div className="bg-slate-900/50 rounded-xl p-3 flex items-center gap-3 border border-slate-800 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
                            {user?.avatar || user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="hidden lg:block overflow-hidden">
                            <p className="text-sm font-bold text-slate-100 truncate">{getDisplayName(user) || 'Usuario'}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.role || 'Invitado'}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                        <LogOut size={18} />
                        <span className="hidden lg:block font-bold text-sm">Salir</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-10 transition-all duration-300">
                <div className="max-w-[1920px] mx-auto animate-in fade-in duration-500">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
