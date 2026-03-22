import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import MobileNavbar from '../components/MobileNavbar';
import MobileTopBar from '../components/MobileTopBar';

const MainLayout = () => {
    const [expanded, setExpanded] = useState(true);
    const [isMobile, setIsMobile] = React.useState(window.innerWidth < 1024);

    React.useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) setExpanded(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="flex bg-[#F4F7FA] min-h-screen font-sans text-[#1A365D]">
            {/* Sidebar - Hidden on extreme mobile, mini on tablet */}
            {!isMobile && <Sidebar expanded={expanded} setExpanded={setExpanded} />}

            {/* Mobile Navigation Bars (Agenda oriented) */}
            {isMobile && (
                <>
                    <MobileTopBar />
                    <MobileNavbar />
                </>
            )}

            {/* Main Content Area */}
            <main
                className="flex-1 transition-all duration-300 min-h-screen overflow-x-hidden"
                style={{ 
                    marginLeft: isMobile ? 0 : (expanded ? 'var(--sidebar-width)' : 'var(--sidebar-collapsed)'),
                    paddingBottom: isMobile ? '80px' : '0',
                    paddingTop: isMobile ? '64px' : '0' 
                }}
            >
                <div className="max-w-[1920px] mx-auto p-4 lg:p-8 animate-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
