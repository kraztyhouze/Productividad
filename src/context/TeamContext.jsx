import React, { createContext, useContext, useState, useEffect } from 'react';

const TeamContext = createContext(null);

// Initial Mock Data with detailed HR fields
// Real Data from Excel Import
const INITIAL_EMPLOYEES = [
    {
        id: 1,
        firstName: 'Juan Manuel',
        lastName: 'Hidalgo Ramirez',
        alias: 'JMH', // Gerente
        email: 'juanmanuelhr87@gmail.com',
        role: 'Gerente',
        contractHours: 40,
        contractType: 'Indefinido',
        phone: '600 000 000',
        username: 'juanma',
        password: 'admin123', // Default admin pass
        address: 'Sevilla',
        vacations: [],
        leaves: [],
        hoursBalance: 0,
        isBuyer: true,
        order: 1
    },
    {
        id: 2,
        firstName: 'Marco',
        lastName: 'Noguero Jimenez',
        alias: 'MNO',
        email: 'mnoguero@mdfinanzas.es',
        role: 'Supervisor',
        contractHours: 40,
        contractType: 'Indefinido',
        username: 'marco',
        password: '123',
        vacations: [], leaves: [], hoursBalance: 0, isBuyer: true, order: 2
    },
    {
        id: 3,
        firstName: 'Francisco',
        lastName: 'Mesa Molina',
        alias: 'FM',
        email: 'fran-mesa@hotmail.com',
        role: 'Responsable',
        contractHours: 40,
        contractType: 'Indefinido',
        username: 'francisco',
        password: '123',
        vacations: [], leaves: [], hoursBalance: 0, isBuyer: true, order: 3
    },
    {
        id: 4,
        firstName: 'Alberto',
        lastName: 'Olmo Conde',
        alias: 'AOC',
        email: 'alberto_olc@hotmail.com',
        role: 'Responsable',
        contractHours: 40,
        contractType: 'Indefinido',
        username: 'alberto',
        password: '123',
        vacations: [], leaves: [], hoursBalance: 0, isBuyer: true, order: 4
    },
    {
        id: 5,
        firstName: 'Gonzalez',
        lastName: 'Gonzalez Sosa',
        alias: 'GG',
        email: 'pichichi73@hotmail.com',
        role: 'Responsable',
        contractHours: 40,
        contractType: 'Indefinido',
        username: 'gonzalez',
        password: '123',
        vacations: [], leaves: [], hoursBalance: 0, isBuyer: true, order: 5
    },
    {
        id: 6,
        firstName: 'Ruben',
        lastName: 'Noguero Lobo',
        alias: 'RNL',
        email: 'rubennl1999@gmail.com',
        role: 'Prof Com/venta',
        contractHours: 32,
        contractType: 'Indefinido',
        username: 'ruben',
        password: '123',
        vacations: [], leaves: [], hoursBalance: 0, isBuyer: true, order: 6
    },
    {
        id: 7,
        firstName: 'Manuel',
        lastName: 'Solier Vela',
        alias: 'MS',
        email: 'manuelsolier@hotmail.com',
        role: 'Prof Com/venta',
        contractHours: 40,
        contractType: 'Indefinido',
        username: 'manuel',
        password: '123',
        vacations: [], leaves: [], hoursBalance: 0, isBuyer: true, order: 7
    },
    {
        id: 8,
        firstName: 'Jose Carlos',
        lastName: 'Barrientos',
        alias: 'JCB',
        email: 'barrienso@gmail.com',
        role: 'Prof Com/venta',
        contractHours: 40,
        contractType: 'Indefinido',
        username: 'josecarlos',
        password: '123',
        vacations: [], leaves: [], hoursBalance: 0, isBuyer: true, order: 8
    },
    {
        id: 9,
        firstName: 'Alicia',
        lastName: 'Peñuela de Mula',
        alias: 'ALD',
        email: 'minto.chan@gmail.com',
        role: 'Prof Com/venta',
        contractHours: 40,
        contractType: 'Interinidad',
        username: 'alicia',
        password: '123',
        vacations: [], leaves: [], hoursBalance: 0, isBuyer: true, order: 9
    },
    {
        id: 10,
        firstName: 'Maria Belen',
        lastName: 'Mateos',
        alias: 'BMP',
        email: 'mp.belen.1987@gmail.com',
        role: 'Prof Com/venta',
        contractHours: 26,
        contractType: 'Indefinido',
        username: 'mariabelen',
        password: '123',
        vacations: [], leaves: [], hoursBalance: 0, isBuyer: true, order: 10
    },
    {
        id: 11,
        firstName: 'Angel Rafael',
        lastName: 'Moreno Lancha',
        alias: 'RML',
        email: 'rafamorlan@hotmail.com',
        role: 'Prof Com/venta',
        contractHours: 24,
        contractType: 'Indefinido',
        username: 'angelrafael',
        password: '123',
        vacations: [], leaves: [], hoursBalance: 0, isBuyer: true, order: 11
    },
    {
        id: 12,
        firstName: 'Antonia',
        lastName: 'Castro Mesa',
        alias: 'TC',
        email: 'tcastrm@gmail.com',
        role: 'Prof Com/venta',
        contractHours: 40,
        contractType: 'Indefinido',
        username: 'antonia',
        password: '123',
        vacations: [], leaves: [], hoursBalance: 0, isBuyer: true, order: 12
    },
    {
        id: 13,
        firstName: 'Angel',
        lastName: 'Luna Perejon',
        alias: 'ALP',
        email: 'alunaperejon@gmail.com',
        role: 'Prof Com/venta',
        contractHours: 24,
        contractType: 'Indefinido',
        username: 'angelluna',
        password: '123',
        vacations: [], leaves: [], hoursBalance: 0, isBuyer: true, order: 13
    },
    {
        id: 14,
        firstName: 'Eva Maria',
        lastName: 'Jimenez Peralta',
        alias: 'EJP',
        email: 'evajperalta@gmail.com',
        role: 'Prof Com/venta',
        contractHours: 20,
        contractType: 'Indefinido',
        username: 'evamaria',
        password: '123',
        vacations: [], leaves: [], hoursBalance: 0, isBuyer: true, order: 14
    },
    {
        id: 15,
        firstName: 'Monica',
        lastName: 'Gomez Nieves',
        alias: 'MGN',
        email: 'monicalacolea2333@gmail.com',
        role: 'Prof Com/venta',
        contractHours: 40,
        contractType: 'Indefinido',
        username: 'monica',
        password: '123',
        vacations: [], leaves: [], hoursBalance: 0, isBuyer: true, order: 15
    },
    {
        id: 16,
        firstName: 'Alejandro',
        lastName: 'Guerra Rasero',
        alias: 'AGR',
        email: 'aleguerra.rasero.ag@gmail.com',
        role: 'Prof Com/venta',
        contractHours: 24,
        contractType: 'Indefinido',
        username: 'alejandro',
        password: '123',
        vacations: [], leaves: [], hoursBalance: 0, isBuyer: true, order: 16
    },
    {
        id: 17,
        firstName: 'Edixeil Paola',
        lastName: 'Sandoval',
        alias: 'EDI',
        email: 'edixeilsandoval76@gmail.com',
        role: 'Limpiadora',
        contractHours: 20,
        contractType: 'Indefinido',
        username: 'edixeil',
        password: '123',
        vacations: [], leaves: [], hoursBalance: 0, isBuyer: true, order: 17
    },
    {
        id: 18,
        firstName: 'Daniel',
        lastName: 'Carrasco',
        alias: 'DAN',
        email: 'Danieelcarrasco48@gmail.com',
        role: 'Ven Inicial',
        contractHours: 24,
        contractType: 'Temporal',
        username: 'daniel',
        password: '123',
        vacations: [], leaves: [], hoursBalance: 0, isBuyer: true, order: 18
    },
    // Dedicated Shared Account
    {
        id: 999,
        firstName: 'Puesto',
        lastName: 'Compras',
        alias: 'KIOSCO',
        phone: '',
        address: 'Tienda',
        contractHours: 40,
        contractType: 'Indefinido',
        role: 'Puesto Compras',
        email: 'compras@sevilla2.com',
        username: 'compras',
        password: '123',
        vacations: [],
        leaves: [],
        hoursBalance: 0,
        managerNotes: 'Cuenta compartida.',
        isBuyer: true,
        order: 99
    }
];

