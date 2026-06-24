import React, { createContext, useContext, useState, useEffect } from 'react';

/* 
   GLOBAL STORE CONTEXT (Reemplazo de StoreContext.jsx maldito)
   - Lógica segura de localStorage
   - Sin dependencias externas
*/

const GlobalStoreContext = createContext();

export const useStore = () => {
    const context = useContext(GlobalStoreContext);
    if (!context) {
        // Safe fallback en caso de error de uso fuera del provider
        return { currentStore: null };
    }
    return context;
};

export const StoreProvider = ({ children }) => {
    console.log("--- GlobalStoreProvider Mounting ---");

    const [stores, setStores] = useState([]);
    const [loadingStores, setLoadingStores] = useState(true);

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const res = await fetch('/api/stores');
                if (res.ok) {
                    const data = await res.json();
                    setStores(data);
                } else {
                    setStores([
                        { id: 'store_2', name: 'Sevilla 1', color: 'from-emerald-600 to-emerald-800' },
                        { id: 'store_1', name: 'Sevilla 2', color: 'from-blue-600 to-blue-800' }
                    ]);
                }
            } catch (e) {
                console.error("Error loading stores:", e);
                setStores([
                    { id: 'store_2', name: 'Sevilla 1', color: 'from-emerald-600 to-emerald-800' },
                    { id: 'store_1', name: 'Sevilla 2', color: 'from-blue-600 to-blue-800' }
                ]);
            } finally {
                setLoadingStores(false);
            }
        };
        fetchStores();
    }, []);

    // Inicialización segura del estado
    const [currentStore, setCurrentStore] = useState(() => {
        try {
            const saved = localStorage.getItem('tiktak_current_store');
            return saved || 'store_1'; // Default a store_1 si no hay nada
        } catch (e) {
            console.error("Error reading LS for store", e);
            return 'store_1';
        }
    });

    const selectStore = (id) => {
        try {
            setCurrentStore(id);
            localStorage.setItem('tiktak_current_store', id);
        } catch (e) {
            console.error("Error writing LS for store", e);
        }
    };

    const clearStore = () => {
        try {
            setCurrentStore(null);
            localStorage.removeItem('tiktak_current_store');
        } catch (e) {
            console.error("Error clearing store", e);
        }
    };

    const value = {
        currentStore,
        selectStore,
        clearStore,
        stores,
        loadingStores,
        selectedStoreData: stores.find(s => s.id === currentStore)
    };

    return (
        <GlobalStoreContext.Provider value={value}>
            {children}
        </GlobalStoreContext.Provider>
    );
};
