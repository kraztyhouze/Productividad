import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { Lock, User, AlertCircle, Store, ArrowRight } from 'lucide-react';

const Login = () => {
    const { login } = useAuth();
    const { clearStore, selectedStoreData } = useStore();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleBackToStore = () => {
        clearStore();
        navigate('/select-store');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await login(username, password);
        if (result.success) {
            navigate(result.role === 'Puesto Compras' ? '/productivity' : '/');
        } else {
            setError(result.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: '#F4F7FA' }}>

            {/* Subtle background decorations */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-40 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(255,140,157,0.15) 0%, transparent 70%)' }} />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-30 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(66,153,225,0.12) 0%, transparent 70%)' }} />

            <div className="w-full max-w-[420px] relative z-10">
                {/* Card */}
                <div className="bg-white rounded-2xl p-10 border border-[#E2E8F0]" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>

                    {/* Store indicator */}
                    <button
                        onClick={handleBackToStore}
                        className="flex items-center gap-1.5 text-xs text-[#A0AEC0] hover:text-[#FF8C9D] transition-colors mb-8 group"
                    >
                        <Store size={12} />
                        <span>{selectedStoreData?.name || 'Cambiar Tienda'}</span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </button>

                    {/* Logo + Title */}
                    <div className="flex flex-col items-center mb-8">
                        <img
                            src="/logo_tiktak.jpg"
                            alt="TikTak"
                            className="h-16 w-auto object-contain rounded-xl mb-5"
                            style={{ boxShadow: '0 4px 20px rgba(255,140,157,0.2)' }}
                        />
                        <h1 className="text-2xl font-black text-[#1A365D] text-center">Bienvenido</h1>
                        <p className="text-sm text-[#718096] mt-1 text-center">Inicia sesión en TikTak Suite</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 text-sm animate-in">
                                <AlertCircle size={16} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Username */}
                        <div className="relative group">
                            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0AEC0] group-focus-within:text-[#FF8C9D] transition-colors" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                placeholder="Usuario"
                                autoComplete="off"
                                id="login-username"
                                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#E2E8F0] bg-[#F4F7FA] text-[#1A365D] placeholder:text-[#A0AEC0] text-sm outline-none transition-all font-medium focus:border-[#FF8C9D] focus:bg-white"
                                style={{ '--tw-ring-color': 'rgba(255,140,157,0.2)' }}
                            />
                        </div>

                        {/* Password */}
                        <div className="relative group">
                            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0AEC0] group-focus-within:text-[#FF8C9D] transition-colors" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Contraseña"
                                autoComplete="new-password"
                                id="login-password"
                                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#E2E8F0] bg-[#F4F7FA] text-[#1A365D] placeholder:text-[#A0AEC0] text-sm outline-none transition-all font-medium focus:border-[#FF8C9D] focus:bg-white"
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            id="login-submit"
                            disabled={loading}
                            className="w-full py-3.5 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
                            style={{ background: '#FF8C9D', boxShadow: '0 8px 24px rgba(255,140,157,0.35)' }}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Entrando...
                                </span>
                            ) : (
                                <>Iniciar Sesión <ArrowRight size={16} /></>
                            )}
                        </button>

                        <p className="text-center text-xs text-[#A0AEC0] pt-1">
                            <button type="button" className="hover:text-[#FF8C9D] transition-colors">¿Olvidaste tu contraseña?</button>
                        </p>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-[#CBD5E0] mt-6">TikTak Suite · {new Date().getFullYear()}</p>
            </div>
        </div>
    );
};

export default Login;
