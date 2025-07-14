import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';
import { logoutUser } from '../authSlice';
import { Code, Trophy, Filter, Search, User, LogOut, Settings, BookOpen } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import logoRoadCode from '../assets/logoRoadCode.jpg';

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
      <div className="container mx-auto p-6">
        {/* Stats Section */}
        <div className="stats shadow w-full mb-8">
          <div className="stat">
            <div className="stat-figure text-primary">
              <BookOpen className="w-8 h-8" />
            </div>
            <div className="stat-title">Total Problems</div>
            <div className="stat-value text-primary">{problems.length}</div>
          </div>
          
          <div className="stat">
            <div className="stat-figure text-success">
              <Trophy className="w-8 h-8" />
            </div>
            <div className="stat-title">Solved</div>
            <div className="stat-value text-success">{solvedProblems.length}</div>
          </div>
          
          <div className="stat">
            <div className="stat-figure text-info">
              <Code className="w-8 h-8" />
            </div>
            <div className="stat-title">Success Rate</div>
            <div className="stat-value text-info">
              {problems.length > 0 ? Math.round((solvedProblems.length / problems.length) * 100) : 0}%
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card bg-base-100 shadow-xl mb-8 border border-base-300">
          <div className="card-body">
            <h2 className="card-title mb-4">
              <Filter className="w-5 h-5" />
              Search & Filter
            </h2>
            
            {/* Search Bar */}
            <div className="form-control mb-4">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Search problems by title or tags..."
                  className="input input-bordered w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="btn btn-square btn-primary">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="form-control">
                <select 
                  className="select select-bordered select-sm"
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="all">All Problems</option>
                  <option value="solved">Solved</option>
                  <option value="unsolved">Unsolved</option>
                </select>
              </div>

              <div className="form-control">
                <select 
                  className="select select-bordered select-sm"
                  value={filters.difficulty}
                  onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="form-control">
                <select 
                  className="select select-bordered select-sm"
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
          </div>
        </div>

        {/* Problems List */}
        <div className="grid gap-6">
          {filteredProblems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">No problems found</h3>
              <p className="text-base-content/70">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredProblems.map(problem => (
              <div key={problem._id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 border border-base-300">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h2 className="card-title text-lg">
                          <NavLink 
                            to={`/problem/${problem._id}`} 
                            className="hover:text-primary transition-colors duration-200"
                          >
                            {problem.title}
                          </NavLink>
                        </h2>
                        {solvedProblems.some(sp => sp._id === problem._id) && (
                          <div className="badge badge-success gap-1">
                            <Trophy className="w-3 h-3" />
                            Solved
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <div className={`badge ${getDifficultyColor(problem.difficulty)} gap-1`}>
                          {getDifficultyIcon(problem.difficulty)}
                          {problem.difficulty}
                        </div>
                        <div className="badge badge-outline badge-info">
                          {problem.tags}
                        </div>
                      </div>
                      
                      <p className="text-base-content/70 text-sm line-clamp-2">
                        Click to view problem details and start coding...
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <NavLink 
                        to={`/problem/${problem._id}`}
                        className="btn btn-primary btn-sm"
                      >
                        <Code className="w-4 h-4 mr-1" />
                        Solve
                      </NavLink>
                    </div>
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