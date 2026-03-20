import React, { createContext, useContext, useState, useEffect } from 'react';
import { ROLES } from './AuthContext';

const ModuleContext = createContext(null);

export const MODULES = {
    COMPRAS: 'compras',
    GERENCIA: 'gerencia'
};

export const ModuleProvider = ({ children }) => {
    const [activeModule, setActiveModule] = useState(() => {
        return localStorage.getItem('tiktak_active_module') || MODULES.COMPRAS;
    });

    const switchModule = (moduleName) => {
        if (Object.values(MODULES).includes(moduleName)) {
            setActiveModule(moduleName);
            localStorage.setItem('tiktak_active_module', moduleName);
        }
    };

    // Helper to determine module by role
    const getInitialModuleForRole = (role) => {
        if ([ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.RESPONSIBLE].includes(role)) {
            return MODULES.GERENCIA;
        }
        return MODULES.COMPRAS;
    };

    return (
        <ModuleContext.Provider value={{ activeModule, setActiveModule, switchModule, getInitialModuleForRole, MODULES }}>
            {children}
        </ModuleContext.Provider>
    );
};

export const useModule = () => {
    const context = useContext(ModuleContext);
    if (!context) {
        throw new Error('useModule must be used within a ModuleProvider');
    }
    return context;
};
