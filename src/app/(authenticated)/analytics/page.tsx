'use client';

import React, { useEffect, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, MousePointerClick, Eye, DollarSign } from 'lucide-react';

interface ActivityGraph {
  name: string;
  views: number;
  engagements: number;
}

interface AnalyticsData {
  impressions: number;
  engagements: number;
  profileClicks: number;
  followerCount: number;
  adRevenueBalance: number;
  subscription: string;
  activityGraph: ActivityGraph[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/analytics')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch analytics');
        return res.json();
      })
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-64 text-[var(--muted)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-red-500">
        {error || 'Failed to load data.'}
      </div>
    );
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Account Analytics</h1>
        <p className="text-[var(--muted)]">Track your performance and monetization over the last 7 days.</p>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className={`grid grid-cols-1 md:grid-cols-2 ${(data.subscription !== 'FREE' || data.adRevenueBalance > 0) ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6 mb-8`}
      >
        <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col justify-between hover:border-[var(--accent)] transition-colors cursor-default">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-[var(--muted)] font-medium text-sm">Impressions</h2>
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-full"><Eye size={18} /></div>
          </div>
          <div>
            <div className="text-3xl font-bold">{data.impressions.toLocaleString()}</div>
            <div className="mt-2 text-sm text-green-500 flex items-center gap-1 font-medium">
              <TrendingUp size={14} /> +12% from last week
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col justify-between hover:border-[var(--accent)] transition-colors cursor-default">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-[var(--muted)] font-medium text-sm">Engagements</h2>
            <div className="p-2 bg-purple-500/10 text-purple-500 rounded-full"><MousePointerClick size={18} /></div>
          </div>
          <div>
            <div className="text-3xl font-bold">{data.engagements.toLocaleString()}</div>
            <div className="mt-2 text-sm text-[var(--muted)] flex items-center gap-1">
              {(data.impressions > 0 ? (data.engagements / data.impressions * 100).toFixed(1) : '0')}% engagement rate
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col justify-between hover:border-[var(--accent)] transition-colors cursor-default">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-[var(--muted)] font-medium text-sm">Followers</h2>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-full"><Users size={18} /></div>
          </div>
          <div>
            <div className="text-3xl font-bold">{data.followerCount.toLocaleString()}</div>
          </div>
        </motion.div>

        {(data.subscription !== 'FREE' || data.adRevenueBalance > 0) && (
          <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col justify-between border-emerald-500/30 hover:border-emerald-500 transition-colors cursor-default" style={{ background: 'linear-gradient(to bottom right, var(--card-bg), rgba(16, 185, 129, 0.05))' }}>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-[var(--muted)] font-medium text-sm">Ad Revenue</h2>
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-full"><DollarSign size={18} /></div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-400">${data.adRevenueBalance.toFixed(2)}</div>
              <div className="mt-2 text-sm text-[var(--muted)] flex items-center gap-1">
                Pending Payout
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 24 }}
        className="glass-panel p-6 md:p-8 mt-2"
      >
        <div className="mb-6">
          <h2 className="text-lg font-bold">Activity Overview</h2>
          <p className="text-sm text-[var(--muted)]">Total impressions over the last 7 days</p>
        </div>
        
        <div className="h-72 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.activityGraph} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--card-border)" />
              <XAxis dataKey="name" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val >= 1000 ? `${val/1000}k` : val} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', borderRadius: '12px', color: 'var(--foreground)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                itemStyle={{ color: 'var(--foreground)' }}
              />
              <Area type="monotone" dataKey="views" name="Impressions" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
