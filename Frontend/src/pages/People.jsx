import { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router';
import { useSelector } from 'react-redux';
import { Search, Users, Trophy, Flame, Loader2, UserPlus, UserMinus, MessageCircle, Crown, Clock, CheckCircle, X, Bell } from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import ThemeToggle from '../components/ThemeToggle';
import logoCodeNEXT from '../assets/CodeNEXTLogo.jpg';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';

export default function People() {
  const { user: currentUser } = useSelector(state => state.auth);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [topUsers, setTopUsers] = useState([]);
  const [topLoading, setTopLoading] = useState(true);

  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [friendIds, setFriendIds] = useState(new Set());

  // Friend requests
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [sentIds, setSentIds] = useState(new Set());
  const [requestsLoading, setRequestsLoading] = useState(true);

  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [activeTab, setActiveTab] = useState('discover');

  // Fetch top 10
  useEffect(() => {
    axiosClient.get('/user/leaderboard')
      .then(r => setTopUsers(r.data.slice(0, 10)))
      .catch(console.error)
      .finally(() => setTopLoading(false));
  }, []);

  // Fetch friends
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

  // Fetch friend requests
  const fetchRequests = async () => {
    try {
      const res = await axiosClient.get('/user/friend-requests');
      setReceivedRequests(res.data.received || []);
      setSentRequests(res.data.sent || []);
      setSentIds(new Set((res.data.sent || []).map(r => r.receiver?._id)));
    } catch (err) {
      console.error('Failed to fetch requests', err);
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  // Search
  useEffect(() => {
    if (searchQuery.trim().length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await axiosClient.get(`/user/search?q=${searchQuery}`);
        setSearchResults(res.data);
      } catch { }
      finally { setSearchLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSendRequest = async (targetId) => {
    setActionLoadingId(targetId);
    try {
      const res = await axiosClient.post(`/user/friend-request/${targetId}`);
      if (res.data.status === 'accepted') {
        toast.success('You are now friends!');
        // Refresh friends and requests
        const profileRes = await axiosClient.get(`/user/public-profile/${currentUser._id}`);
        const f = profileRes.data?.profile?.friends || [];
        setFriends(f);
        setFriendIds(new Set(f.map(fr => fr._id)));
      } else {
        toast.success('Friend request sent!');
        setSentIds(prev => new Set([...prev, targetId]));
      }
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRespondRequest = async (requestId, action) => {
    setActionLoadingId(requestId);
    try {
      await axiosClient.post(`/user/friend-request/${requestId}/respond`, { action });
      toast.success(action === 'accept' ? 'Friend request accepted!' : 'Request declined');
      // Refresh
      fetchRequests();
      if (action === 'accept') {
        const profileRes = await axiosClient.get(`/user/public-profile/${currentUser._id}`);
        const f = profileRes.data?.profile?.friends || [];
        setFriends(f);
        setFriendIds(new Set(f.map(fr => fr._id)));
      }
    } catch (err) {
      toast.error('Failed to respond');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveFriend = async (targetId) => {
    setActionLoadingId(targetId);
    try {
      await axiosClient.delete(`/user/friend/${targetId}`);
      toast.success('Removed from friends');
      setFriends(prev => prev.filter(f => f._id !== targetId));
      setFriendIds(prev => { const n = new Set(prev); n.delete(targetId); return n; });
    } catch {
      toast.error('Failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getFriendAction = (userId) => {
    if (friendIds.has(userId)) return 'friends';
    if (sentIds.has(userId)) return 'sent';
    const received = receivedRequests.find(r => r.sender?._id === userId);
    if (received) return 'received';
    return 'none';
  };

  const UserCard = ({ userData, rank }) => {
    const isMe = userData._id === currentUser?._id;
    const status = getFriendAction(userData._id);

    return (
      <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 group
        ${isMe ? 'bg-primary/10 border-primary/30 shadow-sm' : 'bg-base-100 border-base-300 hover:border-primary/30 hover:shadow-md'}`}>
        
        {rank && (
          <div className="w-8 flex justify-center shrink-0">
            {rank === 1 ? <span className="text-xl">🥇</span> :
             rank === 2 ? <span className="text-xl">🥈</span> :
             rank === 3 ? <span className="text-xl">🥉</span> :
             <span className="text-xs font-bold text-base-content/40">#{rank}</span>}
          </div>
        )}

        <div 
          className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 cursor-pointer transition-transform hover:scale-110
            ${isMe ? 'bg-primary text-primary-content' : 'bg-gradient-to-br from-primary/20 to-accent/20 text-primary'}`}
          onClick={() => navigate(`/profile/${userData._id}`)}
        >
          {userData.firstName?.[0]?.toUpperCase() || '?'}
        </div>

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
          </div>
        </div>

        {!isMe && (
          <div className="flex items-center gap-2 shrink-0">
            {status === 'friends' && (
              <>
                <button onClick={() => navigate(`/chat/${userData._id}`)} className="btn btn-ghost btn-sm btn-circle text-primary hover:bg-primary/10" title="Message">
                  <MessageCircle className="w-4 h-4" />
                </button>
                <button onClick={() => handleRemoveFriend(userData._id)} disabled={actionLoadingId === userData._id}
                  className="btn btn-sm btn-outline btn-error rounded-xl gap-1">
                  {actionLoadingId === userData._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserMinus className="w-4 h-4" /> Remove</>}
                </button>
              </>
            )}
            {status === 'sent' && (
              <button disabled className="btn btn-sm btn-outline btn-disabled rounded-xl gap-1">
                <Clock className="w-4 h-4" /> Pending
              </button>
            )}
            {status === 'received' && (
              <button onClick={() => handleSendRequest(userData._id)} disabled={actionLoadingId === userData._id}
                className="btn btn-sm btn-success rounded-xl gap-1">
                {actionLoadingId === userData._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Accept</>}
              </button>
            )}
            {status === 'none' && (
              <button onClick={() => handleSendRequest(userData._id)} disabled={actionLoadingId === userData._id}
                className="btn btn-sm btn-primary rounded-xl gap-1 shadow-sm shadow-primary/20">
                {actionLoadingId === userData._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4" /> Add</>}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const pendingCount = receivedRequests.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 via-base-200 to-base-100">
      <Helmet><title>People | CodeNEXT</title></Helmet>

      <nav className="navbar bg-base-100/80 backdrop-blur-md sticky top-0 z-40 border-b border-base-300 px-6 shadow-sm">
        <div className="flex-1">
          <NavLink to="/" className="inline-flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-base-200/50 transition-colors">
            <img src={logoCodeNEXT} alt="Logo" className="w-9 h-9 rounded-full object-cover shadow-sm" />
            <span className="hidden sm:inline text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">CodeNEXT</span>
          </NavLink>
        </div>
        <div className="flex-none flex flex-row items-center gap-2 sm:gap-4">
          <NavLink to="/chat" className="btn btn-ghost btn-sm gap-1 text-primary">
            <MessageCircle className="w-4 h-4" /> Chat
          </NavLink>
          <NavLink to="/leaderboard" className="btn btn-ghost btn-sm gap-1">
            <Trophy className="w-4 h-4" /> Leaderboard
          </NavLink>
          <ThemeToggle size="sm" />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold mb-2">People</h1>
          <p className="text-base-content/50">Discover coders, send friend requests, and chat</p>
        </div>

        {/* Search */}
        <div className="relative max-w-xl mx-auto mb-8">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40" />
          <input type="text" placeholder="Search users by name..."
            className="input input-bordered w-full pl-12 pr-12 rounded-full text-sm h-12 bg-base-100 border-base-300 focus:border-primary shadow-sm"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results */}
        {searchQuery.trim().length >= 2 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" /> Search Results <span className="badge badge-sm">{searchResults.length}</span>
            </h2>
            {searchLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12 bg-base-200/30 rounded-2xl border border-dashed border-base-300">
                <Users className="w-10 h-10 mx-auto text-base-content/20 mb-2" />
                <p className="text-base-content/50 text-sm">No users found matching "{searchQuery}"</p>
              </div>
            ) : (
              <div className="space-y-2">{searchResults.map(u => <UserCard key={u._id} userData={u} />)}</div>
            )}
          </div>
        )}

        {/* Tabs */}
        {searchQuery.trim().length < 2 && (
          <>
            <div className="flex justify-center mb-6">
              <div className="bg-base-200 rounded-full p-1 flex gap-1">
                <button onClick={() => setActiveTab('discover')}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'discover' ? 'bg-primary text-primary-content shadow-sm' : 'hover:bg-base-300'}`}>
                  <Crown className="w-4 h-4 inline mr-1.5" />Top 10
                </button>
                <button onClick={() => setActiveTab('requests')}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all relative ${activeTab === 'requests' ? 'bg-primary text-primary-content shadow-sm' : 'hover:bg-base-300'}`}>
                  <Bell className="w-4 h-4 inline mr-1.5" />Requests
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-error text-error-content text-[10px] font-bold flex items-center justify-center">{pendingCount}</span>
                  )}
                </button>
                <button onClick={() => setActiveTab('friends')}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'friends' ? 'bg-primary text-primary-content shadow-sm' : 'hover:bg-base-300'}`}>
                  <Users className="w-4 h-4 inline mr-1.5" />Friends
                  {friends.length > 0 && <span className="ml-1.5 badge badge-xs badge-ghost">{friends.length}</span>}
                </button>
              </div>
            </div>

            {/* Top 10 */}
            {activeTab === 'discover' && (
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Trophy className="w-5 h-5 text-warning" /> Top 10 Coders</h2>
                {topLoading ? (
                  <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-base-200 rounded-2xl animate-pulse" />)}</div>
                ) : (
                  <div className="space-y-2">{topUsers.map((u, idx) => <UserCard key={u._id} userData={u} rank={idx + 1} />)}</div>
                )}
                <div className="text-center mt-6">
                  <NavLink to="/leaderboard" className="btn btn-ghost btn-sm text-primary">View Full Leaderboard →</NavLink>
                </div>
              </div>
            )}

            {/* Requests */}
            {activeTab === 'requests' && (
              <div className="space-y-8">
                {/* Received */}
                <div>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-warning" /> Received Requests
                    {receivedRequests.length > 0 && <span className="badge badge-warning badge-sm">{receivedRequests.length}</span>}
                  </h2>
                  {requestsLoading ? (
                    <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-16 bg-base-200 rounded-2xl animate-pulse" />)}</div>
                  ) : receivedRequests.length === 0 ? (
                    <div className="text-center py-10 bg-base-200/30 rounded-2xl border border-dashed border-base-300">
                      <Bell className="w-8 h-8 mx-auto text-base-content/15 mb-2" />
                      <p className="text-sm text-base-content/50">No pending requests</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {receivedRequests.map(req => (
                        <div key={req._id} className="flex items-center gap-4 p-4 rounded-2xl border border-warning/30 bg-warning/5 transition-all hover:shadow-md">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-warning/30 to-accent/20 flex items-center justify-center text-warning font-bold shrink-0 cursor-pointer"
                            onClick={() => navigate(`/profile/${req.sender._id}`)}>
                            {req.sender?.firstName?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/profile/${req.sender._id}`)}>
                            <p className="font-semibold text-sm">{req.sender?.firstName} {req.sender?.lastName || ''}</p>
                            <p className="text-xs text-base-content/50">Elo: {req.sender?.eloRating || 1200}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => handleRespondRequest(req._id, 'accept')} disabled={actionLoadingId === req._id}
                              className="btn btn-sm btn-success rounded-xl gap-1">
                              {actionLoadingId === req._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Accept</>}
                            </button>
                            <button onClick={() => handleRespondRequest(req._id, 'reject')} disabled={actionLoadingId === req._id}
                              className="btn btn-sm btn-outline btn-error rounded-xl gap-1">
                              <X className="w-4 h-4" /> Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sent */}
                <div>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-info" /> Sent Requests
                    {sentRequests.length > 0 && <span className="badge badge-info badge-sm">{sentRequests.length}</span>}
                  </h2>
                  {sentRequests.length === 0 ? (
                    <div className="text-center py-10 bg-base-200/30 rounded-2xl border border-dashed border-base-300">
                      <Clock className="w-8 h-8 mx-auto text-base-content/15 mb-2" />
                      <p className="text-sm text-base-content/50">No pending sent requests</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sentRequests.map(req => (
                        <div key={req._id} className="flex items-center gap-4 p-4 rounded-2xl border border-base-300 bg-base-100">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-bold shrink-0 cursor-pointer"
                            onClick={() => navigate(`/profile/${req.receiver._id}`)}>
                            {req.receiver?.firstName?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/profile/${req.receiver._id}`)}>
                            <p className="font-semibold text-sm">{req.receiver?.firstName} {req.receiver?.lastName || ''}</p>
                            <p className="text-xs text-base-content/50">Elo: {req.receiver?.eloRating || 1200}</p>
                          </div>
                          <span className="badge badge-outline gap-1"><Clock className="w-3 h-3" /> Pending</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Friends */}
            {activeTab === 'friends' && (
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-info" /> My Friends</h2>
                {friendsLoading ? (
                  <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-base-200 rounded-2xl animate-pulse" />)}</div>
                ) : friends.length === 0 ? (
                  <div className="text-center py-16 bg-base-200/30 rounded-3xl border border-dashed border-base-300">
                    <Users className="w-14 h-14 mx-auto text-base-content/15 mb-3" />
                    <h3 className="font-bold text-lg mb-1">No friends yet</h3>
                    <p className="text-base-content/50 text-sm mb-4">Search for users or check the Top 10!</p>
                    <button onClick={() => setActiveTab('discover')} className="btn btn-primary btn-sm rounded-full">Discover People</button>
                  </div>
                ) : (
                  <div className="space-y-2">{friends.map(f => <UserCard key={f._id} userData={f} />)}</div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
