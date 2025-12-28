import React, { useState } from 'react';
import { ArrowUp, ArrowDown, TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

const Reports: React.FC = () => {
  const [timeRange, setTimeRange] = useState('Last 30 Days');

  // Mock data generator based on range
  const getGraphData = (range: string) => {
    switch (range) {
      case 'Last 30 Days':
        return [40, 45, 35, 50, 55, 60, 58, 65, 70, 75, 72, 80];
      case 'Quarter to Date':
        return [60, 65, 62, 70, 78, 85, 82, 88, 90, 95, 92, 98];
      case 'Year to Date':
        return [30, 35, 40, 45, 42, 50, 55, 60, 65, 68, 70, 75];
      default:
        return [40, 45, 35, 50, 55, 60, 58, 65, 70, 75, 72, 80];
    }
  };

  const getStats = (range: string) => {
    switch (range) {
      case 'Last 30 Days':
        return { assets: '$2.4M', assetsChange: '+12%', retention: '98.2%', return: '6.8%' };
      case 'Quarter to Date':
        return { assets: '$5.8M', assetsChange: '+8%', retention: '99.1%', return: '7.2%' };
      case 'Year to Date':
        return { assets: '$12.1M', assetsChange: '+15%', retention: '97.5%', return: '8.4%' };
      default:
        return { assets: '$2.4M', assetsChange: '+12%', retention: '98.2%', return: '6.8%' };
    }
  };

  const graphData = getGraphData(timeRange);
  const stats = getStats(timeRange);

  return (
    <div className="p-8 h-full flex flex-col animate-fade-in overflow-y-auto">
       <div className="flex justify-between items-center mb-8">
        <div>
           <h2 className="text-2xl font-bold text-navy-900">Performance Insights</h2>
           <p className="text-slate-500 text-sm">Key metrics on portfolio growth and client acquisition.</p>
        </div>
        <select 
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
        >
           <option>Last 30 Days</option>
           <option>Quarter to Date</option>
           <option>Year to Date</option>
        </select>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
         {[
            { label: 'Net New Assets', value: stats.assets, change: stats.assetsChange, isPositive: true },
            { label: 'Client Retention', value: stats.retention, change: '+0.5%', isPositive: true },
            { label: 'Avg. Portfolio Return', value: stats.return, change: '-1.2%', isPositive: false },
            { label: 'New Households', value: '14', change: '+4', isPositive: true },
         ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
               <p className="text-sm font-medium text-slate-500">{stat.label}</p>
               <div className="flex items-end justify-between mt-2">
                  <h3 className="text-2xl font-bold text-navy-900">{stat.value}</h3>
                  <span className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${stat.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                     {stat.isPositive ? <ArrowUp size={12} className="mr-1" /> : <ArrowDown size={12} className="mr-1" />}
                     {stat.change}
                  </span>
               </div>
            </div>
         ))}
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
         {/* Dynamic Chart Area */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-navy-900">AUM Growth ({timeRange === 'Last 30 Days' ? 'Monthly' : 'Period'})</h3>
               <button className="text-teal-600 text-sm font-medium hover:underline">View Details</button>
            </div>
            <div className="h-64 flex items-end justify-between gap-2 px-2 border-b border-slate-100 pb-2">
               {graphData.map((h, i) => (
                  <div key={i} className="w-full bg-teal-50 rounded-t-sm relative group h-full flex items-end">
                     <div 
                        className="w-full bg-teal-500 rounded-t-sm transition-all duration-500 ease-out group-hover:bg-teal-600" 
                        style={{ height: `${h}%` }}
                     ></div>
                     {/* Tooltip hint */}
                     <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-navy-900 text-white text-xs px-2 py-1 rounded transition-opacity whitespace-nowrap z-10">
                        ${h}M Assets
                     </div>
                  </div>
               ))}
            </div>
            <div className="flex justify-between mt-4 text-xs text-slate-400 uppercase font-semibold">
               <span>Start</span><span>Mid</span><span>End</span>
            </div>
         </div>

         {/* Mock Chart Area 2 */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-navy-900">Client Acquisition Source</h3>
            </div>
            <div className="h-64 flex items-center justify-center">
               <div className="w-48 h-48 rounded-full border-[16px] border-slate-100 border-t-teal-500 border-r-teal-400 border-b-navy-800 relative shadow-inner">
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <span className="text-3xl font-bold text-navy-900">14</span>
                     <span className="text-xs text-slate-500 uppercase">New Clients</span>
                  </div>
               </div>
               <div className="ml-8 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                     <div className="w-3 h-3 rounded-full bg-teal-500"></div> Referrals (45%)
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                     <div className="w-3 h-3 rounded-full bg-teal-400"></div> Workshops (30%)
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                     <div className="w-3 h-3 rounded-full bg-navy-800"></div> Website (25%)
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Reports;