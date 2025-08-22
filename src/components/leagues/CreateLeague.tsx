'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LeagueService } from '@/lib/firebase/leagueService';

interface CreateLeagueProps {
  onLeagueCreated?: (league: any) => void;
  onCancel?: () => void;
}

interface GameweekOption {
  gw: number;
  name: string;
  deadline: string;
  isOpen: boolean;
}

export default function CreateLeague({ onLeagueCreated, onCancel }: CreateLeagueProps) {
  const { user } = useAuth();
  const [leagueName, setLeagueName] = useState('');
  const [startGameweek, setStartGameweek] = useState<number>(1);
  const [availableGameweeks, setAvailableGameweeks] = useState<GameweekOption[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingGameweeks, setIsLoadingGameweeks] = useState(true);
  const [error, setError] = useState('');

  // Load available gameweeks on component mount
  useEffect(() => {
    const loadGameweeks = async () => {
      try {
        setIsLoadingGameweeks(true);
        const gameweeks = await LeagueService.getAvailableGameweeks();
        setAvailableGameweeks(gameweeks);
        
        // Set default to current gameweek (first open one) or gameweek 1
        const openGameweek = gameweeks.find(gw => gw.isOpen);
        if (openGameweek) {
          setStartGameweek(openGameweek.gw);
        } else if (gameweeks.length > 0) {
          setStartGameweek(gameweeks[0].gw);
        }
      } catch (error) {
        console.error('Error loading gameweeks:', error);
        setError('Failed to load gameweeks');
      } finally {
        setIsLoadingGameweeks(false);
      }
    };

    loadGameweeks();
  }, []);

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !leagueName.trim()) {
      setError('Please enter a league name');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const league = await LeagueService.createLeague({
        name: leagueName.trim(),
        createdBy: user.uid,
        adminName: user.displayName || user.email || 'Unknown Manager',
        startGameweek: startGameweek
      });
      
      console.log('✅ League created:', league);
      
      if (onLeagueCreated) {
        onLeagueCreated(league);
      }
      
      setLeagueName('');
    } catch (error) {
      console.error('❌ Error creating league:', error);
      setError('Failed to create league. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg max-w-md mx-auto" dir="rtl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        إنشاء دوري خاص
      </h2>
      
      <form onSubmit={handleCreateLeague} className="space-y-4">
        <div>
          <label 
            htmlFor="leagueName" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            اسم الدوري
          </label>
          <input
            type="text"
            id="leagueName"
            value={leagueName}
            onChange={(e) => setLeagueName(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
            placeholder="أدخل اسم دوريك..."
            maxLength={50}
            required
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            اختر اسماً يمكن لأصدقائك التعرف عليه
          </p>
        </div>

        <div>
          <label 
            htmlFor="startGameweek" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            الجولة التي يبدأ منها حساب النقاط
          </label>
          {isLoadingGameweeks ? (
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
              <p className="text-gray-600 dark:text-gray-400">جاري تحميل الجولات...</p>
            </div>
          ) : (
            <select
              id="startGameweek"
              value={startGameweek}
              onChange={(e) => setStartGameweek(Number(e.target.value))}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
              required
            >
              {availableGameweeks.map(gw => (
                <option key={gw.gw} value={gw.gw}>
                  الجولة {gw.gw} {gw.isOpen ? '(جولة حالية)' : '(مكتملة)'}
                </option>
              ))}
            </select>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            النقاط السابقة لهذه الجولة لن تُحسب في ترتيب الدوري
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-600 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
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
            disabled={isCreating || !leagueName.trim() || isLoadingGameweeks}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                     text-white font-medium py-3 px-4 rounded-lg transition-colors
                     disabled:cursor-not-allowed"
          >
            {isCreating ? 'جاري الإنشاء...' : 'إنشاء الدوري'}
          </button>
        </div>
      </form>
      
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          كيف يعمل:
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• ستحصل على كود انضمام فريد مكون من 6 أحرف</li>
          <li>• شارك هذا الكود مع الأصدقاء للانضمام لدوريك</li>
          <li>• يتم تحديث الترتيب تلقائياً كل أسبوع</li>
          <li>• نظام نقاط كلاسيكي يعتمد على مجموع النقاط من الجولة المحددة</li>
          <li>• يمكنك اختيار الجولة التي يبدأ منها حساب النقاط</li>
        </ul>
      </div>
    </div>
  );
}
