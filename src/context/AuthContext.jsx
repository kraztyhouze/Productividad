import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const ROLES = {
    MANAGER: 'Gerente',
    RESPONSIBLE: 'Responsable',
    EMPLOYEE: 'Empleado',
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for persisted session
        const storedUser = localStorage.getItem('is_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    // Real login with username/password (Async against DB)
    const login = async (username, password) => {
        try {
            // Fetch employees from API to check credentials
            const res = await fetch('/api/employees');
            if (!res.ok) throw new Error("Error connecting to server");

            const employees = await res.json();

            if (!employees || employees.length === 0) {
                return { success: false, message: 'No hay empleados registrados en el sistema.' };
            }

            const employee = employees.find(emp => emp.username === username && emp.password === password);

            if (!employee) {
                return { success: false, message: 'Usuario o contraseña incorrectos' };
            }

            // Create user session
            const userSession = {
                id: employee.id,
                name: `${employee.firstName} ${employee.lastName}`,
                role: employee.role,
                // Use alias as avatar initial or fallback
                avatar: employee.alias || `${employee.firstName[0]}${employee.lastName[0]}`,
                username: employee.username,
                email: employee.email,
                isMaster: false,
                isBuyer: employee.isBuyer // Useful for permissions
            };

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
