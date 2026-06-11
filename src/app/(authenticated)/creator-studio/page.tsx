'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface CreatorData {
  adRevenueBalance: number;
  subscription: string;
}

export default function CreatorStudioPage() {
  const [data, setData] = useState<CreatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/analytics')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch creator data');
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

  const handleCashOut = () => {
    alert('Cash out request submitted successfully!');
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-zinc-500">
        Loading Creator Studio...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center text-red-500">
        {error || 'Failed to load data.'}
      </div>
    );
  }

  const isEligible = data.subscription === 'SILVER' || data.subscription === 'GOLD';

  if (!isEligible) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto w-full text-center mt-12">
        <div className="inline-block p-6 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full shadow-sm">
          <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
          <h1 className="text-2xl font-bold mb-3">Upgrade to Creator Studio</h1>
          <p className="text-zinc-500 mb-6">
            Get access to Ad Revenue Sharing and Super Followers by upgrading to a Silver or Gold subscription.
          </p>
          <Link href="/settings" className="block w-full py-3 px-4 bg-black dark:bg-white text-white dark:text-black font-bold rounded-full hover:opacity-90 transition-opacity">
            Upgrade Subscription
          </Link>
        </div>
      </div>
    );
  }

  // Mock subscribers
  const mockSubscribers = [
    { id: 1, name: 'Alice', username: 'alice123', amount: '$4.99' },
    { id: 2, name: 'Bob', username: 'bob_dev', amount: '$4.99' },
    { id: 3, name: 'Charlie', username: 'charlie_ux', amount: '$9.99' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
      <h1 className="text-2xl font-bold mb-2">Creator Studio</h1>
      <p className="text-zinc-500 mb-8">Manage your revenue and super followers.</p>

      {/* Ad Revenue Section */}
      <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl mb-8">
        <h2 className="text-xl font-bold mb-4">Ad Revenue Sharing</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-500 mb-1">Current Balance</p>
            <div className="text-4xl font-black">${data.adRevenueBalance.toFixed(2)}</div>
          </div>
          <button 
            onClick={handleCashOut}
            className="py-2 px-6 bg-blue-500 text-white font-bold rounded-full hover:bg-blue-600 transition-colors"
          >
            Cash out
          </button>
        </div>
      </div>

      {/* Super Followers Section */}
      <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl">
        <h2 className="text-xl font-bold mb-4">Super Followers</h2>
        <p className="text-sm text-zinc-500 mb-6">Your most dedicated supporters.</p>
        
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {mockSubscribers.map(sub => (
            <div key={sub.id} className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center font-bold text-zinc-500">
                  {sub.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold">{sub.name}</div>
                  <div className="text-sm text-zinc-500">@{sub.username}</div>
                </div>
              </div>
              <div className="font-bold text-green-500">
                {sub.amount}/mo
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
