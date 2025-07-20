import { NavLink } from 'react-router';
import { Code2, Terminal, Brain, Trophy, ArrowRight, Zap, Target, Users, BookOpen } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import logoRoadCode from '../assets/RoadCodeLogo.jpg';

const features = [
  {
    icon: <Terminal className="w-6 h-6" />,
    title: "Integrated Code Editor",
    description: "Write, run, and test your code directly in the browser with our powerful Monaco-based editor supporting C++, Java, and JavaScript."
  },
  {
    icon: <Brain className="w-6 h-6" />,
    title: "AI-Powered Assistance",
    description: "Stuck on a problem? Chat with our built-in AI assistant to get hints, code explanations, and debugging help instantly."
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: "Curated DSA Roadmap",
    description: "Follow a structured learning path from basic Arrays to advanced Dynamic Programming and Graph algorithms."
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Lightning Fast Execution",
    description: "Experience zero-lag code compilation and execution powered by Judge0 infrastructure."
  }
];

const topics = [
  { name: "Arrays & Hashing", count: "50+ Problems", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  { name: "Two Pointers", count: "30+ Problems", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  { name: "Linked Lists", count: "25+ Problems", color: "bg-pink-500/10 text-pink-500 border-pink-500/20" },
  { name: "Trees & Graphs", count: "60+ Problems", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  { name: "Dynamic Programming", count: "45+ Problems", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  { name: "Math & Geometry", count: "20+ Problems", color: "bg-rose-500/10 text-rose-500 border-rose-500/20" }
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-base-100 flex flex-col font-sans transition-colors duration-300">
      {/* Navbar */}
      <nav className="navbar bg-base-100/80 backdrop-blur-md sticky top-0 z-50 border-b border-base-300 px-6">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <img 
              src={logoRoadCode} 
              alt="RoadCode Logo" 
              className="w-10 h-10 rounded-xl object-cover shadow-sm"
            />
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              RoadCode
            </span>
          </div>
        </div>
        <div className="flex-none gap-4">
          <ThemeToggle size="sm" />
          <NavLink to="/login" className="btn btn-ghost btn-sm font-medium">Log in</NavLink>
          <NavLink to="/signup" className="btn btn-primary btn-sm shadow-lg shadow-primary/20">Get Started</NavLink>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow">
        <section className="relative px-6 py-24 lg:py-32 overflow-hidden flex flex-col items-center justify-center text-center min-h-[80vh]">
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -z-10 opacity-50 pointer-events-none"></div>
          
          <div className="badge badge-primary badge-outline mb-8 py-3 px-4 shadow-sm">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Trophy className="w-4 h-4" /> The Ultimate Coding Journey
            </span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mb-8 leading-tight">
            Master Algorithms.<br/>
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Crack the Interview.
            </span>
          </h1>
          
          <p className="text-lg lg:text-xl text-base-content/70 max-w-2xl mb-12 leading-relaxed">
            A comprehensive, interactive platform to learn Data Structures and Algorithms. Write code, test against edge cases, and get AI-powered hints when you're stuck.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <NavLink to="/signup" className="btn btn-primary btn-lg gap-2 shadow-xl shadow-primary/20">
              Start Coding for Free
              <ArrowRight className="w-5 h-5" />
            </NavLink>
            <NavLink to="/login" className="btn btn-outline btn-lg gap-2 bg-base-100">
              <Code2 className="w-5 h-5" />
              View Problems
            </NavLink>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 bg-base-200/50 border-y border-base-300">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Everything you need to excel</h2>
              <p className="text-base-content/60 max-w-2xl mx-auto">Built from the ground up to provide the best possible learning experience for aspiring software engineers.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {features.map((feature, idx) => (
                <div key={idx}
                  className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="card-body">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                      idx === 0 ? 'bg-primary/10 text-primary' :
                      idx === 1 ? 'bg-secondary/10 text-secondary' :
                      idx === 2 ? 'bg-accent/10 text-accent' : 'bg-success/10 text-success'
                    }`}>
                      {feature.icon}
                    </div>
                    <h3 className="card-title text-xl mb-2">{feature.title}</h3>
                    <p className="text-base-content/70 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Topics Section */}
        <section className="py-24">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="flex flex-col lg:flex-row gap-12 items-center">
              <div className="lg:w-1/3">
                <h2 className="text-3xl lg:text-4xl font-bold mb-6 leading-tight">Master every topic.</h2>
                <p className="text-base-content/70 mb-8 leading-relaxed">
                  We've organized the most important interview questions into logical categories. Build your foundational knowledge before tackling complex graph and dynamic programming problems.
                </p>
                <div className="flex items-center gap-4 text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <span>200+ Problems</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-secondary" />
                    <span>Active Community</span>
                  </div>
                </div>
              </div>
              
              <div className="lg:w-2/3 grid sm:grid-cols-2 gap-4 w-full">
                {topics.map((topic, idx) => (
                  <NavLink to="/signup" key={idx}
                    className={`p-5 rounded-2xl border ${topic.color} hover:scale-[1.02] transition-all duration-200 cursor-pointer flex justify-between items-center group`}
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    <div>
                      <h4 className="font-bold text-base text-base-content mb-0.5">{topic.name}</h4>
                      <span className="text-xs opacity-70">{topic.count}</span>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-base-100/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10 relative overflow-hidden">
          <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
            <h2 className="text-4xl font-bold mb-6">Ready to start your journey?</h2>
            <p className="text-xl text-base-content/70 mb-10">Join thousands of developers leveling up their coding skills.</p>
            <NavLink to="/signup" className="btn btn-primary btn-lg shadow-xl shadow-primary/20 w-full sm:w-auto">
              Create your free account
            </NavLink>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer footer-center p-10 bg-base-200 text-base-content border-t border-base-300">
        <aside>
          <div className="flex items-center gap-2 mb-2">
            <img src={logoRoadCode} alt="Logo" className="w-8 h-8 rounded-lg grayscale opacity-70" />
            <span className="font-bold text-lg tracking-tight">RoadCode</span>
          </div>
          <p className="opacity-60 text-sm">© {new Date().getFullYear()} RoadCode. All rights reserved.</p>
        </aside>
      </footer>
    </div>
  );
}

export default LandingPage;
