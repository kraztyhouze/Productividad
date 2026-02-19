import React from 'react';
import { Outlet } from 'react-router-dom';

const TestLayout = () => {
    return (
        <div style={{ padding: 20, border: '5px solid red' }}>
            <h1>TEST LAYOUT ACTIVE</h1>
            <Outlet />
        </div>
    );
};

export default TestLayout;
