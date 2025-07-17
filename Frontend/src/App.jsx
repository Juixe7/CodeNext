import {Routes, Route ,Navigate} from "react-router";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Homepage from "./pages/Homepage";
import LandingPage from "./pages/LandingPage";
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from "./authSlice";
import { useEffect, useState } from "react";
import AdminPanel from "./components/AdminPanel";
import ProblemPage from "./pages/ProblemPage"
import Admin from "./pages/Admin";
import AdminVideo from "./components/AdminVideo"
import AdminDelete from "./components/AdminDelete"
import AdminUpload from "./components/AdminUpload"
import { ThemeProvider } from "./contexts/ThemeContext";
import { pingServer } from "./utils/axiosClient";

function App(){
  const [serverPinged, setServerPinged] = useState(false);
  const dispatch = useDispatch();
  const {isAuthenticated,user,loading} = useSelector((state)=>state.auth);

  useEffect(() => {
    // Ping the server first to wake the Render dyno, then check auth.
    // This prevents a 10-second timeout on cold starts.
    pingServer();
    setServerPinged(true);
  }, []);

  // Only dispatch checkAuth after we've sent the wake-up ping
  useEffect(() => {
    if (serverPinged) {
      dispatch(checkAuth());
    }
  }, [dispatch, serverPinged]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-base-content/70">Loading your coding journey...</p>
          <p className="mt-2 text-base-content/40 text-sm">If this is your first visit in a while, the server may be waking up (up to 60s).</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-base-100 transition-colors duration-300">
        <Routes>
          <Route path="/" element={isAuthenticated ? <Homepage /> : <LandingPage />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
          <Route path="/signup" element={isAuthenticated ? <Navigate to="/" /> : <Signup />} />
          <Route path="/admin" element={isAuthenticated && user?.role === 'admin' ? <Admin /> : <Navigate to="/" />} />
          <Route path="/admin/create" element={isAuthenticated && user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/" />} />
          <Route path="/admin/delete" element={isAuthenticated && user?.role === 'admin' ? <AdminDelete /> : <Navigate to="/" />} />
          <Route path="/admin/video" element={isAuthenticated && user?.role === 'admin' ? <AdminVideo /> : <Navigate to="/" />} />
          <Route path="/admin/upload/:problemId" element={isAuthenticated && user?.role === 'admin' ? <AdminUpload /> : <Navigate to="/" />} />
          <Route path="/problem/:problemId" element={<ProblemPage/>}></Route>
        </Routes>
      </div>
    </ThemeProvider>
  )
}

export default App;