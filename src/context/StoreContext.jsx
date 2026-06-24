import React, { createContext, useContext, useState, useEffect } from 'react';

const StoreContext = createContext();

export const useStore = () => {
    return useContext(StoreContext);
};

export const StoreProvider = ({ children }) => {
    const [stores, setStores] = useState([]);
    const [loadingStores, setLoadingStores] = useState(true);
    const [currentStore, setCurrentStore] = useState(() => {
        // Intentar recuperar la selección guardada al iniciar
        return localStorage.getItem('tiktak_current_store');
    });

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

    const selectStore = (storeId) => {
        setCurrentStore(storeId);
        localStorage.setItem('tiktak_current_store', storeId);
    };

    const clearStore = () => {
        setCurrentStore(null);
        localStorage.removeItem('tiktak_current_store');
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
        <StoreContext.Provider value={value}>
            {children}
        </StoreContext.Provider>
    );
};
