import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useSelector } from 'react-redux';
import { Trophy, Users, Code, Calendar, Loader2, ArrowLeft, UserPlus, UserMinus, Flame, Swords, XCircle } from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import ThemeToggle from '../components/ThemeToggle';
import toast from 'react-hot-toast';

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useSelector(state => state.auth);
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // If no ID is provided in URL, show the current logged-in user's profile
  const profileId = id || currentUser?._id;
  const isOwnProfile = profileId === currentUser?._id;

  useEffect(() => {
    if (!profileId) return;
    
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await axiosClient.get(`/user/public-profile/${profileId}`);
        setProfileData(response.data);
        setIsFriend(response.data.isFriend || false);
      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [profileId, isOwnProfile, currentUser]);

  const handleToggleFriend = async () => {
    setActionLoading(true);
    try {
      const res = await axiosClient.post(`/user/friend/${profileId}`);
      setIsFriend(res.data.isFriend);
      toast.success(res.data.isFriend ? 'Added to friends!' : 'Removed from friends');
    } catch (err) {
      toast.error('Failed to update friends list');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100 text-center">
        <div>
          <h1 className="text-4xl font-bold mb-4">User Not Found</h1>
          <button onClick={() => navigate('/')} className="btn btn-primary">Go Home</button>
        </div>
      </div>
    );
  }

  const { profile, recentSubmissions, recentMatches } = profileData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 via-base-200 to-base-100">
      {/* Navbar */}
      <nav className="navbar bg-base-100/80 backdrop-blur-md border-b border-base-300 px-6 sticky top-0 z-50">
        <div className="flex-1">
          <button onClick={() => navigate(-1)} className="btn btn-ghost gap-2">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
        </div>
        <div className="flex-none gap-3">
          <ThemeToggle size="sm" />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Profile Header */}
        <div className="bg-base-100 rounded-3xl p-8 shadow-xl border border-base-300 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
          
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            {/* Avatar Placeholder */}
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl font-bold text-primary-content shadow-lg shadow-primary/30">
              {profile.firstName[0].toUpperCase()}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-extrabold mb-2">{profile.firstName} {profile.lastName}</h1>
              <p className="text-base-content/60 text-lg mb-4 flex items-center justify-center md:justify-start gap-2">
                <Trophy className="w-5 h-5 text-warning" />
                Elo Rating: <span className="font-bold text-base-content">{profile.eloRating || 1200}</span>
              </p>

              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <div className="badge badge-lg badge-outline gap-2 p-4">
                  <Flame className="w-4 h-4 text-error" /> {profile.streak || 0} Day Streak
                </div>
                <div className="badge badge-lg badge-outline gap-2 p-4">
                  <Users className="w-4 h-4 text-info" /> {profile.friends?.length || 0} Friends
                </div>
                <div className="badge badge-lg badge-outline gap-2 p-4">
                  <Trophy className="w-4 h-4 text-success" /> {profile.battleWins || 0} Wins
                </div>
              </div>
            </div>

            {/* Actions */}
            {!isOwnProfile && (
              <div className="w-full md:w-auto mt-6 md:mt-0">
                <button 
                  onClick={handleToggleFriend} 
                  disabled={actionLoading}
                  className={`btn btn-lg w-full md:w-48 shadow-lg transition-all ${isFriend ? 'btn-outline' : 'btn-primary shadow-primary/20 hover:shadow-primary/40'}`}
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                   isFriend ? <><UserMinus className="w-5 h-5"/> Remove Friend</> : 
                   <><UserPlus className="w-5 h-5"/> Add Friend</>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Friends List */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-base-100 rounded-3xl p-6 shadow-xl border border-base-300">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-info" /> Friends
              </h3>
              {profile.friends && profile.friends.length > 0 ? (
                <div className="space-y-3">
                  {profile.friends.map(friend => (
                    <div key={friend._id} className="flex items-center justify-between p-3 bg-base-200 rounded-2xl cursor-pointer hover:bg-base-300 transition-colors" onClick={() => {
                        navigate(`/profile/${friend._id}`);
                        window.scrollTo(0,0);
                      }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                          {friend.firstName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{friend.firstName} {friend.lastName}</p>
                          <p className="text-xs text-base-content/60">Elo: {friend.eloRating || 1200}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-base-content/50 text-sm italic text-center py-6">No friends yet.</p>
              )}
            </div>
          </div>

          {/* Right Column: Recent Activity & Battle History */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Battle History */}
            <div className="bg-base-100 rounded-3xl p-6 shadow-xl border border-base-300">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Swords className="w-5 h-5 text-warning" /> Battle History
              </h3>
              
              {recentMatches && recentMatches.length > 0 ? (
                <div className="space-y-3">
                  {recentMatches.map(match => {
                    const isWinner = match.winner?._id === profile._id;
                    const opponent = match.players.find(p => p._id !== profile._id);
                    
                    return (
                      <div key={match._id} className={`p-4 rounded-2xl border ${isWinner ? 'bg-success/5 border-success/20' : 'bg-error/5 border-error/20'} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
                        <div className="flex flex-col">
                          <span className="font-bold text-lg flex items-center gap-2">
                            {isWinner ? <Trophy className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-error" />}
                            {isWinner ? 'Victory' : 'Defeat'}
                          </span>
                          <span className="text-sm text-base-content/70 mt-1">
                            vs <span className="font-semibold">{opponent?.firstName || 'Unknown'} {opponent?.lastName || ''}</span>
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium cursor-pointer hover:text-primary transition-colors" onClick={() => navigate(`/problem/${match.problem?._id}`)}>
                            {match.problem?.title || 'Unknown Problem'}
                          </p>
                          <p className="text-xs text-base-content/50 mt-1">
                            {new Date(match.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-base-200 rounded-2xl border border-dashed border-base-300">
                  <Swords className="w-10 h-10 mx-auto text-base-content/20 mb-3" />
                  <p className="text-base-content/50">No battles fought yet.</p>
                </div>
              )}
            </div>

            {/* Recent Submissions */}
            <div className="bg-base-100 rounded-3xl p-6 shadow-xl border border-base-300">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Code className="w-5 h-5 text-primary" /> Recent Submissions
              </h3>
              
              {recentSubmissions && recentSubmissions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>Problem</th>
                        <th>Status</th>
                        <th>Language</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSubmissions.map(sub => (
                        <tr key={sub._id}>
                          <td className="font-medium cursor-pointer hover:text-primary transition-colors" onClick={() => navigate(`/problem/${sub.problemId?._id}`)}>
                            {sub.problemId?.title || 'Unknown Problem'}
                          </td>
                          <td>
                            <span className={`badge ${sub.status === 'accepted' ? 'badge-success' : 'badge-error'} badge-sm`}>
                              {sub.status}
                            </span>
                          </td>
                          <td className="capitalize">{sub.language}</td>
                          <td className="text-xs text-base-content/60">
                            {new Date(sub.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-base-200 rounded-2xl border border-dashed border-base-300">
                  <Code className="w-12 h-12 mx-auto text-base-content/20 mb-3" />
                  <p className="text-base-content/50">No recent submissions found.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
