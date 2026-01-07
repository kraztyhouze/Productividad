import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TeamProvider } from './context/TeamContext';

import { ProductivityProvider } from './context/ProductivityContext';

import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Team from './pages/Team';

import Productivity from './pages/Productivity';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Market from './pages/Market';
import MobileDiagnostics from './pages/MobileDiagnostics';
import LaptopDiagnostics from './pages/LaptopDiagnostics';

const ProtectedRoute = () => {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return <Outlet />;
};

function App() {
    return (
        <AuthProvider>
            <TeamProvider>
                <ProductivityProvider>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/login" element={<Login />} />

                            {/* Public Mobile Route */}
                            <Route path="/mobile-test/:sessionId" element={<MobileDiagnostics />} />
                            <Route path="/laptop-test/:sessionId" element={<LaptopDiagnostics />} />

                            <Route element={<ProtectedRoute />}>
                                <Route path="/" element={<DashboardLayout />}>
                                    <Route index element={<Dashboard />} />
                                    <Route path="team" element={<Team />} />

                                    <Route path="productivity" element={<Productivity />} />
                                    <Route path="reports" element={<Reports />} />
                                    <Route path="market" element={<Market />} />
                                </Route>
                            </Route>

                            {/* Fallback route */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </BrowserRouter>
                </ProductivityProvider>
            </TeamProvider>
        </AuthProvider>
    );
}

export default App;
