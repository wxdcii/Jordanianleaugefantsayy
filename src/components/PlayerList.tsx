'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Player = {
  id: string;
  name: string;
  nameAr: string;
  position: 'GKP' | 'DEF' | 'MID' | 'FWD';
  team: string;
  teamAr: string;
  price: number;
  points: number;
  selected: boolean;
  captain: boolean;
  viceCaptain: boolean;
  jerseyColor: string;
  teamLogo: string;
};

type PlayerListProps = {
  players: Player[];
  language: 'en' | 'ar';
  onCaptainSelect?: (playerId: string) => void;
  onViceCaptainSelect?: (playerId: string) => void;
  captain?: string;
  viceCaptain?: string;
};

export default function PlayerList({
  players,
  language,
  onCaptainSelect,
  onViceCaptainSelect,
  captain,
  viceCaptain
}: PlayerListProps) {
  const [positionFilter, setPositionFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'points'>('points');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedOnly, setSelectedOnly] = useState(false);

  const filteredAndSortedPlayers = useMemo(() => {
    let filtered = players;

    // Filter by position
    if (positionFilter !== 'ALL') {
      filtered = filtered.filter(player => player.position === positionFilter);
    }

    // Filter by selection status
    if (selectedOnly) {
      filtered = filtered.filter(player => player.selected);
    }

    // Sort players
    const sorted = [...filtered].sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'name':
          const nameA = language === 'ar' ? a.nameAr : a.name;
          const nameB = language === 'ar' ? b.nameAr : b.name;
          compareValue = nameA.localeCompare(nameB);
          break;
        case 'price':
          compareValue = a.price - b.price;
          break;
        case 'points':
          compareValue = a.points - b.points;
          break;
      }

      return sortOrder === 'desc' ? -compareValue : compareValue;
    });

    return sorted;
  }, [players, positionFilter, sortBy, sortOrder, selectedOnly, language]);

  const toggleSort = (field: 'name' | 'price' | 'points') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getPositionName = (position: string) => {
    const positions = {
      GKP: language === 'ar' ? 'حارس مرمى' : 'Goalkeeper',
      DEF: language === 'ar' ? 'مدافع' : 'Defender',
      MID: language === 'ar' ? 'لاعب وسط' : 'Midfielder',
      FWD: language === 'ar' ? 'مهاجم' : 'Forward',
      ALL: language === 'ar' ? 'الكل' : 'All'
    };
    return positions[position as keyof typeof positions] || position;
  };

  return (
    <div className="space-y-6">
      {/* Filters and Sort */}
      <Card className="bg-white/10 border-white/20">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* Position Filter */}
            <div className="flex flex-wrap gap-2">
              {['ALL', 'GKP', 'DEF', 'MID', 'FWD'].map((pos) => (
                <Button
                  key={pos}
                  variant={positionFilter === pos ? 'default' : 'outline'}
                  size="sm"
                  className={positionFilter === pos ? 'bg-white text-green-800' : 'text-white border-white/30 hover:bg-white/20'}
                  onClick={() => setPositionFilter(pos)}
                >
                  {getPositionName(pos)}
                </Button>
              ))}
            </div>

            {/* Selected Only Toggle */}
            <Button
              variant={selectedOnly ? 'default' : 'outline'}
              size="sm"
              className={selectedOnly ? 'bg-white text-green-800' : 'text-white border-white/30 hover:bg-white/20'}
              onClick={() => setSelectedOnly(!selectedOnly)}
            >
              {language === 'ar' ? 'المختارون فقط' : 'Selected Only'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Players List */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">
            {language === 'ar' ? 'قائمة اللاعبين' : 'Players List'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="grid grid-cols-6 gap-4 p-4 border-b border-white/20 text-white font-semibold text-sm">
            <button
              className="text-left hover:text-green-200 flex items-center gap-1"
              onClick={() => toggleSort('name')}
            >
              {language === 'ar' ? 'اللاعب' : 'Player'}
              {sortBy === 'name' && (
                <span className="text-xs">{sortOrder === 'desc' ? '↓' : '↑'}</span>
              )}
            </button>
            <div>{language === 'ar' ? 'المركز' : 'Position'}</div>
            <div>{language === 'ar' ? 'الفريق' : 'Team'}</div>
            <button
              className="text-left hover:text-green-200 flex items-center gap-1"
              onClick={() => toggleSort('price')}
            >
              {language === 'ar' ? 'السعر' : 'Price'}
              {sortBy === 'price' && (
                <span className="text-xs">{sortOrder === 'desc' ? '↓' : '↑'}</span>
              )}
            </button>
            <button
              className="text-left hover:text-green-200 flex items-center gap-1"
              onClick={() => toggleSort('points')}
            >
              {language === 'ar' ? 'النقاط' : 'Points'}
              {sortBy === 'points' && (
                <span className="text-xs">{sortOrder === 'desc' ? '↓' : '↑'}</span>
              )}
            </button>
            <div>{language === 'ar' ? 'الحالة' : 'Status'}</div>
          </div>

          {/* Players Rows */}
          <div className="max-h-96 overflow-y-auto">
            {filteredAndSortedPlayers.map((player) => (
              <div
                key={player.id}
                className={`grid grid-cols-6 gap-4 p-4 border-b border-white/10 hover:bg-white/5 transition-colors ${
                  player.selected ? 'bg-green-500/20' : ''
                }`}
              >
                {/* Player Name and Jersey */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-10 rounded flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: player.jerseyColor }}
                  >
                    {(language === 'ar' ? player.nameAr : player.name).charAt(0)}
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">
                      {language === 'ar' ? player.nameAr : player.name}
                    </div>
                    {((captain === player.id || player.captain) || (viceCaptain === player.id || player.viceCaptain)) && (
                      <div className="flex gap-1 mt-1">
                        {(captain === player.id || player.captain) && (
                          <span className="bg-yellow-400 text-black text-xs px-1 rounded">C</span>
                        )}
                        {(viceCaptain === player.id || player.viceCaptain) && (
                          <span className="bg-gray-400 text-white text-xs px-1 rounded">V</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Position */}
                <div className="text-white/80 text-sm flex items-center">
                  {getPositionName(player.position)}
                </div>

                {/* Team */}
                <div className="text-white/80 text-sm flex items-center">
                  {language === 'ar' ? player.teamAr : player.team}
                </div>

                {/* Price */}
                <div className="text-white font-semibold text-sm flex items-center">
                  ${player.price.toFixed(1)}M
                </div>

                {/* Points */}
                <div className="text-green-200 font-bold text-sm flex items-center">
                  {player.points}
                </div>

                {/* Status/Actions */}
                <div className="flex items-center gap-2">
                  {player.selected ? (
                    <div className="flex flex-col gap-1">
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                        {language === 'ar' ? 'مختار' : 'Selected'}
                      </span>
                      {onCaptainSelect && onViceCaptainSelect && (
                        <div className="flex gap-1">
                          <button
                            className={`text-xs px-2 py-1 rounded ${
                              captain === player.id
                                ? 'bg-yellow-400 text-black'
                                : 'bg-gray-600 text-white hover:bg-yellow-300 hover:text-black'
                            }`}
                            onClick={() => onCaptainSelect(player.id)}
                          >
                            {language === 'ar' ? 'ق' : 'C'}
                          </button>
                          <button
                            className={`text-xs px-2 py-1 rounded ${
                              viceCaptain === player.id
                                ? 'bg-gray-400 text-white'
                                : 'bg-gray-600 text-white hover:bg-gray-300'
                            }`}
                            onClick={() => onViceCaptainSelect(player.id)}
                          >
                            {language === 'ar' ? 'ن' : 'V'}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-white border-white/30 hover:bg-white/20 text-xs"
                    >
                      {language === 'ar' ? 'اختر' : 'Select'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredAndSortedPlayers.length === 0 && (
            <div className="text-white/60 text-center py-8">
              {language === 'ar' ? 'لا توجد لاعبين' : 'No players found'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">
              {filteredAndSortedPlayers.filter(p => p.selected).length}
            </div>
            <div className="text-white/70 text-sm">
              {language === 'ar' ? 'لاعبين مختارين' : 'Selected Players'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">
              ${filteredAndSortedPlayers.filter(p => p.selected).reduce((sum, p) => sum + p.price, 0).toFixed(1)}M
            </div>
            <div className="text-white/70 text-sm">
              {language === 'ar' ? 'التكلفة الإجمالية' : 'Total Cost'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">
              {filteredAndSortedPlayers.filter(p => p.selected).reduce((sum, p) => sum + p.points, 0)}
            </div>
            <div className="text-white/70 text-sm">
              {language === 'ar' ? 'النقاط الإجمالية' : 'Total Points'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">
              {filteredAndSortedPlayers.length}
            </div>
            <div className="text-white/70 text-sm">
              {language === 'ar' ? 'اللاعبين المعروضين' : 'Players Shown'}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
