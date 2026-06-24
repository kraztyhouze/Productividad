import React, { createContext, useContext, useState, useEffect } from 'react';
import { ROLES } from './AuthContext';
import { useStore } from './StoreContext';

const ModuleContext = createContext(null);

export const MODULES = {
    COMPRAS: 'compras',
    GERENCIA: 'gerencia'
};

export const ModuleProvider = ({ children }) => {
    const { currentStore } = useStore();
    const [enabledModules, setEnabledModules] = useState({});
    const [loadingModules, setLoadingModules] = useState(true);

    const [activeModule, setActiveModule] = useState(() => {
        return localStorage.getItem('tiktak_active_module') || MODULES.COMPRAS;
    });

    useEffect(() => {
        const fetchModules = async () => {
            if (!currentStore) {
                setEnabledModules({});
                setLoadingModules(false);
                return;
            }
            try {
                setLoadingModules(true);
                const res = await fetch('/api/store-modules', {
                    headers: {
                        'x-store-id': currentStore
                    }
                });
                if (res.ok) {
                    const data = await res.json(); // Array of { moduleKey, isEnabled }
                    const mapped = {};
                    data.forEach(m => {
                        mapped[m.moduleKey] = m.isEnabled;
                    });
                    setEnabledModules(mapped);
                } else {
                    setEnabledModules({});
                }
            } catch (err) {
                console.error("Error loading store modules:", err);
                setEnabledModules({});
            } finally {
                setLoadingModules(false);
            }
        };
        fetchModules();
    }, [currentStore]);

    const isModuleEnabled = (key) => {
        if (loadingModules) return true;
        if (enabledModules[key] === undefined) return true;
        return enabledModules[key];
    };

    const isPathEnabled = (path) => {
        if (!currentStore) return true;
        if (path === '/') return isModuleEnabled('dashboard');
        if (path === '/productivity') return isModuleEnabled('productivity');
        if (path === '/market') return isModuleEnabled('market');
        if (path === '/reports') return isModuleEnabled('reports');
        if (path === '/gerencia') return isModuleEnabled('gerencia_summary');
        if (path.includes('tab=tasks')) return isModuleEnabled('gerencia_tasks');
        if (path === '/team') return isModuleEnabled('gerencia_team');
        if (path.includes('tab=tracking')) return isModuleEnabled('gerencia_tracking');
        if (path.includes('tab=jewelry')) return isModuleEnabled('gerencia_jewelry');
        if (path.includes('tab=meetings')) return isModuleEnabled('gerencia_meetings');
        if (path.includes('tab=cash')) return isModuleEnabled('gerencia_cash');
        if (path.includes('tab=reports')) return isModuleEnabled('gerencia_reports');
        return true;
    };

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
        <ModuleContext.Provider value={{ 
            activeModule, 
            setActiveModule, 
            switchModule, 
            getInitialModuleForRole, 
            MODULES,
            enabledModules,
            loadingModules,
            isModuleEnabled,
            isPathEnabled
        }}>
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
