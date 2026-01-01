import React, { useState, useEffect } from 'react';
import { reportsService, ReportsOverview, AcquisitionStats } from '../services/reports.service';
import { ArrowUp, ArrowDown, TrendingUp, Users, DollarSign, Activity, Loader2 } from 'lucide-react';

const Reports: React.FC = () => {
   const [timeRange, setTimeRange] = useState<number>(30);
   const [isLoading, setIsLoading] = useState(true);
   const [overview, setOverview] = useState<ReportsOverview | null>(null);
   const [acquisition, setAcquisition] = useState<AcquisitionStats | null>(null);

   useEffect(() => {
      fetchReports();
   }, [timeRange]);

   const fetchReports = async () => {
      try {
         setIsLoading(true);
         const [overviewData, acquisitionData] = await Promise.all([
            reportsService.getOverview(timeRange),
            reportsService.getAcquisitionStats()
         ]);
         setOverview(overviewData);
         setAcquisition(acquisitionData);
      } catch (error) {
         console.error('Failed to fetch reports:', error);
      } finally {
         setIsLoading(false);
      }
   };

   if (isLoading) {
      return (
         <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-navy-900" size={32} />
         </div>
      );
   }

   const stats = [
      {
         label: 'Total AUM',
         value: overview?.summary.totalAum || '$0',
         change: `+${overview?.summary.newClientsInPeriod || 0} new clients`,
         isPositive: true
      },
      {
         label: 'Active Clients',
         value: overview?.summary.activeClients.toString() || '0',
         change: `${overview?.summary.leads || 0} leads`,
         isPositive: true
      },
      {
         label: 'Tasks Completed',
         value: overview?.summary.tasksCompleted.toString() || '0',
         change: `${overview?.summary.tasksPending || 0} pending`,
         isPositive: (overview?.summary.tasksPending || 0) < 10
      },
      {
         label: 'New Leads',
         value: overview?.summary.newLeadsInPeriod.toString() || '0',
         change: overview?.period || 'Last 30 days',
         isPositive: true
      },
   ];

   const colorScheme = ['bg-teal-500', 'bg-teal-400', 'bg-navy-800', 'bg-slate-400'];

   return (
      <div className="p-8 h-full flex flex-col animate-fade-in overflow-y-auto">
         <div className="flex justify-between items-center mb-8">
            <div>
               <h2 className="text-2xl font-bold text-navy-900">Performance Insights</h2>
               <p className="text-slate-500 text-sm">Key metrics on portfolio growth and client acquisition.</p>
            </div>
            <select
               value={timeRange}
               onChange={(e) => setTimeRange(parseInt(e.target.value))}
               className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
               <option value={30}>Last 30 Days</option>
               <option value={90}>Quarter to Date</option>
               <option value={365}>Year to Date</option>
            </select>
         </div>

         <div className="grid grid-cols-4 gap-6 mb-8">
            {stats.map((stat, i) => (
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
            {/* Dynamic AUM Chart Area */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-navy-900">AUM Growth (Monthly)</h3>
                  <span className="text-teal-600 text-sm font-medium">{overview?.period}</span>
               </div>
               <div className="h-64 flex items-end justify-between gap-2 px-2 border-b border-slate-100 pb-2">
                  {overview?.aumTrend.map((point, i) => {
                     const maxAum = Math.max(...(overview?.aumTrend.map(p => p.aum) || [1]));
                     const heightPercent = (point.aum / maxAum) * 100;
                     return (
                        <div key={i} className="w-full bg-teal-50 rounded-t-sm relative group h-full flex items-end">
                           <div
                              className="w-full bg-teal-500 rounded-t-sm transition-all duration-500 ease-out group-hover:bg-teal-600"
                              style={{ height: `${heightPercent}%` }}
                           ></div>
                           {/* Tooltip */}
                           <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-navy-900 text-white text-xs px-2 py-1 rounded transition-opacity whitespace-nowrap z-10">
                              ${(point.aum / 1000000).toFixed(1)}M - {point.month}
                           </div>
                        </div>
                     );
                  })}
               </div>
               <div className="flex justify-between mt-4 text-xs text-slate-400 uppercase font-semibold">
                  {overview?.aumTrend.slice(0, 3).map((p, i) => (
                     <span key={i}>{p.month}</span>
                  ))}
               </div>
            </div>

            {/* Acquisition Sources Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-navy-900">Client Acquisition Source</h3>
               </div>
               <div className="h-64 flex items-center justify-center">
                  <div className="w-48 h-48 rounded-full border-[16px] border-slate-100 border-t-teal-500 border-r-teal-400 border-b-navy-800 relative shadow-inner">
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-navy-900">{acquisition?.total || 0}</span>
                        <span className="text-xs text-slate-500 uppercase">New Clients</span>
                     </div>
                  </div>
                  <div className="ml-8 space-y-3">
                     {acquisition?.sources.map((source, i) => (
                        <div key={source.name} className="flex items-center gap-2 text-sm text-slate-600">
                           <div className={`w-3 h-3 rounded-full ${colorScheme[i] || 'bg-slate-400'}`}></div>
                           {source.name} ({source.percentage}%)
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>

         {/* Pipeline Distribution */}
         {overview && overview.pipelineDistribution.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
               <h3 className="font-bold text-navy-900 mb-4">Pipeline Distribution</h3>
               <div className="grid grid-cols-6 gap-4">
                  {overview.pipelineDistribution.map((stage, i) => (
                     <div key={stage.stage} className="text-center p-4 bg-slate-50 rounded-lg">
                        <p className="text-2xl font-bold text-navy-900">{stage.count}</p>
                        <p className="text-xs text-slate-500 mt-1">{stage.stage}</p>
                     </div>
                  ))}
               </div>
            </div>
         )}
      </div>
   );
};

export default Reports;