'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LeagueService } from '@/lib/firebase/leagueService';
import UserSquadModalNew from '@/components/UserSquadModalNew';
import { useGameweek } from '@/contexts/GameweekContext';

interface LeagueStandingsProps {
  leagueId: string;
  leagueName: string;
  leagueCode: string;
}

interface StandingsMember {
  id: string;
  userId: string;
  teamName: string;
  managerName: string;
  totalPoints: number;
  lastGameweekPoints: number;
  currentRank: number;
  previousRank: number;
  movement: number;
}

export default function LeagueStandings({ leagueId, leagueName, leagueCode }: LeagueStandingsProps) {
  const [standings, setStandings] = useState<any[]>([]);
  const [leagueDetails, setLeagueDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Modal state for squad viewing
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { currentGameweek } = useGameweek();

  const loadStandings = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      // Load both standings and league details
      const [standingsData, leagueData] = await Promise.all([
        LeagueService.getLeagueStandings(leagueId),
        LeagueService.getLeagueDetails(leagueId)
      ]);
      
      setStandings(standingsData);
      setLeagueDetails(leagueData);
    } catch (error) {
      console.error('Error loading standings:', error);
      setError('Failed to load league standings');
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    loadStandings();
  }, [loadStandings]);

    const copyToClipboard = () => {
    navigator.clipboard.writeText(leagueCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Function to handle user click and open squad modal
  const handleUserClick = (user: any) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  // Function to close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const getPositionColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600 font-bold'; // Gold
    if (rank === 2) return 'text-gray-500 font-bold'; // Silver
    if (rank === 3) return 'text-amber-600 font-bold'; // Bronze
    return 'text-gray-800 dark:text-gray-200';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg" dir="rtl">
        <div className="text-red-600 dark:text-red-400 text-center">
          <p>{error}</p>
          <button
            onClick={loadStandings}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            حاول مرة أخرى
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden" dir="rtl">
      {/* League Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{leagueName}</h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-blue-100">{standings.length} أعضاء</p>
              {leagueDetails?.startGameweek && (
                <p className="text-blue-100 text-sm">
                  • يبدأ من الجولة {leagueDetails.startGameweek}
                </p>
              )}
            </div>
          </div>
          <div className="text-left">
            <p className="text-sm text-blue-100 mb-1">كود الدوري</p>
            <div className="flex items-center space-x-2 gap-2">
              <button
                onClick={copyToClipboard}
                className="p-2 bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors"
                title="نسخ كود الدوري"
              >
                {copySuccess ? '✓' : '📋'}
              </button>
              <span className="font-mono text-xl font-bold">{leagueCode}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Standings Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                الترتيب
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                المدرب
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                الفريق
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                مجموع النقاط
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                نقاط الجولة
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
            {standings.map((member, index) => (
              <tr 
                key={member.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => handleUserClick(member)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center justify-end">
                    {member.currentRank <= 3 && (
                      <span className="mr-2">
                        {member.currentRank === 1 && '👑'}
                        {member.currentRank === 2 && '🥈'}
                        {member.currentRank === 3 && '🥉'}
                      </span>
                    )}
                    <span className={`text-lg font-medium ${getPositionColor(member.currentRank)}`}>
                      {member.currentRank}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {member.managerName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {member.teamName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {member.totalPoints}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {member.lastGameweekPoints || 0}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {standings.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            لا يوجد أعضاء في هذا الدوري بعد.
          </p>
        </div>
      )}

      {/* Refresh Button */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700 text-center">
        <button
          onClick={loadStandings}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          🔄 تحديث الترتيب
        </button>
      </div>

      {/* Squad Modal */}
      {isModalOpen && selectedUser && (
        <UserSquadModalNew
          isOpen={isModalOpen}
          userId={selectedUser.userId}
          userName={selectedUser.managerName}
          userRank={selectedUser.currentRank}
          totalPoints={selectedUser.totalPoints}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
