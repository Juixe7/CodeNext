import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Search, Loader2 } from 'lucide-react';
import axiosClient from '../utils/axiosClient';

export default function UserSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchUsers = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }
      setLoading(true);
      try {
        const res = await axiosClient.get(`/user/search?q=${query}`);
        setResults(res.data);
        setIsOpen(true);
      } catch (err) {
        console.error('Search failed');
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative flex items-center">
        <Search className="w-4 h-4 absolute left-3 text-base-content/50" />
        <input 
          type="text" 
          placeholder="Search coders..." 
          className="input input-sm input-bordered pl-9 bg-base-200/50 w-full sm:w-64 rounded-full transition-all focus:w-72"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
        />
        {loading && <Loader2 className="w-4 h-4 absolute right-3 animate-spin text-base-content/50" />}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-2 bg-base-100 border border-base-300 rounded-2xl shadow-xl overflow-hidden z-50">
          {results.map(user => (
            <li 
              key={user._id} 
              className="px-4 py-3 hover:bg-base-200 cursor-pointer flex items-center gap-3 transition-colors"
              onClick={() => {
                setIsOpen(false);
                setQuery('');
                navigate(`/profile/${user._id}`);
              }}
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                {user.firstName[0]}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold truncate">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-base-content/50 truncate">Elo: {user.eloRating || 1200}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
