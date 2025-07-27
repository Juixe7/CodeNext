import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';
import { logoutUser } from '../authSlice';
import { Code, Trophy, Search, User, Users, LogOut, Settings, BookOpen, TrendingUp, CheckCircle, Flame, Swords } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import logoRoadCode from '../assets/RoadCodeLogo.jpg';
import ActivityHeatmap from '../components/ActivityHeatmap';
import UserSearch from '../components/UserSearch';
import ErrorBoundary from '../components/ErrorBoundary';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';

// Skeleton row for problem list
const ProblemSkeleton = () => (
  <div className="card bg-base-100 border border-base-300 p-5 flex flex-row items-center gap-4 animate-pulse">
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-base-300 rounded w-2/3" />
      <div className="flex gap-2">
        <div className="h-3 bg-base-300 rounded w-14" />
        <div className="h-3 bg-base-300 rounded w-14" />
      </div>
    </div>
    <div className="h-9 w-28 bg-base-300 rounded-lg" />
  </div>
);

// Animated counter
const AnimatedCount = ({ value }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(value) || 0;
    if (end === 0) return;
    const duration = 800;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start = Math.min(start + step, end);
      setDisplay(start);
      if (start >= end) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display}</span>;
};

function Homepage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [problems, setProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [loadingProblems, setLoadingProblems] = useState(true);
  const [bookmarked, setBookmarked] = useState(new Set());
  const [streak, setStreak] = useState(0);
  const [filters, setFilters] = useState({ difficulty: 'all', tag: 'all', status: 'all' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoadingProblems(true);
      try {
        const { data } = await axiosClient.get('/problem/getAllProblem');
        setProblems(data);
      } catch (error) { console.error(error); }
      finally { setLoadingProblems(false); }
    };
    const fetchSolved = async () => {
      try {
        const { data } = await axiosClient.get('/problem/problemSolvedByUser');
        setSolvedProblems(data);
      } catch {}
    };
    fetchAll();
    if (user) {
      fetchSolved();
      axiosClient.get('/user/streak').then(r => setStreak(r.data.streak || 0)).catch(() => {});
      axiosClient.get('/user/profile').then(r => {
        const ids = (r.data.bookmarkedProblems || []).map(b => b._id || b);
        setBookmarked(new Set(ids));
      }).catch(() => {});
    }
  }, [user]);

  const handleLogout = () => { dispatch(logoutUser()); setSolvedProblems([]); setBookmarked(new Set()); };

  const toggleBookmark = async (e, problemId) => {
    e.preventDefault(); e.stopPropagation();
    const wasBookmarked = bookmarked.has(problemId);
    // Optimistic update
    const newSet = new Set(bookmarked);
    if (wasBookmarked) newSet.delete(problemId); else newSet.add(problemId);
    setBookmarked(newSet);
    try {
      const res = await axiosClient.post(`/user/bookmark/${problemId}`);
      if (res.data.bookmarked) {
        toast.success('Bookmarked!', { icon: '⭐' });
      } else {
        toast('Bookmark removed', { icon: '☆' });
      }
    } catch (err) {
      // Rollback on error
      setBookmarked(bookmarked);
      toast.error('Failed to update bookmark');
    }
  };

  const filteredProblems = problems.filter(p => {
    const diffOk   = filters.difficulty === 'all' || p.difficulty === filters.difficulty;
    const tagOk    = filters.tag === 'all' || p.tags === filters.tag;
    const solved   = solvedProblems.some(sp => sp._id === p._id);
    const statusOk = filters.status === 'all' || (filters.status === 'solved' && solved) || (filters.status === 'unsolved' && !solved);
    const searchOk = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.tags.toLowerCase().includes(searchQuery.toLowerCase());
    return diffOk && tagOk && statusOk && searchOk;
  });

  const easyCount   = problems.filter(p => p.difficulty === 'easy').length;
  const mediumCount = problems.filter(p => p.difficulty === 'medium').length;
  const hardCount   = problems.filter(p => p.difficulty === 'hard').length;
  const solvedPct   = problems.length > 0 ? Math.round((solvedProblems.length / problems.length) * 100) : 0;

  const diffBadge = { easy: 'badge-success', medium: 'badge-warning', hard: 'badge-error' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 via-base-200 to-base-100 transition-colors duration-300">
      <Helmet>
        <title>RoadCode — Master DSA &amp; Crack Interviews</title>
        <meta name="description" content="Practice Data Structures and Algorithms with AI-powered hints, video editorials, and real-time code execution." />
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
          {/* Desktop Search & Links */}
          <div className="hidden md:flex items-center gap-2">
            <UserSearch />
            {user?.role === 'admin' && (
              <NavLink to="/admin" className="btn btn-ghost btn-sm gap-1">
                <Settings className="w-4 h-4" /> Admin
              </NavLink>
            )}
            <NavLink to="/battle" className="btn btn-ghost btn-sm gap-1 text-primary">
              <Swords className="w-4 h-4" /> Battle
            </NavLink>
            <NavLink to="/people" className="btn btn-ghost btn-sm gap-1">
              <Users className="w-4 h-4" /> People
            </NavLink>
            <NavLink to="/leaderboard" className="btn btn-ghost btn-sm gap-1">
              <Trophy className="w-4 h-4" /> Leaderboard
            </NavLink>
          </div>

          {/* Mobile Menu Dropdown */}
          <div className="dropdown dropdown-end md:hidden">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52 border border-base-300">
              <li className="mb-2">
                <div className="w-full">
                  <UserSearch />
                </div>
              </li>
              {user?.role === 'admin' && (
                <li><NavLink to="/admin" className="py-2"><Settings className="w-4 h-4" /> Admin</NavLink></li>
              )}
              <li><NavLink to="/battle" className="py-2 text-primary"><Swords className="w-4 h-4" /> Battle</NavLink></li>
              <li><NavLink to="/people" className="py-2"><Users className="w-4 h-4" /> People</NavLink></li>
              <li><NavLink to="/leaderboard" className="py-2"><Trophy className="w-4 h-4" /> Leaderboard</NavLink></li>
            </ul>
          </div>

          {streak > 0 && (
            <div className="flex items-center gap-1 bg-orange-400/10 text-orange-400 px-2 py-1 rounded-full text-xs font-semibold">
              <Flame className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{streak} day streak</span><span className="sm:hidden">{streak}</span>
            </div>
          )}
          <ThemeToggle size="sm" />
          <div className="dropdown dropdown-end">
            <div tabIndex={0} className="btn btn-ghost btn-circle">
              <div className="w-9 h-9 rounded-full bg-primary/15 border-2 border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
                {user?.firstName?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
              </div>
            </div>
            <ul className="mt-3 p-2 shadow-xl menu menu-sm dropdown-content bg-base-100 rounded-2xl w-52 border border-base-300">
              <li className="px-3 py-2">
                <div>
                  <p className="font-semibold text-sm">{user?.firstName} {user?.lastName || ''}</p>
                  <p className="text-xs text-base-content/50">{user?.emailId}</p>
                  <div className="flex items-center gap-2 mt-1 font-medium text-xs">
                    <span className="text-warning flex items-center gap-1"><Trophy className="w-3 h-3" /> {user?.eloRating || 1200}</span>
                    <span className="text-base-content/30">|</span>
                    <span className="text-success flex items-center gap-1"><Swords className="w-3 h-3" /> {user?.battleWins || 0}W - {user?.battleLosses || 0}L</span>
                  </div>
                </div>
              </li>
              <div className="divider my-1" />
              <li>
                <NavLink to="/profile" className="hover:bg-base-200 gap-2">
                  <User className="w-4 h-4" /> My Profile
                </NavLink>
              </li>
              <li>
                <button onClick={handleLogout} className="text-error hover:bg-error/10 gap-2">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-6xl">

        {/* Welcome */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-extrabold tracking-tight mb-1">
            Welcome back, <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{user?.firstName || 'Coder'}</span>! 👋
          </h1>
          <p className="text-base-content/50">Keep the momentum going — you're on your way! 🚀</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {/* Total */}
          <div className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-28 h-28 bg-primary/10 rounded-full blur-3xl -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500" />
            <div className="card-body flex-row items-center justify-between p-5 z-10">
              <div>
                <p className="text-xs text-base-content/50 font-medium uppercase tracking-wider mb-1">Total Problems</p>
                <h2 className="text-4xl font-bold"><AnimatedCount value={problems.length} /></h2>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>
            {/* Difficulty breakdown */}
            <div className="px-5 pb-4 flex gap-2 text-xs">
              <span className="text-success font-medium">{easyCount}E</span>
              <span className="text-base-content/30">·</span>
              <span className="text-warning font-medium">{mediumCount}M</span>
              <span className="text-base-content/30">·</span>
              <span className="text-error font-medium">{hardCount}H</span>
            </div>
          </div>

          {/* Solved */}
          <div className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-28 h-28 bg-success/10 rounded-full blur-3xl -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500" />
            <div className="card-body flex-row items-center justify-between p-5 z-10">
              <div>
                <p className="text-xs text-base-content/50 font-medium uppercase tracking-wider mb-1">Solved</p>
                <h2 className="text-4xl font-bold"><AnimatedCount value={solvedProblems.length} /></h2>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center text-success">
                <Trophy className="w-6 h-6" />
              </div>
            </div>
            {/* Progress bar */}
            <div className="px-5 pb-4">
              <div className="w-full bg-base-300 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-success rounded-full transition-all duration-1000" style={{ width: `${solvedPct}%` }} />
              </div>
              <p className="text-xs text-base-content/40 mt-1">{solvedPct}% complete</p>
            </div>
          </div>

          {/* Success Rate */}
          <div className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-28 h-28 bg-info/10 rounded-full blur-3xl -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500" />
            <div className="card-body flex-row items-center justify-between p-5 z-10">
              <div>
                <p className="text-xs text-base-content/50 font-medium uppercase tracking-wider mb-1">Success Rate</p>
                <h2 className="text-4xl font-bold"><AnimatedCount value={solvedPct} />%</h2>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-info/10 flex items-center justify-center text-info">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <div className="px-5 pb-4 text-xs text-base-content/40">
              {problems.length - solvedProblems.length} problems remaining
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="mb-8">
          <ErrorBoundary fallbackTitle="Activity unavailable" fallbackMessage="Could not load your activity heatmap.">
            <ActivityHeatmap />
          </ErrorBoundary>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
            <input
              type="text"
              placeholder="Search problems..."
              className="input input-bordered w-full pl-9 focus:border-primary transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select className="select select-bordered select-sm" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
              <option value="all">All Status</option>
              <option value="solved">✅ Solved</option>
              <option value="unsolved">⭕ Unsolved</option>
            </select>
            <select className="select select-bordered select-sm" value={filters.difficulty} onChange={(e) => setFilters({...filters, difficulty: e.target.value})}>
              <option value="all">All Difficulty</option>
              <option value="easy">🟢 Easy</option>
              <option value="medium">🟡 Medium</option>
              <option value="hard">🔴 Hard</option>
            </select>
            <select className="select select-bordered select-sm" value={filters.tag} onChange={(e) => setFilters({...filters, tag: e.target.value})}>
              <option value="all">All Tags</option>
              <option value="array">Array</option>
              <option value="linkedList">Linked List</option>
              <option value="graph">Graph</option>
              <option value="dp">DP</option>
              <option value="string">String</option>
              <option value="tree">Tree</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        {!loadingProblems && (
          <p className="text-xs text-base-content/40 mb-3">
            Showing {filteredProblems.length} of {problems.length} problems
          </p>
        )}

        {/* Problem List */}
        <div className="space-y-3">
          {loadingProblems ? (
            Array.from({ length: 6 }).map((_, i) => <ProblemSkeleton key={i} />)
          ) : filteredProblems.length === 0 ? (
            <div className="text-center py-20 bg-base-200/30 rounded-3xl border border-dashed border-base-300">
              <Search className="w-10 h-10 mx-auto text-base-content/20 mb-3" />
              <h3 className="font-bold mb-1">No problems found</h3>
              <p className="text-base-content/50 text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredProblems.map((problem, i) => {
              const solved = solvedProblems.some(sp => sp._id === problem._id);
              return (
                <NavLink
                  key={problem._id}
                  to={`/problem/${problem._id}`}
                  className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 group block"
                >
                  <div className="card-body p-4 flex-row items-center gap-4">
                    {/* Number / solved indicator */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold
                      ${solved ? 'bg-success/15 text-success' : 'bg-base-200 text-base-content/40'}`}>
                      {solved ? <CheckCircle className="w-4 h-4" /> : i + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                      {problem.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`badge badge-xs ${diffBadge[problem.difficulty] || 'badge-neutral'}`}>{problem.difficulty}</span>
                      <span className="badge badge-xs badge-outline">{problem.tags}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => toggleBookmark(e, problem._id)}
                      className={`btn btn-ghost btn-xs ${bookmarked.has(problem._id) ? 'text-warning' : 'text-base-content/30 hover:text-warning'}`}
                      title={bookmarked.has(problem._id) ? 'Remove bookmark' : 'Bookmark'}
                    >
                      {bookmarked.has(problem._id) ? '★' : '☆'}
                    </button>
                    <span className="btn btn-primary btn-xs gap-1">
                      <Code className="w-3 h-3" />{solved ? 'Revisit' : 'Solve'}
                    </span>
                  </div>
                  </div>
                </NavLink>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default Homepage;