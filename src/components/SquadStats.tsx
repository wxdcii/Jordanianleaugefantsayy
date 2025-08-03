'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

type SquadStatsProps = {
  players: Player[];
  language: 'en' | 'ar';
};

export default function SquadStats({ players, language }: SquadStatsProps) {
  // Calculate squad statistics
  const selectedPlayers = players.filter(p => p.selected);
  const totalPlayers = selectedPlayers.length;
  const totalCost = selectedPlayers.reduce((sum, p) => sum + p.price, 0);
  const totalPoints = selectedPlayers.reduce((sum, p) => sum + p.points, 0);
  const averagePrice = totalPlayers > 0 ? totalCost / totalPlayers : 0;
  const averagePoints = totalPlayers > 0 ? totalPoints / totalPlayers : 0;

  // Position breakdown
  const positionStats = {
    GKP: selectedPlayers.filter(p => p.position === 'GKP'),
    DEF: selectedPlayers.filter(p => p.position === 'DEF'),
    MID: selectedPlayers.filter(p => p.position === 'MID'),
    FWD: selectedPlayers.filter(p => p.position === 'FWD')
  };

  // Team distribution
  const teamDistribution = selectedPlayers.reduce((acc, player) => {
    const teamName = language === 'ar' ? player.teamAr : player.team;
    acc[teamName] = (acc[teamName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Top performers
  const topScorer = selectedPlayers.reduce((max, player) =>
    player.points > max.points ? player : max, selectedPlayers[0] || null);

  const mostExpensive = selectedPlayers.reduce((max, player) =>
    player.price > max.price ? player : max, selectedPlayers[0] || null);

  const captain = selectedPlayers.find(p => p.captain);
  const viceCaptain = selectedPlayers.find(p => p.viceCaptain);

  const getPositionName = (position: string) => {
    const positions = {
      GKP: language === 'ar' ? 'حراس المرمى' : 'Goalkeepers',
      DEF: language === 'ar' ? 'المدافعون' : 'Defenders',
      MID: language === 'ar' ? 'لاعبو الوسط' : 'Midfielders',
      FWD: language === 'ar' ? 'المهاجمون' : 'Forwards'
    };
    return positions[position as keyof typeof positions] || position;
  };

  return (
    <div className="space-y-6 mt-8">
      {/* Squad Overview */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white text-center">
            {language === 'ar' ? 'إحصائيات التشكيلة' : 'Squad Statistics'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{totalPlayers}</div>
              <div className="text-white/70 text-sm">
                {language === 'ar' ? 'إجمالي اللاعبين' : 'Total Players'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-300">${totalCost.toFixed(1)}M</div>
              <div className="text-white/70 text-sm">
                {language === 'ar' ? 'التكلفة الإجمالية' : 'Total Cost'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-300">{totalPoints}</div>
              <div className="text-white/70 text-sm">
                {language === 'ar' ? 'النقاط الإجمالية' : 'Total Points'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-300">{averagePoints.toFixed(1)}</div>
              <div className="text-white/70 text-sm">
                {language === 'ar' ? 'متوسط النقاط' : 'Average Points'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Position Breakdown */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">
            {language === 'ar' ? 'توزيع المراكز' : 'Position Breakdown'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(positionStats).map(([position, players]) => (
              <div key={position} className="text-center">
                <div className="text-2xl font-bold text-white">{players.length}</div>
                <div className="text-white/70 text-sm">{getPositionName(position)}</div>
                {players.length > 0 && (
                  <div className="text-xs text-white/50 mt-1">
                    ${players.reduce((sum, p) => sum + p.price, 0).toFixed(1)}M
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Distribution */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">
            {language === 'ar' ? 'توزيع الفرق' : 'Team Distribution'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(teamDistribution).map(([team, count]) => (
              <div key={team} className="flex justify-between items-center bg-white/5 rounded p-2">
                <span className="text-white text-sm">{team}</span>
                <span className="text-white font-bold">{count}</span>
              </div>
            ))}
          </div>
          {Object.keys(teamDistribution).length === 0 && (
            <div className="text-white/60 text-center py-4">
              {language === 'ar' ? 'لا توجد فرق مختارة' : 'No teams selected'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Players */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Captain */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">
              {language === 'ar' ? 'القائد' : 'Captain'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {captain ? (
              <div className="text-center">
                <div
                  className="w-12 h-14 mx-auto rounded flex items-center justify-center text-white font-bold mb-2"
                  style={{ backgroundColor: captain.jerseyColor }}
                >
                  C
                </div>
                <div className="text-white text-sm font-medium">
                  {language === 'ar' ? captain.nameAr : captain.name}
                </div>
                <div className="text-white/70 text-xs">{captain.points} pts</div>
              </div>
            ) : (
              <div className="text-white/60 text-center text-sm">
                {language === 'ar' ? 'لم يتم تعيين قائد' : 'No captain set'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vice Captain */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">
              {language === 'ar' ? 'نائب القائد' : 'Vice Captain'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {viceCaptain ? (
              <div className="text-center">
                <div
                  className="w-12 h-14 mx-auto rounded flex items-center justify-center text-white font-bold mb-2"
                  style={{ backgroundColor: viceCaptain.jerseyColor }}
                >
                  V
                </div>
                <div className="text-white text-sm font-medium">
                  {language === 'ar' ? viceCaptain.nameAr : viceCaptain.name}
                </div>
                <div className="text-white/70 text-xs">{viceCaptain.points} pts</div>
              </div>
            ) : (
              <div className="text-white/60 text-center text-sm">
                {language === 'ar' ? 'لم يتم تعيين نائب قائد' : 'No vice captain set'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Scorer */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">
              {language === 'ar' ? 'أفضل هداف' : 'Top Scorer'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topScorer ? (
              <div className="text-center">
                <div
                  className="w-12 h-14 mx-auto rounded flex items-center justify-center text-white font-bold mb-2"
                  style={{ backgroundColor: topScorer.jerseyColor }}
                >
                  ⭐
                </div>
                <div className="text-white text-sm font-medium">
                  {language === 'ar' ? topScorer.nameAr : topScorer.name}
                </div>
                <div className="text-green-300 text-xs font-bold">{topScorer.points} pts</div>
              </div>
            ) : (
              <div className="text-white/60 text-center text-sm">
                {language === 'ar' ? 'لا توجد لاعبين' : 'No players'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Most Expensive */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">
              {language === 'ar' ? 'الأغلى سعراً' : 'Most Expensive'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mostExpensive ? (
              <div className="text-center">
                <div
                  className="w-12 h-14 mx-auto rounded flex items-center justify-center text-white font-bold mb-2"
                  style={{ backgroundColor: mostExpensive.jerseyColor }}
                >
                  💰
                </div>
                <div className="text-white text-sm font-medium">
                  {language === 'ar' ? mostExpensive.nameAr : mostExpensive.name}
                </div>
                <div className="text-yellow-300 text-xs font-bold">${mostExpensive.price}M</div>
              </div>
            ) : (
              <div className="text-white/60 text-center text-sm">
                {language === 'ar' ? 'لا توجد لاعبين' : 'No players'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Squad Validation */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">
            {language === 'ar' ? 'حالة التشكيلة' : 'Squad Status'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className={`flex justify-between items-center p-2 rounded ${
              totalPlayers === 15 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
            }`}>
              <span>{language === 'ar' ? 'عدد اللاعبين (15)' : 'Player Count (15)'}</span>
              <span>{totalPlayers}/15</span>
            </div>

            <div className={`flex justify-between items-center p-2 rounded ${
              positionStats.GKP.length === 2 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
            }`}>
              <span>{language === 'ar' ? 'حراس المرمى (2)' : 'Goalkeepers (2)'}</span>
              <span>{positionStats.GKP.length}/2</span>
            </div>

            <div className={`flex justify-between items-center p-2 rounded ${
              positionStats.DEF.length >= 3 && positionStats.DEF.length <= 5 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
            }`}>
              <span>{language === 'ar' ? 'المدافعون (3-5)' : 'Defenders (3-5)'}</span>
              <span>{positionStats.DEF.length}/3-5</span>
            </div>

            <div className={`flex justify-between items-center p-2 rounded ${
              positionStats.MID.length >= 3 && positionStats.MID.length <= 5 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
            }`}>
              <span>{language === 'ar' ? 'لاعبو الوسط (3-5)' : 'Midfielders (3-5)'}</span>
              <span>{positionStats.MID.length}/3-5</span>
            </div>

            <div className={`flex justify-between items-center p-2 rounded ${
              positionStats.FWD.length >= 1 && positionStats.FWD.length <= 3 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
            }`}>
              <span>{language === 'ar' ? 'المهاجمون (1-3)' : 'Forwards (1-3)'}</span>
              <span>{positionStats.FWD.length}/1-3</span>
            </div>

            <div className={`flex justify-between items-center p-2 rounded ${
              captain ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
            }`}>
              <span>{language === 'ar' ? 'القائد' : 'Captain'}</span>
              <span>{captain ? '✓' : '⚠'}</span>
            </div>

            <div className={`flex justify-between items-center p-2 rounded ${
              viceCaptain ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
            }`}>
              <span>{language === 'ar' ? 'نائب القائد' : 'Vice Captain'}</span>
              <span>{viceCaptain ? '✓' : '⚠'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
