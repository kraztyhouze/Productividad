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
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-800/50">
                <div className="p-8 pb-6 text-center">
                    <div className="w-20 h-20 bg-white rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-black/20 mb-6 p-3 overflow-hidden">
                        <span className="text-3xl">🚀</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-50">Bienvenido</h1>
                    <p className="text-slate-400 mt-2">WorkSuite Productivity</p>
                    <p className="text-sm text-slate-500 mt-1">Inicia sesión con tus credenciales</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-4">
                    {error && (
                        <div className="bg-red-950/30 border border-red-900/50 text-red-300 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300">Usuario</label>
                        <div className="relative">
                            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                placeholder="Introduce tu usuario"
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-100 outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300">Contraseña</label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Introduce tu contraseña"
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-100 outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 mt-6"
                    >
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="px-6 py-4 bg-slate-800/50 text-center border-t border-slate-800/50">
                    <p className="text-xs text-slate-500 mb-2">Usuarios de prueba:</p>
                    <div className="flex flex-wrap gap-2 justify-center text-xs mb-3">
                        <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded">juanma / admin123</span>
                        <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded">compras / 123</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
