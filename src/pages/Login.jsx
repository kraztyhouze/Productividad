import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, AlertCircle } from 'lucide-react';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(username, password);

        if (result.success) {
            if (result.role === 'Puesto Compras') {
                navigate('/productivity');
            } else {
                navigate('/');
            }
        } else {
            setError(result.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-pink-600/20 rounded-full blur-[100px] pointer-events-none opacity-50"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none opacity-50"></div>

            <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-800/50 z-10">
                <div className="p-8 pb-6 text-center">
                    <div className="w-24 h-24 mx-auto mb-6 p-2 rounded-full bg-slate-900/50 shadow-lg border border-slate-800/50 flex items-center justify-center">
                        <img src="/logo_tiktak.jpg" alt="TikTak Logo" className="w-full h-full object-cover rounded-full" />
                    </div>

                    <h1 className="text-3xl font-bold text-slate-50" style={{ fontFamily: '"Varela Round", sans-serif' }}>
                        Bienvenido a TikTak
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm">Productivity Suite</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-5">
                    {error && (
                        <div className="bg-red-950/30 border border-red-900/50 text-red-300 px-4 py-3 rounded-xl flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Usuario</label>
                        <div className="relative group">
                            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-pink-500 transition-colors" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                placeholder="Introduce tu usuario"
                                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-100 outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50 transition-all placeholder:text-slate-600"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Contraseña</label>
                        <div className="relative group">
                            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-pink-500 transition-colors" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Introduce tu contraseña"
                                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-100 outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50 transition-all placeholder:text-slate-600"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg shadow-pink-600/20 mt-4 active:scale-[0.98]"
                    >
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>

                    <div className="flex justify-between text-xs text-slate-500 pt-2 px-1">
                        <button type="button" className="hover:text-pink-400 transition-colors">Olvidé mi contraseña</button>
                        <button type="button" className="hover:text-pink-400 transition-colors">Crear cuenta</button>
                    </div>
                </form>

                <div className="px-6 py-4 bg-slate-900/30 text-center border-t border-slate-800/50">
                    <p className="text-[10px] text-slate-600 font-medium tracking-wide">
                        TEST CREDS: <span className="text-slate-400">admin / admin</span> • <span className="text-slate-400">juanma / admin123</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
