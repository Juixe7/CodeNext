import { Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router";
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from "./authSlice";
import { ThemeProvider } from "./contexts/ThemeContext";
import { pingServer } from "./utils/axiosClient";
import { Toaster } from "react-hot-toast";
import { HelmetProvider } from "react-helmet-async";
import ErrorBoundary from "./components/ErrorBoundary";

// Eagerly loaded (needed immediately)
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Lazy loaded (only when navigated to)
const Homepage    = lazy(() => import("./pages/Homepage"));
const ProblemPage = lazy(() => import("./pages/ProblemPage"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const BattleLobby = lazy(() => import("./pages/BattleLobby"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const People     = lazy(() => import("./pages/People"));
const Chat       = lazy(() => import("./pages/Chat"));
const NotFound    = lazy(() => import("./pages/NotFound"));
const Admin       = lazy(() => import("./pages/Admin"));
const AdminPanel  = lazy(() => import("./components/AdminPanel"));
const AdminUpdate = lazy(() => import("./components/AdminUpdate"));
const AdminDelete = lazy(() => import("./components/AdminDelete"));
const AdminVideo  = lazy(() => import("./components/AdminVideo"));
const AdminUpload = lazy(() => import("./components/AdminUpload"));

// Full-page skeleton while lazy chunks load
const PageLoader = () => (
  <div className="min-h-screen bg-base-100 flex items-center justify-center">
    <div className="text-center">
      <span className="loading loading-spinner loading-lg text-primary" />
      <p className="mt-3 text-base-content/50 text-sm">Loading...</p>
    </div>
  </div>
);

// Server cold-start splash
const ColdStartLoader = () => {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
      <div className="text-center max-w-sm px-4">
        <span className="loading loading-dots loading-lg text-primary mb-4" />
        <h2 className="font-bold text-lg mb-2">Waking up the server...</h2>
        <p className="text-base-content/50 text-sm mb-4">
          The free-tier server sleeps after 15 minutes of inactivity. This usually takes 30–60 seconds.
        </p>
        {/* Progress bar */}
        <div className="w-full bg-base-300 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-1000"
            style={{ width: `${Math.min((secs / 60) * 100, 95)}%` }}
          />
        </div>
        <p className="text-xs text-base-content/30 mt-2">{secs}s elapsed</p>
      </div>
    </div>
  );
};

function App() {
  const [serverPinged, setServerPinged] = useState(false);
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    pingServer();
    setServerPinged(true);
  }, []);

  useEffect(() => {
    if (serverPinged) dispatch(checkAuth());
  }, [dispatch, serverPinged]);

  if (loading) return <ColdStartLoader />;

  const isAdmin = isAuthenticated && user?.role === 'admin';

  return (
    <HelmetProvider>
      <ThemeProvider>
        {/* Global Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' }, duration: 4000 },
          }}
        />

        <div className="min-h-screen bg-base-100 transition-colors duration-300">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"        element={isAuthenticated ? <Homepage />  : <LandingPage />} />
              <Route path="/login"   element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
              <Route path="/signup"  element={isAuthenticated ? <Navigate to="/" /> : <Signup />} />

              {/* Protected user routes */}
              <Route path="/leaderboard" element={isAuthenticated ? <Leaderboard /> : <Navigate to="/" />} />
              <Route path="/battle"      element={isAuthenticated ? <BattleLobby /> : <Navigate to="/" />} />
              <Route path="/profile"     element={isAuthenticated ? <UserProfile /> : <Navigate to="/" />} />
              <Route path="/profile/:id" element={isAuthenticated ? <UserProfile /> : <Navigate to="/" />} />
              <Route path="/people"      element={isAuthenticated ? <People />      : <Navigate to="/" />} />
              <Route path="/chat"        element={isAuthenticated ? <Chat />        : <Navigate to="/" />} />
              <Route path="/chat/:userId" element={isAuthenticated ? <Chat />       : <Navigate to="/" />} />
              <Route path="/problem/:problemId" element={<ProblemPage />} />

              {/* Admin routes */}
              <Route path="/admin"              element={isAdmin ? <Admin />        : <Navigate to="/" />} />
              <Route path="/admin/create"       element={isAdmin ? <AdminPanel />   : <Navigate to="/" />} />
              <Route path="/admin/update"       element={isAdmin ? <AdminUpdate />  : <Navigate to="/" />} />
              <Route path="/admin/delete"       element={isAdmin ? <AdminDelete />  : <Navigate to="/" />} />
              <Route path="/admin/video"        element={isAdmin ? <AdminVideo />   : <Navigate to="/" />} />
              <Route path="/admin/upload/:problemId" element={isAdmin ? <AdminUpload /> : <Navigate to="/" />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;