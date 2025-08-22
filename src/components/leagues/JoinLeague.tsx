'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LeagueService } from '@/lib/firebase/leagueService';

interface JoinLeagueProps {
  onLeagueJoined?: (league: any) => void;
  onCancel?: () => void;
}

export default function JoinLeague({ onLeagueJoined, onCancel }: JoinLeagueProps) {
  const { user } = useAuth();
  const [leagueCode, setLeagueCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleJoinLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !leagueCode.trim()) {
      setError('Please enter a league code');
      return;
    }

    const code = leagueCode.trim().toUpperCase();
    
    if (code.length !== 6) {
      setError('League code must be 6 characters');
      return;
    }

    setIsJoining(true);
    setError('');
    setSuccess('');

    try {
      // First find the league to get its details
      const league = await LeagueService.findLeagueByCode(code);
      
      // Join the league
      const result = await LeagueService.joinLeague(
        league.id,
        user.uid,
        user.displayName || user.email || 'Unknown Manager',
        `${user.displayName || 'Team'} FC` // Generate a team name
      );
      
      console.log('✅ Joined league:', result);
      
      setSuccess(`Successfully joined league: ${(league as any).name}`);
      
      if (onLeagueJoined) {
        onLeagueJoined(league);
      }
      
      setLeagueCode('');
    } catch (error: any) {
      console.error('❌ Error joining league:', error);
      
      if (error.message.includes('not found')) {
        setError('League not found. Please check the code and try again.');
      } else if (error.message.includes('already a member')) {
        setError('You are already a member of this league.');
      } else if (error.message.includes('full')) {
        setError('This league is full. Cannot join.');
      } else {
        setError('Failed to join league. Please try again.');
      }
    } finally {
      setIsJoining(false);
    }
  };

  const formatCodeInput = (value: string) => {
    // Remove non-alphanumeric characters and convert to uppercase
    return value.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLeagueCode(formatCodeInput(e.target.value));
    setError('');
    setSuccess('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg max-w-md mx-auto" dir="rtl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        الانضمام إلى دوري خاص
      </h2>
      
      <form onSubmit={handleJoinLeague} className="space-y-4">
        <div>
          <label 
            htmlFor="leagueCode" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            كود الدوري
          </label>
          <input
            type="text"
            id="leagueCode"
            value={leagueCode}
            onChange={handleCodeChange}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     text-center text-xl font-mono tracking-widest"
            placeholder="ABC123"
            maxLength={6}
            required
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            أدخل الكود المكون من 6 أحرف من مدير الدوري
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-600 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-600 rounded-lg">
            <p className="text-green-700 dark:text-green-400 text-sm">{success}</p>
          </div>
        )}

        <div className="flex space-x-3 gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white 
                       font-medium py-3 px-4 rounded-lg transition-colors"
            >
              إلغاء
            </button>
          )}
          
          <button
            type="submit"
            disabled={isJoining || leagueCode.length !== 6}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 
                     text-white font-medium py-3 px-4 rounded-lg transition-colors
                     disabled:cursor-not-allowed"
          >
            {isJoining ? 'جاري الانضمام...' : 'انضمام للدوري'}
          </button>
        </div>
      </form>
      
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
          تحتاج كود دوري؟
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          اطلب من صديق أنشأ دوري مسبقاً أن يشاركك الكود المكون من 6 أحرف.
          بمجرد الانضمام، ستتمكن من رؤية ترتيب الدوري والتنافس مع الأعضاء الآخرين.
        </p>
      </div>
    </div>
  );
}
