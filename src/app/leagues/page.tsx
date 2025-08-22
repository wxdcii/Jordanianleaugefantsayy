'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LeagueService } from '@/lib/firebase/leagueService';
import CreateLeague from '@/components/leagues/CreateLeague';
import JoinLeague from '@/components/leagues/JoinLeague';
import LeagueStandings from '@/components/leagues/LeagueStandings';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

interface League {
  id: string;
  name: string;
  code: string;
  type: string;
  memberCount: number;
  createdAt: Date;
}

export default function LeaguesPage() {
  const { user } = useAuth();
  const [userLeagues, setUserLeagues] = useState<any[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'standings' | 'create' | 'join'>('standings');
  const [loading, setLoading] = useState(true);

  const loadUserLeagues = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const leagues = await LeagueService.getUserLeagues(user.uid);
      setUserLeagues(leagues);
      
      // Select first league by default
      if (leagues.length > 0 && !selectedLeague) {
        setSelectedLeague(leagues[0]);
      }
    } catch (error) {
      console.error('Error loading user leagues:', error);
    } finally {
      setLoading(false);
    }
  }, [user, selectedLeague]);

  useEffect(() => {
    if (user) {
      loadUserLeagues();
    }
  }, [user, loadUserLeagues]);

  const handleLeagueCreated = (league: any) => {
    setUserLeagues(prev => [...prev, league]);
    setSelectedLeague(league);
    setActiveTab('standings');
  };

  const handleLeagueJoined = (league: any) => {
    setUserLeagues(prev => [...prev, league]);
    setSelectedLeague(league);
    setActiveTab('standings');
  };

  if (!user) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center" dir="rtl">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              الدوريات الخاصة
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              يرجى تسجيل الدخول لعرض وإدارة دورياتك.
            </p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              الدوريات الخاصة
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              أنشئ وانضم إلى الدوريات الكلاسيكية الخاصة للتنافس مع الأصدقاء
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="lg:w-1/4">
              {/* Navigation Tabs */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
                  إجراءات الدوري
                </h2>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab('standings')}
                    className={`w-full text-right px-3 py-2 rounded-lg transition-colors ${
                      activeTab === 'standings'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    📊 عرض الترتيب
                  </button>
                  <button
                    onClick={() => setActiveTab('create')}
                    className={`w-full text-right px-3 py-2 rounded-lg transition-colors ${
                      activeTab === 'create'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    ➕ إنشاء دوري
                  </button>
                  <button
                    onClick={() => setActiveTab('join')}
                    className={`w-full text-right px-3 py-2 rounded-lg transition-colors ${
                      activeTab === 'join'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    🔗 انضمام للدوري
                  </button>
                </div>
              </div>

              {/* My Leagues */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
                  دورياتي ({userLeagues.length})
                </h2>
                
                {userLeagues.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
                      لم تنضم إلى أي دوري بعد
                    </p>
                    <div className="space-y-2">
                      <button
                        onClick={() => setActiveTab('create')}
                        className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                      >
                        أنشئ دوريك الأول
                      </button>
                      <button
                        onClick={() => setActiveTab('join')}
                        className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                      >
                        انضم إلى دوري
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {userLeagues.map(league => (
                      <button
                        key={league.id}
                        onClick={() => {
                          setSelectedLeague(league);
                          setActiveTab('standings');
                        }}
                        className={`w-full text-right p-3 rounded-lg border transition-colors ${
                          selectedLeague?.id === league.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                            : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {league.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {league.memberCount} أعضاء • {league.code}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:w-3/4">
              {activeTab === 'standings' && selectedLeague && (
                <LeagueStandings
                  leagueId={selectedLeague.id}
                  leagueName={selectedLeague.name}
                  leagueCode={selectedLeague.code}
                />
              )}

              {activeTab === 'standings' && !selectedLeague && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    لم يتم اختيار دوري
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    اختر دوري من الشريط الجانبي أو أنشئ/انضم إلى دوري جديد لعرض الترتيب.
                  </p>
                  <div className="flex justify-center space-x-4 gap-4">
                    <button
                      onClick={() => setActiveTab('create')}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      إنشاء دوري
                    </button>
                    <button
                      onClick={() => setActiveTab('join')}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      انضمام لدوري
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'create' && (
                <CreateLeague
                  onLeagueCreated={handleLeagueCreated}
                  onCancel={() => setActiveTab('standings')}
                />
              )}

              {activeTab === 'join' && (
                <JoinLeague
                  onLeagueJoined={handleLeagueJoined}
                  onCancel={() => setActiveTab('standings')}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
