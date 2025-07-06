import {Routes, Route ,Navigate} from "react-router";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Homepage from "./pages/Homepage";
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from "./authSlice";
import { useEffect } from "react";
import AdminPanel from "./components/AdminPanel";
import ProblemPage from "./pages/ProblemPage"
import Admin from "./pages/Admin";
import AdminVideo from "./components/AdminVideo"
import AdminDelete from "./components/AdminDelete"
import AdminUpload from "./components/AdminUpload"
import { ThemeProvider } from "./contexts/ThemeContext";

function App(){
  
  const dispatch = useDispatch();
  const {isAuthenticated,user,loading} = useSelector((state)=>state.auth);

  // check initial authentication
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-base-content/70">Loading your coding journey...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-base-100 transition-colors duration-300">
        <Routes>
          <Route path="/" element={isAuthenticated ?<Homepage></Homepage>:<Navigate to="/signup" />}></Route>
          <Route path="/login" element={isAuthenticated?<Navigate to="/" />:<Login></Login>}></Route>
          <Route path="/signup" element={isAuthenticated?<Navigate to="/" />:<Signup></Signup>}></Route>
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