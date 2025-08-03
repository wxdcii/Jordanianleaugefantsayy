'use client';

import { useState } from 'react';

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

type FormationFieldProps = {
  players: Player[];
  formation: string;
  language: 'en' | 'ar';
  onCaptainSelect?: (playerId: string) => void;
  onViceCaptainSelect?: (playerId: string) => void;
  captain?: string;
  viceCaptain?: string;
};

export default function FormationField({
  players,
  formation,
  language,
  onCaptainSelect,
  onViceCaptainSelect,
  captain,
  viceCaptain
}: FormationFieldProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Get players by position
  const goalkeepers = players.filter(p => p.position === 'GKP');
  const defenders = players.filter(p => p.position === 'DEF');
  const midfielders = players.filter(p => p.position === 'MID');
  const forwards = players.filter(p => p.position === 'FWD');

  // Formation configurations
  const formationConfig: { [key: string]: { def: number; mid: number; fwd: number } } = {
    '4-3-3': { def: 4, mid: 3, fwd: 3 },
    '3-5-2': { def: 3, mid: 5, fwd: 2 },
    '4-4-2': { def: 4, mid: 4, fwd: 2 },
    '5-3-2': { def: 5, mid: 3, fwd: 2 },
    '3-4-3': { def: 3, mid: 4, fwd: 3 }
  };

  const config = formationConfig[formation] || formationConfig['4-3-3'];

  const renderPlayer = (player: Player, index: number) => {
    const displayName = language === 'ar' ? player.nameAr : player.name;
    const displayTeam = language === 'ar' ? player.teamAr : player.team;

    return (
      <div
        key={player.id}
        className="relative group cursor-pointer"
        onClick={() => setSelectedPlayer(player)}
      >
        {/* Player Jersey */}
        <div className="relative">
          <div
            className="w-16 h-20 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-lg transform hover:scale-105 transition-transform"
            style={{ backgroundColor: player.jerseyColor }}
          >
            {/* Jersey number or position */}
            <span className="text-lg">{index + 1}</span>
          </div>

          {/* Captain/Vice Captain Badge */}
          {(captain === player.id || player.captain) && (
            <div className="absolute -top-1 -right-1 bg-yellow-400 text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              C
            </div>
          )}
          {(viceCaptain === player.id || player.viceCaptain) && (
            <div className="absolute -top-1 -right-1 bg-gray-400 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              V
            </div>
          )}
        </div>

        {/* Player Info */}
        <div className="text-center mt-2">
          <div className="bg-purple-900 text-white px-2 py-1 rounded text-xs font-bold mb-1">
            {displayName.split(' ').slice(-1)[0]} {/* Last name */}
          </div>
          <div className="text-white text-xs">{player.points}</div>
        </div>

        {/* Hover tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
          {displayName} - {displayTeam} - ${player.price}M
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Football Field */}
      <div
        className="relative bg-gradient-to-b from-green-400 to-green-600 rounded-lg overflow-hidden shadow-2xl"
        style={{
          backgroundImage: `
            linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          minHeight: '600px'
        }}
      >
        {/* Field markings */}
        <div className="absolute inset-0">
          {/* Outer boundary */}
          <div className="absolute inset-4 border-2 border-white/50 rounded"></div>

          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white/50 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/50 rounded-full"></div>

          {/* Center line */}
          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-white/50"></div>

          {/* Goal areas */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-24 h-16 border-2 border-white/50 border-t-0"></div>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-16 border-2 border-white/50 border-b-0"></div>

          {/* Penalty areas */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-48 h-32 border-2 border-white/50 border-t-0"></div>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-48 h-32 border-2 border-white/50 border-b-0"></div>
        </div>

        {/* Player Positions */}
        <div className="relative h-full p-8">
          {/* Goalkeeper */}
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 flex justify-center">
            {goalkeepers.slice(0, 1).map((player, index) => renderPlayer(player, index))}
          </div>

          {/* Defenders */}
          <div className="absolute top-32 left-1/2 transform -translate-x-1/2 w-full">
            <div className="flex justify-center space-x-8">
              {defenders.slice(0, config.def).map((player, index) => renderPlayer(player, index))}
            </div>
          </div>

          {/* Midfielders */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full">
            <div className="flex justify-center space-x-8">
              {midfielders.slice(0, config.mid).map((player, index) => renderPlayer(player, index))}
            </div>
          </div>

          {/* Forwards */}
          <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 w-full">
            <div className="flex justify-center space-x-8">
              {forwards.slice(0, config.fwd).map((player, index) => renderPlayer(player, index))}
            </div>
          </div>
        </div>

        {/* Formation badge */}
        <div className="absolute top-4 right-4 bg-white/20 text-white px-3 py-1 rounded-full text-sm font-bold">
          {formation}
        </div>
      </div>

      {/* Bench Players */}
      <div className="mt-8 bg-white/10 rounded-lg p-4">
        <h3 className="text-white text-lg font-bold mb-4 text-center">
          {language === 'ar' ? 'البدلاء' : 'Bench'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Bench goalkeeper */}
          {goalkeepers.slice(1, 2).map((player, index) => (
            <div key={player.id} className="text-center">
              {renderPlayer(player, index + 1)}
              <div className="text-xs text-white/70 mt-1">GKP</div>
            </div>
          ))}

          {/* Remaining bench players */}
          {[...defenders.slice(config.def), ...midfielders.slice(config.mid), ...forwards.slice(config.fwd)]
            .slice(0, 3)
            .map((player, index) => (
              <div key={player.id} className="text-center">
                {renderPlayer(player, index + 2)}
                <div className="text-xs text-white/70 mt-1">{player.position}</div>
              </div>
            ))}
        </div>
      </div>

      {/* Player Details Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPlayer(null)}>
          <div className="bg-white rounded-lg p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div
                className="w-20 h-24 mx-auto rounded-lg flex items-center justify-center text-white font-bold text-xl mb-4"
                style={{ backgroundColor: selectedPlayer.jerseyColor }}
              >
                {selectedPlayer.name.charAt(0)}
              </div>
              <h3 className="text-xl font-bold mb-2">
                {language === 'ar' ? selectedPlayer.nameAr : selectedPlayer.name}
              </h3>
              <p className="text-gray-600 mb-4">
                {language === 'ar' ? selectedPlayer.teamAr : selectedPlayer.team}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-semibold">Price</div>
                  <div>${selectedPlayer.price}M</div>
                </div>
                <div>
                  <div className="font-semibold">Points</div>
                  <div>{selectedPlayer.points}</div>
                </div>
                <div>
                  <div className="font-semibold">Position</div>
                  <div>{selectedPlayer.position}</div>
                </div>
                <div>
                  <div className="font-semibold">Status</div>
                  <div>
                    {(captain === selectedPlayer.id || selectedPlayer.captain) ? 'Captain' :
                     (viceCaptain === selectedPlayer.id || selectedPlayer.viceCaptain) ? 'Vice Captain' : 'Player'}
                  </div>
                </div>
              </div>

              {/* Captain/Vice Captain Selection */}
              {onCaptainSelect && onViceCaptainSelect && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    className={`py-2 px-3 rounded text-sm font-semibold ${
                      captain === selectedPlayer.id
                        ? 'bg-yellow-400 text-black'
                        : 'bg-gray-200 hover:bg-yellow-200 text-gray-800'
                    }`}
                    onClick={() => onCaptainSelect(selectedPlayer.id)}
                  >
                    {language === 'ar' ? 'قائد' : 'Captain'}
                  </button>
                  <button
                    className={`py-2 px-3 rounded text-sm font-semibold ${
                      viceCaptain === selectedPlayer.id
                        ? 'bg-gray-400 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                    onClick={() => onViceCaptainSelect(selectedPlayer.id)}
                  >
                    {language === 'ar' ? 'نائب قائد' : 'Vice Captain'}
                  </button>
                </div>
              )}
            </div>
            <button
              className="w-full mt-4 bg-gray-200 hover:bg-gray-300 py-2 rounded"
              onClick={() => setSelectedPlayer(null)}
            >
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
