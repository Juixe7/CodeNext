import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { Swords, Loader2, Users, Trophy } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import toast from 'react-hot-toast';

export default function BattleLobby() {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [statusText, setStatusText] = useState('');

  useEffect(() => {
    // Only connect when user enters lobby
    const token = localStorage.getItem('token');
    if (!token) return;

    // Point to Render backend in production
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const SOCKET_URL = isLocalhost ? "http://localhost:3000" : "https://roadcode-a-coding-platform.onrender.com";
    
    const newSocket = io(SOCKET_URL, {
      auth: { token }
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
      // We could redirect to a dedicated BattleArena page here
      // For now, let's just go to the Problem Page with a query param
      setTimeout(() => {
        navigate(`/problem/${data.problemId}?matchId=${data.matchId}`);
      }, 1500);
    });

    return () => newSocket.disconnect();
  }, [navigate]);

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

      <div className="flex flex-col items-center justify-center pt-24 px-4">
        <div className="w-full max-w-md bg-base-100 border border-base-300 rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden">
          
          <div className="relative z-10">
            <div className={`w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6 transition-all duration-500
              ${isSearching ? 'animate-pulse scale-110 shadow-lg shadow-primary/20' : ''}`}>
              <Swords className={`w-12 h-12 text-primary ${isSearching ? 'animate-bounce' : ''}`} />
            </div>

            <h1 className="text-3xl font-bold mb-2">DSA Battle</h1>
            <p className="text-base-content/60 mb-8">
              Compete live against other coders. First to solve wins.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-base-200 rounded-xl p-4">
                <Trophy className="w-5 h-5 text-warning mx-auto mb-1" />
                <p className="text-xs text-base-content/50 uppercase font-bold tracking-wider">Elo Rating</p>
                <p className="text-lg font-bold">{user?.eloRating || 1200}</p>
              </div>
              <div className="bg-base-200 rounded-xl p-4">
                <Users className="w-5 h-5 text-info mx-auto mb-1" />
                <p className="text-xs text-base-content/50 uppercase font-bold tracking-wider">Win Rate</p>
                <p className="text-lg font-bold">
                  {user?.battleWins || 0}W - {user?.battleLosses || 0}L
                </p>
              </div>
            </div>

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
    </div>
  );
}
