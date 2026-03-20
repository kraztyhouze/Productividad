import React from 'react';
import { RadialBarChart, RadialBar, Tooltip, Legend, ResponsiveContainer, PolarAngleAxis } from 'recharts';

const XPGoalsChart = ({ data }) => {
    // data example: [ { name: 'Meta Diaria', value: 85, fill: '#FF8C9D' } ]
    return (
        <div className="h-[300px] w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                    cx="50%" 
                    cy="50%" 
                    innerRadius="40%" 
                    outerRadius="80%" 
                    barSize={15} 
                    data={data}
                    startAngle={180}
                    endAngle={-180}
                >
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar 
                        minAngle={15} 
                        background={{ fill: '#EDF2F7', opacity: 0.1 }}
                        clockWise 
                        dataKey="value" 
                        cornerRadius={10}
                    />
                    <Tooltip 
                        contentStyle={{ 
                            borderRadius: '16px', 
                            border: 'none', 
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                            fontSize: '12px'
                        }} 
                    />
                    <Legend 
                        iconSize={10} 
                        layout="vertical" 
                        verticalAlign="middle" 
                        align="right" 
                        wrapperStyle={{ fontSize: '11px', color: '#718096' }}
                    />
                </RadialBarChart>
            </ResponsiveContainer>
            
            {/* Center Summary */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center -ml-8">
                <div className="text-2xl font-bold font-mono text-slate-800">
                    {data[0]?.value}%
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                    Meta Productividad
                </div>
            </div>
        </div>
    );
};

export default XPGoalsChart;
