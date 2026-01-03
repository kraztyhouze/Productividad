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

    // Real login with username/password
    const login = (username, password) => {
        // First check if it's the master user
        const storedMaster = localStorage.getItem('is_master');
        if (storedMaster) {
            const masterCredentials = JSON.parse(storedMaster);
            if (username === masterCredentials.username && password === masterCredentials.password) {
                const masterSession = {
                    id: 'master',
                    name: masterCredentials.name,
                    role: masterCredentials.role,
                    avatar: 'MA',
                    username: masterCredentials.username,
                    email: 'master@empresa.com',
                    isMaster: true
                };
                setUser(masterSession);
                localStorage.setItem('is_user', JSON.stringify(masterSession));
                return { success: true };
            }
        }

        // Then check regular employees
        const storedEmployees = localStorage.getItem('is_team');
        if (!storedEmployees) {
            return { success: false, message: 'No hay empleados registrados' };
        }

        const employees = JSON.parse(storedEmployees);
        const employee = employees.find(emp => emp.username === username && emp.password === password);

        if (!employee) {
            return { success: false, message: 'Usuario o contraseña incorrectos' };
        }

        // Create user session
        const userSession = {
            id: employee.id,
            name: `${employee.firstName} ${employee.lastName}`,
            role: employee.role,
            avatar: `${employee.firstName[0]}${employee.lastName[0]}`,
            username: employee.username,
            email: employee.email,
            isMaster: false
        };

        setUser(userSession);
        localStorage.setItem('is_user', JSON.stringify(userSession));
        return { success: true, role: userSession.role };
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
