'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  Users, 
  ShieldAlert, 
  MessageSquare, 
  DollarSign, 
  ArrowUpRight,
  Filter
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getAdminAnalytics } from '@/app/actions/admin'

export default function AdminAnalytics() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    getAdminAnalytics().then(setData)
  }, [])

  if (!data) return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-slate-200 rounded-2xl"></div>
        <div className="h-4 w-32 bg-slate-200 rounded-full"></div>
      </div>
    </div>
  )

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Command Center</h1>
          <p className="text-slate-500 font-medium">Real-time marketplace insights and activity.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" className="rounded-xl"><Filter className="w-4 h-4 mr-2" /> Last 30 Days</Button>
           <Button variant="primary" size="sm" className="rounded-xl">Export Report</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: `$${data.stats.totalGmv.toLocaleString()}`, icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
          { label: 'Active Users', value: data.stats.activeUsers.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
          { label: 'Pending Verification', value: data.stats.pendingVerifications, icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
          { label: 'Open Tickets', value: data.stats.openTickets, icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
        ].map((stat, i) => (
          <Card key={i} className="p-6 border-none shadow-sm group hover:shadow-xl transition-all duration-300">
             <div className="flex justify-between items-start mb-4">
                <div className={cn("p-3 rounded-2xl", stat.bg)}>
                   <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
                <div className="flex items-center gap-1 text-emerald-500 text-xs font-black bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-widest">
                   +12% <ArrowUpRight className="w-3 h-3" />
                </div>
             </div>
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
             <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</h3>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <Card className="lg:col-span-2 p-8 border-none shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-8">
             <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Revenue Stream</h3>
             <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.sales}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} 
                  itemStyle={{fontSize: '12px', fontWeight: 900, color: '#4f46e5'}}
                />
                <Area type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Categories Chart */}
        <Card className="p-8 border-none shadow-sm flex flex-col">
           <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-8">Top Categories</h3>
           <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.categories} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[0, 10, 10, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
           </div>
        </Card>
      </div>
    </div>
  )
}

function cn(...inputs: any[]) {
   return inputs.filter(Boolean).join(' ')
}
