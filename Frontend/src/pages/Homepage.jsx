import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';
import { logoutUser } from '../authSlice';
import { Code, Trophy, Filter, Search, User, LogOut, Settings, BookOpen } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import logoRoadCode from '../assets/RoadCodeLogo.jpg';

function Homepage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [problems, setProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [filters, setFilters] = useState({
    difficulty: 'all',
    tag: 'all',
    status: 'all' 
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const { data } = await axiosClient.get('/problem/getAllProblem');
        setProblems(data);
      } catch (error) {
        console.error('Error fetching problems:', error);
      }
    };

    const fetchSolvedProblems = async () => {
      try {
        const { data } = await axiosClient.get('/problem/problemSolvedByUser');
        setSolvedProblems(data);
      } catch (error) {
        console.error('Error fetching solved problems:', error);
      }
    };

    fetchProblems();
    if (user) fetchSolvedProblems();
  }, [user]);

  const handleLogout = () => {
    dispatch(logoutUser());
    setSolvedProblems([]);
  };

  const filteredProblems = problems.filter(problem => {
    const difficultyMatch = filters.difficulty === 'all' || problem.difficulty === filters.difficulty;
    const tagMatch = filters.tag === 'all' || problem.tags === filters.tag;
    const statusMatch = filters.status === 'all' || 
                      (filters.status === 'solved' && solvedProblems.some(sp => sp._id === problem._id)) ||
                      (filters.status === 'unsolved' && !solvedProblems.some(sp => sp._id === problem._id));
    const searchMatch = problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       problem.tags.toLowerCase().includes(searchQuery.toLowerCase());
    return difficultyMatch && tagMatch && statusMatch && searchMatch;
  });

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'badge-success';
      case 'medium': return 'badge-warning';
      case 'hard': return 'badge-error';
      default: return 'badge-neutral';
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return '🟢';
      case 'medium': return '🟡';
      case 'hard': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 via-base-200 to-base-100 transition-colors duration-300">
      {/* Enhanced Navigation Bar */}
      <nav className="navbar bg-base-100 shadow-lg border-b border-base-300 px-6 transition-colors duration-300">
        <div className="flex-1">
          <NavLink to="/" className="btn btn-ghost text-xl font-bold flex items-center gap-2 hover:bg-base-200 transition-colors">
            <img 
              src={logoRoadCode} 
              alt="RoadCode Logo" 
              className="w-10 h-10 rounded-full object-cover shadow-md"
            />
            <span className="hidden sm:inline">ROAD-CODE</span>
          </NavLink>
        </div>
        
        <div className="flex-none gap-4">
          {user?.role === 'admin' && (
            <NavLink to="/admin" className="btn btn-ghost btn-sm">
              <Settings className="w-4 h-4 mr-1" />
              Admin
            </NavLink>
          )}
          
          {/* Theme Toggle */}
          <ThemeToggle size="sm" />
          
          <div className="dropdown dropdown-end">
            <div tabIndex={0} className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
            </div>
            <ul className="mt-3 p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52 border border-base-300">
              <li className="menu-title">
                <span className="text-sm font-semibold">{user?.firstName}</span>
              </li>
              <div className="divider my-1"></div>
              <li>
                <button onClick={handleLogout} className="text-error">
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        
        {/* Welcome Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">
            Welcome back, <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{user?.firstName || 'Coder'}</span>! 👋
          </h1>
          <p className="text-base-content/60 text-lg">Pick up where you left off and conquer new algorithms.</p>
        </div>

        {/* Premium Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Total Problems Stat */}
          <div className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
            <div className="card-body flex-row items-center justify-between z-10 p-6">
              <div>
                <p className="text-base-content/60 font-medium mb-1">Total Problems</p>
                <h2 className="text-4xl font-bold text-base-content">{problems.length}</h2>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                <BookOpen className="w-7 h-7" />
              </div>
            </div>
          </div>
          
          {/* Solved Stat */}
          <div className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
            <div className="card-body flex-row items-center justify-between z-10 p-6">
              <div>
                <p className="text-base-content/60 font-medium mb-1">Solved</p>
                <h2 className="text-4xl font-bold text-base-content">{solvedProblems.length}</h2>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center text-success shadow-sm">
                <Trophy className="w-7 h-7" />
              </div>
            </div>
          </div>
          
          {/* Success Rate Stat */}
          <div className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-info/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
            <div className="card-body flex-row items-center justify-between z-10 p-6">
              <div>
                <p className="text-base-content/60 font-medium mb-1">Success Rate</p>
                <h2 className="text-4xl font-bold text-base-content">
                  {problems.length > 0 ? Math.round((solvedProblems.length / problems.length) * 100) : 0}%
                </h2>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-info/10 flex items-center justify-center text-info shadow-sm">
                <Code className="w-7 h-7" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Search Bar (Fixed using join) */}
          <div className="join w-full lg:w-1/2 shadow-sm border border-base-300 rounded-lg">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-base-content/40" />
              </div>
              <input
                type="text"
                placeholder="Search problems by title or tags..."
                className="input join-item w-full pl-10 focus:outline-primary border-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="btn btn-primary join-item px-8">
              Search
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 lg:w-1/2 justify-start lg:justify-end">
            <select 
              className="select select-bordered shadow-sm focus:outline-primary bg-base-100 min-w-[140px]"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="all">All Status</option>
              <option value="solved">✅ Solved</option>
              <option value="unsolved">⭕ Unsolved</option>
            </select>

            <select 
              className="select select-bordered shadow-sm focus:outline-primary bg-base-100 min-w-[140px]"
              value={filters.difficulty}
              onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
            >
              <option value="all">All Difficulties</option>
              <option value="easy">🟢 Easy</option>
              <option value="medium">🟡 Medium</option>
              <option value="hard">🔴 Hard</option>
            </select>

            <select 
              className="select select-bordered shadow-sm focus:outline-primary bg-base-100 min-w-[140px]"
              value={filters.tag}
              onChange={(e) => setFilters({...filters, tag: e.target.value})}
            >
              <option value="all">All Tags</option>
              <option value="array">Array</option>
              <option value="linkedList">Linked List</option>
              <option value="graph">Graph</option>
              <option value="dp">DP</option>
            </select>
          </div>
        </div>

        {/* Problems List */}
        <div className="grid gap-4">
          {filteredProblems.length === 0 ? (
            <div className="text-center py-20 bg-base-200/30 rounded-3xl border border-base-300 border-dashed">
              <div className="w-20 h-20 bg-base-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-base-300">
                <Search className="w-10 h-10 text-base-content/30" />
              </div>
              <h3 className="text-2xl font-bold mb-2">No problems found</h3>
              <p className="text-base-content/60 max-w-sm mx-auto">We couldn't find any problems matching your current search or filters.</p>
            </div>
          ) : (
            filteredProblems.map(problem => (
              <div key={problem._id} className="card bg-base-100 shadow-sm hover:shadow-md transition-all duration-300 border border-base-300 group hover:border-primary/40">
                <div className="card-body p-5 sm:p-6 flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="card-title text-xl font-bold group-hover:text-primary transition-colors">
                        <NavLink to={`/problem/${problem._id}`}>
                          {problem.title}
                        </NavLink>
                      </h2>
                      {solvedProblems.some(sp => sp._id === problem._id) && (
                        <div className="badge badge-success badge-sm gap-1 font-semibold text-xs py-2 px-3 shadow-sm shadow-success/20">
                          <Trophy className="w-3 h-3" /> Solved
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <div className={`badge ${getDifficultyColor(problem.difficulty)} badge-sm font-semibold py-2 px-3 uppercase tracking-wider text-[10px]`}>
                        {problem.difficulty}
                      </div>
                      <div className="badge badge-outline border-base-300 text-base-content/70 badge-sm py-2 px-3 uppercase tracking-wider text-[10px]">
                        {problem.tags}
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full sm:w-auto">
                    <NavLink 
                      to={`/problem/${problem._id}`}
                      className="btn btn-primary w-full sm:w-auto shadow-sm shadow-primary/20 group-hover:shadow-primary/40 group-hover:-translate-y-0.5 transition-all"
                    >
                      <Code className="w-4 h-4 mr-1" />
                      Solve Problem
                    </NavLink>
                  </div>
                  
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Homepage;