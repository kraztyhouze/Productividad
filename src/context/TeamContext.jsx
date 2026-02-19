import React, { createContext, useContext, useState, useEffect } from 'react';
import { useStore } from './StoreContext';

const TeamContext = createContext(null);

// Initial Mock Data with detailed HR fields
// Real Data from Excel Import
// Initial Mock Data removed for security.
// Real Data comes from Database or fresh creation.
const INITIAL_EMPLOYEES = [];

export const CONTRACT_TYPES = ['Indefinido', 'Temporal', 'Prácticas', 'Fijo Discontinuo', 'Interinidad'];

const PREDEFINED_ROLES = [
    'Gerente',
    'Supervisor',
    'Responsable',
    'Empleado',
    'Puesto Compras'
];

export const LEAVE_TYPES = ['ILT (Enfermedad Común)', 'Accidente Laboral', 'Paternidad/Maternidad', 'Permiso Retribuido', 'Excedencia'];


// ... imports

export const TeamProvider = ({ children }) => {
    const { currentStore } = useStore(); // Obtener la tienda actual

    const [employees, setEmployees] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);

    // Helper for Multi-Store Headers
    const getHeaders = () => {
        const storeId = currentStore || localStorage.getItem('tiktak_current_store') || 'store_1';
        return {
            'Content-Type': 'application/json',
            'x-store-id': storeId
        };
    };

    const getFetchOptions = () => ({
        headers: getHeaders(),
        cache: 'no-store'
    });

    const fetchRoles = async () => {
        try {
            const res = await fetch('/api/roles', getFetchOptions());
            if (res.ok) {
                const data = await res.json();
                if (data.length === 0) {
                    console.log("Seeding basic roles...");
                    const seeded = [];
                    for (const roleName of PREDEFINED_ROLES) {
                        const newRole = { name: roleName, color: 'slate', permissions: 'basic' };
                        const sRes = await fetch('/api/roles', {
                            method: 'POST',
                            headers: getHeaders(),
                            body: JSON.stringify(newRole)
                        });
                        if (sRes.ok) seeded.push(await sRes.json());
                    }
                    setRoles(seeded);
                } else {
                    setRoles(data);
                }
            }
        } catch (e) {
            console.error("Error fetching roles:", e);
        }
    };

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/employees', getFetchOptions());
            if (res.ok) {
                const data = await res.json();
                setEmployees(data);
                // NOTA: Se ha eliminado la "siembra" automática de empleados de prueba (INITIAL_EMPLOYEES)
                // para respetar el lienzo en blanco en nuevas tiendas.
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
        } finally {
            setLoading(false);
        }
    };

    // Reload when store changes
    useEffect(() => {
        if (currentStore) {
            // Clean state first
            setEmployees([]);
            const load = async () => {
                await Promise.all([fetchRoles(), fetchEmployees()]);
            };
            load();
        }
    }, [currentStore]);

    // ... (Actions using getHeaders)
    // --- Role Management ---
    const addRole = async (roleName) => {
        const tempId = Date.now();
        const newRole = { id: tempId, name: roleName, color: 'slate', permissions: 'basic' };
        setRoles(prev => [...prev, newRole]);

        try {
            const res = await fetch('/api/roles', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ name: roleName, color: 'slate', permissions: 'basic' })
            });
            if (res.ok) {
                const saved = await res.json();
                setRoles(prev => prev.map(r => r.id === tempId ? saved : r));
            }
        } catch (e) { console.error(e); }
    };

    const deleteRole = async (id) => {
        setRoles(prev => prev.filter(r => r.id !== id));
        try {
            await fetch(`/api/roles/${id}`, { method: 'DELETE', headers: getHeaders() });
        } catch (e) { console.error(e); }
    };

    // --- Employee Management ---
    const addEmployee = async (employeeData) => {
        const tempId = Date.now();
        const newEmployee = {
            ...employeeData,
            id: tempId,
            vacations: [], leaves: [], hoursBalance: 0,
            order: employees.length > 0 ? Math.max(...employees.map(e => e.order || 0)) + 1 : 0
        };
        setEmployees(prev => [...prev, newEmployee]);

        try {
            const res = await fetch('/api/employees', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(newEmployee)
            });
            if (res.ok) {
                const { id } = await res.json();
                setEmployees(prev => prev.map(e => e.id === tempId ? { ...e, id } : e));
            }
        } catch (err) { console.error("Error adding employee:", err); }
    };

    const updateEmployee = async (id, updatedData) => {
        setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, ...updatedData } : emp));
        try {
            await fetch(`/api/employees/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(updatedData)
            });
        } catch (err) { console.error("Error updating employee:", err); }
    };

    const deleteEmployee = async (id) => {
        setEmployees(prev => prev.filter(emp => emp.id !== id));
        try {
            await fetch(`/api/employees/${id}`, { method: 'DELETE', headers: getHeaders() });
        } catch (err) { console.error("Error deleting employee:", err); }
    };

    const getDisplayName = (emp) => {
        if (!emp) return 'Usuario';
        return emp.alias ? emp.alias : emp.firstName;
    };

    return (
        <TeamContext.Provider value={{ employees, roles, addRole, deleteRole, addEmployee, updateEmployee, deleteEmployee, loading, getDisplayName }}>
            {children}
        </TeamContext.Provider>
    );
};

export const useTeam = () => useContext(TeamContext);
