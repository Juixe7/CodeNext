import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { Swords, Loader2, Users, Trophy, Activity } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import toast from 'react-hot-toast';
import axiosClient from '../utils/axiosClient';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function BattleLobby() {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [statusText, setStatusText] = useState('');
  
  const [recentMatches, setRecentMatches] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      try {
        const res = await axiosClient.get(`/user/public-profile/${user._id}`);
        if (res.data && res.data.recentMatches) {
          setRecentMatches(res.data.recentMatches);
        }
      } catch (err) {
        console.error("Failed to fetch recent matches for stats", err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  // Reconstruct Elo trajectory using useMemo
  const eloData = useMemo(() => {
    const data = [];
    let currentElo = user?.eloRating || 1200;
    
    // Start with current
    data.unshift({ match: 'Current', elo: currentElo });
    
    // Backtrack through recent matches (which are latest first)
    for (let i = 0; i < Math.min(recentMatches.length, 10); i++) {
      const match = recentMatches[i];
      const isWinner = match.winner?._id === user?._id;
      // Approximate back-calculation (could be more accurate if we stored exact elo changes)
      currentElo = isWinner ? currentElo - 15 : currentElo + 15;
      data.unshift({ match: `M-${i+1}`, elo: currentElo });
    }
    return data;
  }, [recentMatches, user]);

  const winData = useMemo(() => [
    { name: 'Wins', value: user?.battleWins || 0, color: '#10b981' }, 
    { name: 'Losses', value: user?.battleLosses || 0, color: '#ef4444' }
  ], [user]);

  const winRate = (user?.battleWins || 0) + (user?.battleLosses || 0) > 0 
    ? Math.round((user?.battleWins / ((user?.battleWins || 0) + (user?.battleLosses || 0))) * 100) 
    : 0;

  useEffect(() => {
    // Only connect when user enters lobby
    if (!user) return;

    // Point to Render backend in production
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const SOCKET_URL = isLocalhost ? "http://localhost:3000" : "https://roadcode-a-coding-platform.onrender.com";
    
    const newSocket = io(SOCKET_URL, {
      withCredentials: true
    });

    setSocket(newSocket);

    newSocket.on('queue_status', (data) => {
      if (data.status === 'waiting') {
        setStatusText('Searching for opponent...');
        setIsSearching(true);
      } else if (data.status === 'error') {
        toast.error(data.message);
        setIsSearching(false);
      }
    });

    newSocket.on('match_started', (data) => {
      toast.success('Opponent found! Match starting...', { icon: '⚔️' });
      setTimeout(() => {
        navigate(`/problem/${data.problemId}?matchId=${data.matchId}`);
      }, 1500);
    });

    return () => newSocket.disconnect();
  }, [navigate, user]);

  const handleFindMatch = () => {
    if (!socket) return toast.error('Socket not connected');
    socket.emit('join_queue');
  };

  const handleCancelSearch = () => {
    if (!socket) return;
    socket.emit('leave_queue');
    setIsSearching(false);
    setStatusText('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 via-base-200 to-base-100">
      <nav className="navbar bg-base-100/80 backdrop-blur-md border-b border-base-300 px-6">
        <div className="flex-1">
          <button onClick={() => navigate('/')} className="btn btn-ghost">← Back</button>
        </div>
        <div className="flex-none gap-3">
          <ThemeToggle size="sm" />
        </div>
      </nav>

      <div className="max-w-6xl mx-auto pt-12 px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left / Top: Battle Queue Card */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="w-full bg-base-100 border border-base-300 rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden">
              <div className="relative z-10">
                <div className={`w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6 transition-all duration-500
                  ${isSearching ? 'animate-pulse scale-110 shadow-lg shadow-primary/20' : ''}`}>
                  <Swords className={`w-12 h-12 text-primary ${isSearching ? 'animate-bounce' : ''}`} />
                </div>

                <h1 className="text-3xl font-bold mb-2">DSA Battle</h1>
                <p className="text-base-content/60 mb-8">
                  Compete live against other coders. First to solve wins.
                </p>

                {/* Action */}
                {!isSearching ? (
                  <button 
                    onClick={handleFindMatch}
                    className="btn btn-primary btn-block btn-lg rounded-2xl text-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                  >
                    Find Match
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-primary font-medium">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {statusText}
                    </div>
                    <button 
                      onClick={handleCancelSearch}
                      className="btn btn-outline btn-block rounded-2xl"
                    >
                      Cancel Search
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right / Bottom: Analytics & Stats */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Top Row: Win Rate & Current Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Overall Stats */}
              <div className="bg-base-100 border border-base-300 rounded-3xl p-6 shadow-xl flex flex-col justify-center">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-base-content/80">
                  <Trophy className="w-5 h-5 text-warning" /> Current Standing
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-base-content/50 uppercase font-bold tracking-wider">Elo Rating</p>
                    <p className="text-3xl font-extrabold text-primary">{user?.eloRating || 1200}</p>
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50 uppercase font-bold tracking-wider">Total Matches</p>
                    <p className="text-xl font-bold">{(user?.battleWins || 0) + (user?.battleLosses || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Win Rate Donut */}
              <div className="bg-base-100 border border-base-300 rounded-3xl p-6 shadow-xl flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-base-content/80">
                    <Users className="w-5 h-5 text-info" /> Win Rate
                  </h3>
                  <p className="text-4xl font-extrabold mb-1">{winRate}%</p>
                  <p className="text-sm font-medium text-success">{user?.battleWins || 0}W <span className="text-base-content/40">/</span> <span className="text-error">{user?.battleLosses || 0}L</span></p>
                </div>
                <div className="w-28 h-28 relative">
                  {(user?.battleWins || 0) + (user?.battleLosses || 0) > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={winData}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={50}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {winData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                            contentStyle={{ backgroundColor: 'var(--fallback-b1,oklch(var(--b1)))', borderColor: 'var(--fallback-b3,oklch(var(--b3)))', borderRadius: '0.5rem', color: 'var(--fallback-bc,oklch(var(--bc)))' }}
                            itemStyle={{ color: 'var(--fallback-bc,oklch(var(--bc)))' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full rounded-full border-4 border-base-300 flex items-center justify-center">
                      <span className="text-xs text-base-content/40 font-medium">No Data</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Row: Trajectory Graph */}
            <div className="bg-base-100 border border-base-300 rounded-3xl p-6 shadow-xl">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-base-content/80">
                <Activity className="w-5 h-5 text-accent" /> Elo Trajectory (Recent)
              </h3>
              <div className="h-48 w-full">
                {statsLoading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-base-content/30" />
                  </div>
                ) : eloData.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={eloData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="match" stroke="currentColor" fontSize={12} tickLine={false} axisLine={false} className="text-base-content/50" />
                      <YAxis domain={['dataMin - 15', 'dataMax + 15']} stroke="currentColor" fontSize={12} tickLine={false} axisLine={false} className="text-base-content/50" />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'var(--fallback-b1,oklch(var(--b1)))', borderColor: 'var(--fallback-b3,oklch(var(--b3)))', borderRadius: '0.75rem', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: 'var(--fallback-bc,oklch(var(--bc)))', fontWeight: 'bold' }}
                        labelStyle={{ color: 'var(--fallback-bc,oklch(var(--bc)))', opacity: 0.7, marginBottom: '0.25rem' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="elo" 
                        name="Elo Rating"
                        stroke="var(--fallback-p,oklch(var(--p)))" 
                        strokeWidth={3} 
                        dot={{ r: 4, fill: 'var(--fallback-p,oklch(var(--p)))', strokeWidth: 0 }} 
                        activeDot={{ r: 6, stroke: 'var(--fallback-b1,oklch(var(--b1)))', strokeWidth: 2 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-base-content/40 border-2 border-dashed border-base-300 rounded-xl">
                    <Activity className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-sm font-medium">Play more matches to see trajectory</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
