import React, { createContext, useContext } from 'react';

// CONTEXTO DE PRUEBA ABSOLUTA
const SafeContext = createContext();

export const useSafe = () => useContext(SafeContext);

export const SafeProvider = ({ children }) => {
    console.log("--- SAFE PROVIDER LOADING ---");
    return (
        <SafeContext.Provider value={{ status: 'SAFE' }}>
            {children}
        </SafeContext.Provider>
    );
};
