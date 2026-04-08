import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, CheckCircle, Activity, Globe } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalScans: 0,
    flaggedScans: 0,
    trustedScans: 0,
    recentAlerts: []
  });

  // Mocked for MVP demo if API not fully populated
  const data = [
    { name: 'Trusted', count: 42, color: '#22c55e' },
    { name: 'Suspicious', count: 12, color: '#f59e0b' },
    { name: 'Counterfeit', count: 5, color: '#ef4444' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header>
        <h1 className="text-4xl font-bold text-white mb-2">Network Overview</h1>
        <p className="text-gray-400">Real-time anti-counterfeiting telemetry from the global scan network.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Scans', value: '1,284', icon: Globe, color: 'text-primary' },
          { label: 'Verified Authentic', value: '1,210', icon: CheckCircle, color: 'text-success' },
          { label: 'Flagged Threats', value: '42', icon: AlertTriangle, color: 'text-danger' },
          { label: 'Nodes Active', value: '8', icon: Activity, color: 'text-warning' },
        ].map((stat, i) => (stat && (
          <div key={i} className="glass p-6 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">{stat.label}</span>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="text-3xl font-bold text-white">{stat.value}</div>
          </div>
        )))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-white">
        {/* Risk Distribution Chart */}
        <div className="glass p-8 rounded-3xl border border-white/10">
          <h2 className="text-xl font-semibold mb-6">Risk Score Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Alerts Feed */}
        <div className="glass p-8 rounded-3xl border border-white/10 flex flex-col">
          <h2 className="text-xl font-semibold mb-6 text-white">Live Alert Stream</h2>
          <div className="space-y-4 flex-1 overflow-auto max-h-[300px] pr-2 custom-scrollbar">
            {[
              { id: '1', product: 'PH-2024-X4', type: 'IMPOSSIBLE TRAVEL', status: 'Counterfeit', time: '2 mins ago', color: 'bg-danger/10 text-danger' },
              { id: '2', product: 'LW-0099', type: 'CONFLICTING DEVICE', status: 'Suspicious', time: '14 mins ago', color: 'bg-warning/10 text-warning' },
              { id: '3', product: 'MS-442', type: 'MANUAL FLAG', status: 'Counterfeit', time: '1h ago', color: 'bg-danger/10 text-danger' },
              { id: '1', product: 'PH-2024-X4', type: 'IMPOSSIBLE TRAVEL', status: 'Counterfeit', time: '2 mins ago', color: 'bg-danger/10 text-danger' },
              { id: '2', product: 'LW-0099', type: 'CONFLICTING DEVICE', status: 'Suspicious', time: '14 mins ago', color: 'bg-warning/10 text-warning' },
            ].map((alert, i) => (alert && (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-4 text-white">
                  <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${alert.color}`}>
                    {alert.status}
                  </div>
                  <div>
                    <div className="font-medium text-sm text-white">{alert.product}</div>
                    <div className="text-xs text-gray-500">{alert.type}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">{alert.time}</div>
              </div>
            )))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
