import React from 'react';
import { 
    ResponsiveContainer, 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    BarChart, 
    Bar, 
    Cell,
    Legend
} from 'recharts';

export const ProductivityTrendChart = ({ data }) => (
    <div className="h-[300px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1A365D" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#1A365D" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 900, fill: '#94A3B8' }} 
                    dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={false} />
                <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 900 }}
                    itemStyle={{ color: '#1A365D' }}
                />
                <Area 
                    type="monotone" 
                    dataKey="productividad" 
                    stroke="#1A365D" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorProd)" 
                    animationDuration={1500}
                />
            </AreaChart>
        </ResponsiveContainer>
    </div>
);

export const SalesMixChart = ({ data }) => (
    <div className="h-[300px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 900, fill: '#94A3B8' }} 
                    dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={false} />
                <Tooltip 
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 900 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', paddingTop: '20px' }} />
                <Bar dataKey="standard" name="ESTÁNDAR" stackId="a" fill="#1A365D" radius={[0, 0, 0, 0]} />
                <Bar dataKey="jewelry" name="JOYERÍA" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="recoverable" name="RECUPERABLE" stackId="a" fill="#60A5FA" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    </div>
);
