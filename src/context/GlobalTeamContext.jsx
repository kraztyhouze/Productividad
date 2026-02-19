import React, { createContext, useContext, useState, useEffect } from 'react';
import { useStore } from './StoreContext';

/* 
   GLOBAL TEAM CONTEXT (Clean Slate)
   - Reemplazo seguro para evitar crashes.
*/

const GlobalTeamContext = createContext(null);

export const useTeam = () => {
    const context = useContext(GlobalTeamContext);
    if (!context) {
        // Fallback seguro para evitar 'destructuring of null'
        return {
            employees: [],
            roles: [],
            loading: false,
            getDisplayName: () => 'Usuario',
            addRole: async () => { },
            deleteRole: async () => { },
            addEmployee: async () => { },
            updateEmployee: async () => { },
            deleteEmployee: async () => { }
        };
    }
    return context;
};

export const TeamProvider = ({ children }) => {
    console.log("--- GlobalTeamProvider Mounting ---");
    const { currentStore } = useStore();

    // Estado seguro
    const [employees, setEmployees] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);

    // Placeholder functions
    const addRole = async () => { };
    const deleteRole = async () => { };
    const addEmployee = async () => { };
    const updateEmployee = async () => { };
    const deleteEmployee = async () => { };

    const getDisplayName = (emp) => {
        if (!emp) return 'Usuario';
        return emp.alias ? emp.alias : emp.firstName;
    };

    const value = {
        employees,
        roles,
        loading,
        addRole,
        deleteRole,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        getDisplayName
    };

    return (
        <GlobalTeamContext.Provider value={value}>
            {children}
        </GlobalTeamContext.Provider>
    );
};
