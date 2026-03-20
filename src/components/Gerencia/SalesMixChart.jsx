import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SalesMixChart = ({ data }) => {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                    <XAxis type="number" hide />
                    <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#4A5568', fontSize: 11, fontWeight: 500 }} 
                        width={100}
                    />
                    <Tooltip 
                        cursor={{ fill: '#F7FAFC' }}
                        contentStyle={{ 
                            borderRadius: '16px', 
                            border: 'none', 
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                            fontSize: '12px'
                        }} 
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} />
                    <Bar 
                        dataKey="standard" 
                        stackId="a" 
                        fill="#CBD5E0" 
                        name="Común" 
                        radius={[0, 0, 0, 0]} 
                        barSize={12}
                    />
                    <Bar 
                        dataKey="jewelry" 
                        stackId="a" 
                        fill="#FF8C9D" 
                        name="Joyería" 
                        radius={[0, 0, 0, 0]} 
                    />
                    <Bar 
                        dataKey="recoverable" 
                        stackId="a" 
                        fill="#F6E05E" 
                        name="Recuperable" 
                        radius={[0, 10, 10, 0]} 
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SalesMixChart;
