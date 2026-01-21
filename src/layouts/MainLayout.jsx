import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const MainLayout = () => {
    // State for sidebar expansion using the same logic as DashboardLayout
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="flex bg-slate-950 min-h-screen font-sans text-slate-50 selection:bg-blue-500/30">
            {/* Modular Sidebar */}
            <Sidebar expanded={expanded} setExpanded={setExpanded} />

            {/* Main Content Area */}
            <main className={`flex-1 p-6 lg:p-10 transition-all duration-300 ${expanded ? 'ml-64' : 'ml-20'}`}>
                <div className="max-w-[1920px] mx-auto animate-in fade-in duration-500">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
