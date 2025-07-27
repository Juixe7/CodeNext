import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router';
import axiosClient from '../utils/axiosClient';
import { Trophy, Medal, Award, TrendingUp, Flame, Code, ChevronUp } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';

const RankBadge = ({ rank }) => {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return <span className="text-sm font-bold text-base-content/50">#{rank}</span>;
};

export default function Leaderboard() {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const myRank = leaders.findIndex(l => l._id === user?._id) + 1;

  useEffect(() => {
    axiosClient.get('/user/leaderboard')
      .then(r => setLeaders(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 via-base-200 to-base-100">
      <Helmet>
        <title>Global Leaderboard | CodeNEXT</title>
        <meta name="description" content="See the top DSA coders on CodeNEXT ranked by problem-solving score." />
      </Helmet>
      {/* Navbar */}
      <nav className="navbar bg-base-100/80 backdrop-blur-md sticky top-0 z-40 border-b border-base-300 px-6">
        <div className="flex-1">
          <NavLink to="/" className="inline-flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-base-200/50 transition-colors font-bold">
            ← Back to Problems
          </NavLink>
        </div>
        <div className="flex-none flex flex-row items-center gap-2 sm:gap-4">
          <ThemeToggle size="sm" />
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="w-16 h-16 bg-warning/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-warning" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Leaderboard</h1>
          <p className="text-base-content/50">Top coders ranked by problem score</p>
          {myRank > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <TrendingUp className="w-4 h-4" /> Your rank: #{myRank}
            </div>
          )}
        </div>

        {/* Score legend */}
        <div className="flex justify-center gap-4 mb-6 text-xs text-base-content/50">
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-success" /> Easy = 1pt</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-warning" /> Medium = 3pt</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-error" /> Hard = 5pt</span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({length: 8}).map((_,i) => (
              <div key={i} className="h-16 bg-base-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {leaders.map((leader, idx) => {
              const isMe = leader._id === user?._id;
              const rank = idx + 1;
              return (
                <div key={leader._id}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer hover:-translate-y-0.5
                    ${isMe
                      ? 'bg-primary/10 border-primary/30 shadow-sm shadow-primary/10'
                      : rank <= 3
                        ? 'bg-warning/5 border-warning/20 hover:border-warning/40 hover:shadow-md'
                        : 'bg-base-100 border-base-300 hover:border-primary/30 hover:shadow-sm'}`}
                  onClick={() => navigate(`/profile/${leader._id}`)}
                >
                  {/* Rank */}
                  <div className="w-10 flex justify-center shrink-0">
                    <RankBadge rank={rank} />
                  </div>

                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0
                    ${isMe ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content'}`}>
                    {leader.firstName?.[0]?.toUpperCase()}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-semibold text-sm ${isMe ? 'text-primary' : ''}`}>
                        {leader.firstName} {leader.lastName || ''}
                        {isMe && <span className="badge badge-primary badge-xs ml-1">You</span>}
                      </p>
                      {leader.streak > 2 && (
                        <span className="text-xs flex items-center gap-0.5 text-orange-400">
                          <Flame className="w-3 h-3" />{leader.streak}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 text-xs text-base-content/40 mt-0.5">
                      <span className="text-success">{leader.easy}E</span>
                      <span className="text-warning">{leader.medium}M</span>
                      <span className="text-error">{leader.hard}H</span>
                      <span>·</span>
                      <span>{leader.totalSolved} solved</span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0">
                    <p className={`text-lg font-bold ${rank === 1 ? 'text-warning' : rank <= 3 ? 'text-base-content' : 'text-primary'}`}>
                      {leader.score}
                    </p>
                    <p className="text-xs text-base-content/40">points</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
