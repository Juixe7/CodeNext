import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = ({ className = '', size = 'md' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  return (
    <button
      onClick={toggleTheme}
      className={`btn btn-circle btn-ghost ${sizeClasses[size]} ${className} transition-all duration-300 hover:scale-110`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Sun Icon */}
        <Sun 
          size={iconSizes[size]} 
          className={`absolute transition-all duration-500 ${
            isDark 
              ? 'rotate-90 scale-0 opacity-0' 
              : 'rotate-0 scale-100 opacity-100'
          }`}
        />
        
        {/* Moon Icon */}
        <Moon 
          size={iconSizes[size]} 
          className={`absolute transition-all duration-500 ${
            isDark 
              ? 'rotate-0 scale-100 opacity-100' 
              : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>
    </button>
  );
};

export default ThemeToggle;
