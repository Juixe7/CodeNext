import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, NavLink } from 'react-router';
import { useSelector } from 'react-redux';
import { Search, Users, Trophy, Flame, Loader2, UserPlus, UserMinus, MessageCircle, ArrowLeft, Crown, Swords, X } from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import ThemeToggle from '../components/ThemeToggle';
import ChatComponent from '../components/ChatComponent';
import logoRoadCode from '../assets/RoadCodeLogo.jpg';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';

export default function People() {
  const { user: currentUser } = useSelector(state => state.auth);
  const navigate = useNavigate();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Leaderboard state
  const [topUsers, setTopUsers] = useState([]);
  const [topLoading, setTopLoading] = useState(true);

  // Friends state  
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [friendIds, setFriendIds] = useState(new Set());

  // Chat state
  const [chatTarget, setChatTarget] = useState(null);

  // Action loading for add/remove friend buttons
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Tab state
  const [activeTab, setActiveTab] = useState('discover');

  // Fetch top 10 leaderboard
  useEffect(() => {
    axiosClient.get('/user/leaderboard')
      .then(r => setTopUsers(r.data.slice(0, 10)))
      .catch(console.error)
      .finally(() => setTopLoading(false));
  }, []);

  // Fetch current user's friends list
  useEffect(() => {
    if (!currentUser) return;
    axiosClient.get(`/user/public-profile/${currentUser._id}`)
      .then(r => {
        const f = r.data?.profile?.friends || [];
        setFriends(f);
        setFriendIds(new Set(f.map(fr => fr._id)));
      })
      .catch(console.error)
      .finally(() => setFriendsLoading(false));
  }, [currentUser]);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await axiosClient.get(`/user/search?q=${searchQuery}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleToggleFriend = async (targetId) => {
    setActionLoadingId(targetId);
    try {
      const res = await axiosClient.post(`/user/friend/${targetId}`);
      if (res.data.isFriend) {
        toast.success('Added to friends!');
        // Refetch friends
        const profileRes = await axiosClient.get(`/user/public-profile/${currentUser._id}`);
        const f = profileRes.data?.profile?.friends || [];
        setFriends(f);
        setFriendIds(new Set(f.map(fr => fr._id)));
      } else {
        toast.success('Removed from friends');
        setFriends(prev => prev.filter(fr => fr._id !== targetId));
        setFriendIds(prev => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
      }
    } catch (err) {
      toast.error('Failed to update friends list');
    } finally {
      setActionLoadingId(null);
    }
  };

  const UserCard = ({ userData, rank, showFriendAction = true }) => {
    const isMe = userData._id === currentUser?._id;
    const isFriend = friendIds.has(userData._id);
    return (
      <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 group
        ${isMe ? 'bg-primary/10 border-primary/30 shadow-sm' : 'bg-base-100 border-base-300 hover:border-primary/30 hover:shadow-md'}`}>
        
        {/* Rank badge (optional) */}
        {rank && (
          <div className="w-8 flex justify-center shrink-0">
            {rank === 1 ? <span className="text-xl">🥇</span> :
             rank === 2 ? <span className="text-xl">🥈</span> :
             rank === 3 ? <span className="text-xl">🥉</span> :
             <span className="text-xs font-bold text-base-content/40">#{rank}</span>}
          </div>
        )}

        {/* Avatar */}
        <div 
          className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 cursor-pointer transition-transform hover:scale-110
            ${isMe ? 'bg-primary text-primary-content' : 'bg-gradient-to-br from-primary/20 to-accent/20 text-primary'}`}
          onClick={() => navigate(`/profile/${userData._id}`)}
        >
          {userData.firstName?.[0]?.toUpperCase() || '?'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/profile/${userData._id}`)}>
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-semibold text-sm ${isMe ? 'text-primary' : ''}`}>
              {userData.firstName} {userData.lastName || ''}
              {isMe && <span className="badge badge-primary badge-xs ml-1">You</span>}
            </p>
            {userData.streak > 2 && (
              <span className="text-xs flex items-center gap-0.5 text-orange-400">
                <Flame className="w-3 h-3" />{userData.streak}
              </span>
            )}
          </div>
          <div className="flex gap-3 text-xs text-base-content/40 mt-0.5">
            <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-warning" /> {userData.eloRating || 1200}</span>
            {userData.score !== undefined && <span>{userData.score} pts</span>}
            {userData.totalSolved !== undefined && <span>{userData.totalSolved} solved</span>}
          </div>
        </div>

        {/* Actions */}
        {!isMe && showFriendAction && (
          <div className="flex items-center gap-2 shrink-0">
            {isFriend && (
              <button
                onClick={() => setChatTarget({ id: userData._id, name: userData.firstName })}
                className="btn btn-ghost btn-sm btn-circle text-primary hover:bg-primary/10"
                title="Message"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => handleToggleFriend(userData._id)}
              disabled={actionLoadingId === userData._id}
              className={`btn btn-sm gap-1 rounded-xl transition-all ${isFriend ? 'btn-outline btn-error hover:bg-error/10' : 'btn-primary shadow-sm shadow-primary/20'}`}
              title={isFriend ? 'Remove Friend' : 'Add Friend'}
            >
              {actionLoadingId === userData._id ? <Loader2 className="w-4 h-4 animate-spin" /> :
               isFriend ? <><UserMinus className="w-4 h-4" /> Remove</> :
               <><UserPlus className="w-4 h-4" /> Add</>}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 via-base-200 to-base-100">
      <Helmet>
        <title>People | RoadCode</title>
        <meta name="description" content="Find and connect with other coders on RoadCode." />
      </Helmet>

      {/* Navbar */}
      <nav className="navbar bg-base-100/80 backdrop-blur-md sticky top-0 z-40 border-b border-base-300 px-6 shadow-sm">
        <div className="flex-1">
          <NavLink to="/" className="inline-flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-base-200/50 transition-colors">
            <img src={logoRoadCode} alt="Logo" className="w-9 h-9 rounded-full object-cover shadow-sm" />
            <span className="hidden sm:inline text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">RoadCode</span>
          </NavLink>
        </div>
        <div className="flex-none flex flex-row items-center gap-2 sm:gap-4">
          <NavLink to="/leaderboard" className="btn btn-ghost btn-sm gap-1">
            <Trophy className="w-4 h-4" /> Leaderboard
          </NavLink>
          <ThemeToggle size="sm" />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold mb-2">People</h1>
          <p className="text-base-content/50">Discover coders, add friends, and chat</p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xl mx-auto mb-8">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40" />
          <input
            type="text"
            placeholder="Search users by name..."
            className="input input-bordered w-full pl-12 pr-12 rounded-full text-sm h-12 bg-base-100 border-base-300 focus:border-primary shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {searchLoading && <Loader2 className="w-4 h-4 absolute right-10 top-1/2 -translate-y-1/2 animate-spin text-primary" />}
        </div>

        {/* Search Results */}
        {searchQuery.trim().length >= 2 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" /> Search Results
              <span className="badge badge-sm">{searchResults.length}</span>
            </h2>
            {searchLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12 bg-base-200/30 rounded-2xl border border-dashed border-base-300">
                <Users className="w-10 h-10 mx-auto text-base-content/20 mb-2" />
                <p className="text-base-content/50 text-sm">No users found matching "{searchQuery}"</p>
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map(u => <UserCard key={u._id} userData={u} />)}
              </div>
            )}
          </div>
        )}

        {/* Tabs: Friends / Top 10 */}
        {searchQuery.trim().length < 2 && (
          <>
            <div className="flex justify-center mb-6">
              <div className="bg-base-200 rounded-full p-1 flex gap-1">
                <button
                  onClick={() => setActiveTab('discover')}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'discover' ? 'bg-primary text-primary-content shadow-sm' : 'hover:bg-base-300'}`}
                >
                  <Crown className="w-4 h-4 inline mr-1.5" />Top 10
                </button>
                <button
                  onClick={() => setActiveTab('friends')}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'friends' ? 'bg-primary text-primary-content shadow-sm' : 'hover:bg-base-300'}`}
                >
                  <Users className="w-4 h-4 inline mr-1.5" />My Friends
                  {friends.length > 0 && <span className="ml-1.5 badge badge-xs badge-ghost">{friends.length}</span>}
                </button>
              </div>
            </div>

            {/* Top 10 Tab */}
            {activeTab === 'discover' && (
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-warning" /> Top 10 Coders
                </h2>
                {topLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-16 bg-base-200 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topUsers.map((u, idx) => <UserCard key={u._id} userData={u} rank={idx + 1} />)}
                  </div>
                )}
                <div className="text-center mt-6">
                  <NavLink to="/leaderboard" className="btn btn-ghost btn-sm text-primary">
                    View Full Leaderboard →
                  </NavLink>
                </div>
              </div>
            )}

            {/* Friends Tab */}
            {activeTab === 'friends' && (
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-info" /> My Friends
                </h2>
                {friendsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-16 bg-base-200 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : friends.length === 0 ? (
                  <div className="text-center py-16 bg-base-200/30 rounded-3xl border border-dashed border-base-300">
                    <Users className="w-14 h-14 mx-auto text-base-content/15 mb-3" />
                    <h3 className="font-bold text-lg mb-1">No friends yet</h3>
                    <p className="text-base-content/50 text-sm mb-4">Search for users above or check the Top 10 to find people to connect with!</p>
                    <button onClick={() => setActiveTab('discover')} className="btn btn-primary btn-sm rounded-full">
                      Discover People
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {friends.map(f => <UserCard key={f._id} userData={f} />)}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Chat overlay */}
      {chatTarget && (
        <ChatComponent
          currentUser={currentUser}
          friendId={chatTarget.id}
          friendName={chatTarget.name}
          onClose={() => setChatTarget(null)}
        />
      )}
    </div>
  );
}
