import React, { createContext, useContext, useState, useEffect } from 'react';
import { useStore } from './StoreContext';

/* 
   GLOBAL PRODUCTIVITY CONTEXT (Clean Slate)
   - Reemplazo seguro para evitar crashes.
*/

const GlobalProductivityContext = createContext(null);

export const useProductivity = () => {
    const context = useContext(GlobalProductivityContext);
    if (!context) {
        return {
            activeSession: null, sessionsHistory: [], loading: false,
            startSession: async () => { }, endSession: async () => { },
            getSessionDuration: () => '0h 0m',
            isShopping: false,
            shoppingStartTime: null,
            toggleShoppingPause: () => { },
            getShoppingDuration: () => '0m',
            dailyRecords: [],
            dailyGroups: {},
            activeSessions: [],
            closedDays: {}
        };
    }
    return context;
};

export const ProductivityProvider = ({ children }) => {
    console.log("--- GlobalProductivityProvider Mounting ---");
    const { currentStore } = useStore();

    // Estado seguro
    const [activeSession, setActiveSession] = useState(null);
    const [sessionsHistory, setSessionsHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    // Shopping state
    const [isShopping, setIsShopping] = useState(false);
    const [shoppingStartTime, setShoppingStartTime] = useState(null);

    // Dashboard required state
    const [dailyRecords, setDailyRecords] = useState([]);
    const [dailyGroups, setDailyGroups] = useState({});
    const [activeSessions, setActiveSessions] = useState([]);
    const [closedDays, setClosedDays] = useState({});

    // Placeholder functions
    const startSession = async () => { };
    const endSession = async () => { };
    const toggleShoppingPause = () => { };

    const getSessionDuration = () => '0h 0m';
    const getShoppingDuration = () => '0m';

    const value = {
        activeSession,
        sessionsHistory,
        loading,
        startSession,
        endSession,
        getSessionDuration,
        isShopping,
        shoppingStartTime,
        toggleShoppingPause,
        getShoppingDuration,
        dailyRecords,
        dailyGroups,
        activeSessions,
        closedDays
    };

    return (
        <GlobalProductivityContext.Provider value={value}>
            {children}
        </GlobalProductivityContext.Provider>
    );
};
