import React from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ProductivityTrendChart = ({ data }) => {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data}>
                    <defs>
                        <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FF8C9D" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#FF8C9D" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#718096', fontSize: 10 }} 
                        dy={10}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#718096', fontSize: 10 }}
                    />
                    <Tooltip 
                        contentStyle={{ 
                            borderRadius: '16px', 
                            border: 'none', 
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                            fontSize: '12px'
                        }} 
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px' }} />
                    <Area 
                        type="monotone" 
                        dataKey="productividad" 
                        stroke="none" 
                        fillOpacity={1} 
                        fill="url(#colorProd)" 
                        name="Rendimiento Global"
                    />
                    <Line 
                        type="monotone" 
                        dataKey="productividad" 
                        stroke="#FF8C9D" 
                        strokeWidth={4} 
                        dot={{ fill: '#FF8C9D', r: 4, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        name="Evolución Emp."
                    />
                    <Line 
                        type="monotone" 
                        dataKey="tiempo_tienda" 
                        stroke="#4299E1" 
                        strokeWidth={2} 
                        strokeDasharray="5 5"
                        dot={false}
                        name="Tiempo Tienda (h)"
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ProductivityTrendChart;
