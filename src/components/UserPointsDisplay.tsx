"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAllUserGameweekPoints, getUserRanking } from "@/lib/firebase/pointsService";

interface GameweekPoints {
  points: number;
  [key: string]: any;
}

interface PointsData {
  totalPoints: number;
  gameweekPoints: { [gameweek: string]: GameweekPoints };
  gameweeksPlayed: number;
}

interface RankingData {
  userRanking?: {
    rank: number;
  };
  totalUsers?: number;
}

interface PointsResult {
  success: boolean;
  data: PointsData;
  message?: string;
}

interface RankingResult {
  success: boolean;
  data: RankingData;
  message?: string;
}

interface UserPointsDisplayProps {
  showRanking?: boolean;
  showGameweekBreakdown?: boolean;
}

export default function UserPointsDisplay({
  showRanking = true,
  showGameweekBreakdown = true,
}: UserPointsDisplayProps) {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [pointsData, setPointsData] = useState<PointsData | null>(null);
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isArabic = language === "ar";

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setPointsData(null);
      setRankingData(null);
      return;
    }

    let isMounted = true;

    const fetchUserPoints = async () => {
      try {
        setLoading(true);
        const pointsRes = (await getAllUserGameweekPoints(user.uid)) as PointsResult;
        const rankRes = (await getUserRanking(user.uid)) as RankingResult;

        if (!isMounted) return;

        if (pointsRes.success) setPointsData(pointsRes.data);
        else setPointsData(null);

        if (rankRes.success) setRankingData(rankRes.data);
        else setRankingData(null);

        setError(null);
      } catch (err) {
        console.error(err);
        if (!isMounted) return;
        setError(isArabic ? "فشل تحميل النقاط." : "Failed to load points.");
        setPointsData(null);
        setRankingData(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUserPoints();

    const interval = setInterval(fetchUserPoints, 120000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user, isArabic]);

  if (loading) return <div>{isArabic ? "جارٍ التحميل..." : "Loading..."}</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!user) return <div>{isArabic ? "يرجى تسجيل الدخول لعرض النقاط." : "Please login to view points."}</div>;

  const totalPoints = pointsData?.totalPoints ?? 0;
  const gameweeksPlayed = pointsData?.gameweeksPlayed ?? 0;
  const averagePoints =
    gameweeksPlayed > 0 ? (totalPoints / gameweeksPlayed).toFixed(1) : "0.0";

  const highestGWPoints = pointsData?.gameweekPoints
    ? Math.max(...Object.values(pointsData.gameweekPoints).map((gw) => gw.points || 0))
    : 0;

  // Override totalUsers for marketing
  const marketingTotalUsers = 6352;
  const displayTotalUsers = marketingTotalUsers;

  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <div className="mb-4">
        <div className="text-xl font-bold text-blue-700">{totalPoints} pts</div>
        <div className="text-sm text-gray-500">
          {isArabic
            ? `متوسط: ${averagePoints} نقطة/جولة`
            : `Average: ${averagePoints} pts/GW`}
        </div>
      </div>

      {showRanking && rankingData?.userRanking && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">
              {isArabic ? "ترتيبي" : "My Ranking"}
            </div>
            <div className="text-xl font-bold text-orange-600">
              #{rankingData.userRanking.rank}
            </div>
            <div className="text-xs text-gray-500">
              {isArabic
                ? `من أصل ${displayTotalUsers} لاعب`
                : `out of ${displayTotalUsers} players`}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center bg-gray-50 rounded-lg p-3">
          <div className="text-sm text-gray-600">
            {isArabic ? "الجولات المُلعبة" : "Gameweeks Played"}
          </div>
          <div className="text-lg font-semibold text-gray-800">{gameweeksPlayed}</div>
        </div>

        <div className="text-center bg-gray-50 rounded-lg p-3">
          <div className="text-sm text-gray-600">{isArabic ? "أعلى نقاط" : "Highest GW"}</div>
          <div className="text-lg font-semibold text-gray-800">{highestGWPoints}</div>
        </div>
      </div>

      {showGameweekBreakdown && pointsData?.gameweekPoints && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            {isArabic ? "تفصيل النقاط حسب الجولة:" : "Gameweek Breakdown:"}
          </h4>
          <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
            {Object.entries(pointsData.gameweekPoints)
              .sort(([a], [b]) => {
                // Extract number from keys like 'gw1', 'gw10'
                const numA = parseInt(a.replace(/\D/g, ""), 10);
                const numB = parseInt(b.replace(/\D/g, ""), 10);
                return numA - numB;
              })
              .map(([gameweek, data]) => (
                <div key={gameweek} className="text-center bg-blue-50 rounded p-2">
                  <div className="text-xs text-blue-600 font-medium">
                    {gameweek.toUpperCase()}
                  </div>
                  <div className="text-sm font-semibold text-blue-800">{data.points || 0}</div>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-400 text-center mt-4">
        {isArabic ? "آخر تحديث: الآن" : "Last updated: now"}
      </div>
    </div>
  );
}