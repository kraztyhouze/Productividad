import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TeamProvider } from './context/TeamContext';
import { StoreProvider, useStore } from './context/StoreContext'; // Importar StoreProvider
import { ProductivityProvider } from './context/ProductivityContext';

import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Team from './pages/Team';
import StoreSelection from './pages/StoreSelection'; // Importar StoreSelection pagina
import ModuleSelection from './pages/ModuleSelection';

import Productivity from './pages/Productivity';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Market from './pages/Market';
import MobileDiagnostics from './pages/MobileDiagnostics';
import LaptopDiagnostics from './pages/LaptopDiagnostics';
import LaptopRemoteTest from './pages/LaptopRemoteTest';
import Gerencia from './pages/Gerencia';

// Componente para proteger rutas que requieren Tienda seleccionada
const RequireStore = () => {
    const { currentStore } = useStore();
    const location = useLocation();

    if (!currentStore) {
        return <Navigate to="/select-store" state={{ from: location }} replace />;
    }
    return <Outlet />;
};

const ProtectedRoute = () => {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return <Outlet />;
};

function App() {
    return (
        <StoreProvider> {/* Envolver todo con StoreProvider */}
            <AuthProvider>
                <TeamProvider>
                    <ProductivityProvider>
                        <BrowserRouter>
                            <Routes>
                                {/* Ruta Pública para Selección de Tienda */}
                                <Route path="/select-store" element={<StoreSelection />} />

                                {/* Seleccion de Modulo (Requiere Tienda) */}
                                <Route element={<RequireStore />}>
                                    <Route path="/select-module" element={<ModuleSelection />} />
                                </Route>

                                {/* Rutas de Diagnóstico (Públicas globales) */}
                                <Route path="/mobile-test/:sessionId" element={<MobileDiagnostics />} />
                                <Route path="/laptop-test/:sessionId" element={<LaptopDiagnostics />} />
                                <Route path="/laptop-remote-test" element={<LaptopRemoteTest />} /> {/* New route for LaptopRemoteTest */}

                                {/* Rutas que requieren haber seleccionado tienda */}
                                <Route element={<RequireStore />}>
                                    <Route path="/login" element={<Login />} />

                                    <Route element={<ProtectedRoute />}>
                                        <Route path="/" element={<MainLayout />}>
                                            <Route index element={<Dashboard />} />
                                            <Route path="team" element={<Team />} />
                                            <Route path="productivity" element={<Productivity />} />
                                            <Route path="reports" element={<Reports />} />
                                            <Route path="market" element={<Market />} />
                                            <Route path="gerencia" element={<Gerencia />} />
                                        </Route>
                                    </Route>
                                </Route>

                                {/* Fallback route */}
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </BrowserRouter>
                    </ProductivityProvider>
                </TeamProvider>
            </AuthProvider>
        </StoreProvider>
    );
}

export default App;
