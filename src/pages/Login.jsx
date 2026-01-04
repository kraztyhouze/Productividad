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
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Ambient Background - Enhanced Glare */}
            <div className="absolute top-[-20%] left-[-10%] w-[50rem] h-[50rem] bg-pink-600/30 rounded-full blur-[120px] pointer-events-none opacity-60 mix-blend-screen"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50rem] h-[50rem] bg-purple-600/30 rounded-full blur-[120px] pointer-events-none opacity-60 mix-blend-screen"></div>

            {/* Geometric Accents */}
            <div className="absolute top-1/2 left-1/4 w-96 h-1 bg-gradient-to-r from-transparent via-pink-500/50 to-transparent -rotate-45 blur-sm opacity-50"></div>
            <div className="absolute top-1/3 right-1/4 w-96 h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent rotate-45 blur-sm opacity-50"></div>

            <div className="max-w-[26rem] w-full relative z-10 group">
                {/* Glowing Border Effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-b from-pink-500/50 to-purple-600/50 rounded-[2rem] blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>

                <div className="relative bg-slate-900/40 backdrop-blur-2xl rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden p-8 px-10">

                    <div className="flex flex-col items-center justify-center mb-8">
                        {/* Logo - Natural Aspect Ratio */}
                        <div className="mb-4">
                            <img src="/logo_tiktak.jpg" alt="TikTak" className="h-20 w-auto object-contain drop-shadow-[0_0_15px_rgba(236,72,153,0.5)] rounded-2xl" />
                        </div>

                        <h1 className="text-3xl font-bold text-white tracking-tight text-center" style={{ fontFamily: '"Varela Round", sans-serif' }}>
                            Bienvenido a TikTak
                        </h1>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-2 backdrop-blur-md">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="relative group/input">
                                <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400/70 group-focus-within/input:text-pink-400 transition-colors" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    placeholder="Usuario"
                                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-pink-500/30 bg-slate-950/50 text-white placeholder:text-slate-400 outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="relative group/input">
                                <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400/70 group-focus-within/input:text-pink-400 transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Contraseña"
                                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-pink-500/30 bg-slate-950/50 text-white placeholder:text-slate-400 outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-xl font-bold text-lg shadow-[0_0_20px_-5px_rgba(236,72,153,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98] mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Entrando...' : 'Iniciar Sesión'}
                        </button>

                        <div className="flex flex-col items-center gap-2 text-sm text-slate-400 pt-2">
                            <button type="button" className="hover:text-pink-400 transition-colors underline decoration-pink-500/30 underline-offset-4">Olvidé mi contraseña</button>
                            <button type="button" className="hover:text-pink-400 transition-colors underline decoration-pink-500/30 underline-offset-4">Crear cuenta</button>
                        </div>
                    </form>
                </div>

                <div className="text-center mt-6 text-[10px] text-slate-500 font-mono opacity-50">
                    TEST CREDS: admin / admin • juanma / admin123
                    <br />
                    <button
                        onClick={() => {
                            localStorage.setItem('is_user', JSON.stringify({
                                id: 999,
                                name: 'Invitado Gerente',
                                role: 'Gerente',
                                avatar: 'G',
                                username: 'guest',
                                email: 'guest@tiktak.com',
                                isMaster: true,
                                isBuyer: true
                            }));
                            window.location.href = '/market';
                        }}
                        className="mt-2 underline text-pink-500 hover:text-white cursor-pointer"
                    >
                        [DEV] Entrar como Invitado (Sin DB)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
