"use client";

import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';

type LeaderboardEntry = {
    username: string;
    points: number;
    level: number;
};

function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/v1/gamification/leaderboard');
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard.');
        }
        const data = await response.json();
        setLeaderboard(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="p-8 lg:p-12 max-w-4xl mx-auto">
      <header className="mb-12 text-center">
        <Trophy className="mx-auto h-16 w-16 text-yellow-500" />
        <h1 className="font-serif font-bold text-4xl text-gray-900 mt-4">Leaderboard</h1>
        <p className="text-gray-600 text-lg mt-2">See who's leading the reading community.</p>
      </header>

      <div>
        {isLoading && <p className="text-center">Loading leaderboard...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        {!isLoading && !error && (
          <div className="space-y-3">
            {leaderboard.map((user, index) => (
              <div key={user.username} className="flex items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-lg font-bold text-gray-400 w-12 text-center">{index + 1}</div>
                <div className="flex-1">
                  <div className="font-bold text-gray-800">{user.username}</div>
                  <div className="text-sm text-gray-500">Level {user.level}</div>
                </div>
                <div className="text-lg font-bold text-yellow-600">{user.points.toLocaleString()} points</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LeaderboardPage;
