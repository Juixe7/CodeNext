import { NavLink } from 'react-router';
import { Home, Code2, AlertTriangle } from 'lucide-react';

function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 via-base-200 to-base-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-8">
        <div className="text-[8rem] font-black text-base-300 leading-none select-none">404</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-base-100 rounded-2xl p-4 shadow-xl border border-base-300">
            <AlertTriangle className="w-10 h-10 text-warning" />
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-3">Page Not Found</h1>
      <p className="text-base-content/60 max-w-sm mb-8 leading-relaxed">
        Looks like this route doesn't exist. Maybe the problem was deleted, or you typed the wrong URL.
      </p>

      <div className="flex gap-3">
        <NavLink to="/" className="btn btn-primary gap-2 shadow-lg shadow-primary/20">
          <Home className="w-4 h-4" /> Back to Home
        </NavLink>
        <NavLink to="/login" className="btn btn-outline gap-2">
          <Code2 className="w-4 h-4" /> Problems List
        </NavLink>
      </div>

      <div className="mt-16 font-mono text-xs text-base-content/20 bg-base-200 px-4 py-2 rounded-lg">
        Error 404 · CodeNEXT
      </div>
    </div>
  );
}

export default NotFound;