export const CONTRACT_TYPES = ['Indefinido', 'Temporal', 'Prácticas', 'Fijo Discontinuo', 'Interinidad'];

const PREDEFINED_ROLES = [
    'Gerente',
    'Supervisor',
    'Responsable',
    'Prof Com/venta',
    'Limpiadora',
    'Ven Inicial',
    'Puesto Compras'
];

export const LEAVE_TYPES = ['ILT (Enfermedad Común)', 'Accidente Laboral', 'Paternidad/Maternidad', 'Permiso Retribuido', 'Excedencia'];

export const TeamProvider = ({ children }) => {
    const [employees, setEmployees] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);


    // --- LOAD EMPLOYEES ---
    const fetchEmployees = async () => {
        try {
            const res = await fetch('/api/employees');
            if (res.ok) {
                const data = await res.json();

                // --- SEED INITIAL DATA IF EMPTY ---
                if (data.length === 0) {
                    console.log("DB empty. Seeding initial employees...");
                    // We seed sequentially to preserve order/logic
                    const seeded = [];
                    for (const emp of INITIAL_EMPLOYEES) {
                        try {
                            const seedRes = await fetch('/api/employees', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(emp)
                            });
                            if (seedRes.ok) {
                                const newEmp = await seedRes.json();
                                seeded.push({ ...emp, id: newEmp.id });
                            }
                        } catch (err) {
                            console.error("Error seeding employee:", emp.firstName, err);
                        }
                    }
                    setEmployees(seeded);
                } else {
                    setEmployees(data);
                }
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();

        // --- LOAD ROLES (Keep LocalStorage for now) ---
        const storedRoles = localStorage.getItem('is_roles');
        let parsedRoles = storedRoles ? JSON.parse(storedRoles) : null;

        if (!parsedRoles || !parsedRoles.includes('Supervisor') || !parsedRoles.includes('Prof Com/venta')) {
            parsedRoles = PREDEFINED_ROLES;
            localStorage.setItem('is_roles', JSON.stringify(parsedRoles));
        }
        setRoles(parsedRoles);
    }, []);

    // Persist Employees - REMOVED (Now handled by API)

    // Persist Roles
    useEffect(() => {
        if (!loading && roles.length > 0) {
            localStorage.setItem('is_roles', JSON.stringify(roles));
        }
    }, [roles, loading]);

    // --- Role Management ---
    const addRole = (role) => {
        if (!roles.includes(role)) setRoles(prev => [...prev, role]);
    };

    const deleteRole = (role) => {
        if (role === 'Gerente' || role === 'Puesto Compras') return;
        setRoles(prev => prev.filter(r => r !== role));
    };

    // --- Employee Management ---
    const addEmployee = async (employeeData) => {
        // Optimistic UI
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEmployee)
            });
            if (res.ok) {
                const { id } = await res.json();
                // Update temp ID with real DB ID
                setEmployees(prev => prev.map(e => e.id === tempId ? { ...e, id } : e));
            }
        } catch (err) {
            console.error("Error adding employee:", err);
            // Revert state if needed
        }
    };

    const updateEmployee = async (id, updatedData) => {
        // Optimistic UI
        setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, ...updatedData } : emp));

        try {
            await fetch(`/api/employees/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
        } catch (err) {
            console.error("Error updating employee:", err);
        }
    };

    const deleteEmployee = async (id) => {
        // Optimistic UI
        setEmployees(prev => prev.filter(emp => emp.id !== id));

        try {
            await fetch(`/api/employees/${id}`, { method: 'DELETE' });
        } catch (err) {
            console.error("Error deleting employee:", err);
        }
    };

    // Helper to get consistent display name
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
