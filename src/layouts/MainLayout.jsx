import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const MainLayout = () => {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="flex bg-[#F4F7FA] min-h-screen font-sans text-[#1A365D]">
            {/* Modular Sidebar */}
            <Sidebar expanded={expanded} setExpanded={setExpanded} />

            {/* Main Content Area */}
            <main
                className="flex-1 transition-all duration-300 min-h-screen"
                style={{ marginLeft: expanded ? 'var(--sidebar-width)' : 'var(--sidebar-collapsed)' }}
            >
                <div className="max-w-[1920px] mx-auto p-6 lg:p-8 animate-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
