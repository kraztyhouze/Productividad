import React, { createContext, useContext, useState, useEffect } from 'react';
import { useStore } from './StoreContext';

const AuthContext = createContext(null);

export const ROLES = {
    MANAGER: 'Gerente',
    RESPONSIBLE: 'Responsable',
    EMPLOYEE: 'Empleado',
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { currentStore } = useStore(); // Access current store context

    useEffect(() => {
        // Check local storage for persisted session
        const storedUser = localStorage.getItem('is_user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            // Validate that the user belongs to the current store
            if (currentStore && parsedUser.storeId && parsedUser.storeId !== currentStore) {
                console.warn("Session Mismatch: User belongs to", parsedUser.storeId, "but current store is", currentStore);
                localStorage.removeItem('is_user');
                setUser(null);
            } else {
                setUser(parsedUser);
            }
        }
        setLoading(false);
    }, [currentStore]);

    // Real login with username/password (Async against DB)
    const login = async (username, password) => {
        try {
            // Get current store
            const currentStore = localStorage.getItem('tiktak_current_store');

            // Secure Login via API
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-store-id': currentStore || 'store_1'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                return { success: false, message: data.message || 'Error de inicio de sesión' };
            }

            // Create user session from server response
            const userSession = data.user;

            setUser(userSession);
            localStorage.setItem('is_user', JSON.stringify(userSession));
            return { success: true, role: userSession.role };

        } catch (error) {
            console.error("Login Error:", error);
            return { success: false, message: 'Error de conexión. Inténtalo de nuevo.' };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('is_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, ROLES }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
