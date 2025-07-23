import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useParams, NavLink } from 'react-router';
import axiosClient from "../utils/axiosClient";
import SubmissionHistory from "../components/SubmissionHistory";
import ChatAi from '../components/ChatAi';
import Editorial from '../components/Editorial';
import { Code, Play, Send, ArrowLeft, FileText, Video, MessageSquare, History, CheckCircle, XCircle, Clock, Zap, Copy, Check, Sparkles, ChevronUp, Terminal } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import ProblemTimer from '../components/ProblemTimer';
import AICodeReview from '../components/AICodeReview';
import ErrorBoundary from '../components/ErrorBoundary';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

const langMap = { cpp: 'C++', java: 'Java', javascript: 'JavaScript' };

const difficultyConfig = {
  easy:   { badge: 'badge-success',  text: 'text-success',  bg: 'bg-success/10'  },
  medium: { badge: 'badge-warning',  text: 'text-warning',  bg: 'bg-warning/10'  },
  hard:   { badge: 'badge-error',    text: 'text-error',    bg: 'bg-error/10'    },
};

// Skeleton loader for the left panel
const SkeletonLoader = () => (
  <div className="h-screen flex bg-base-100">
    <div className="w-1/2 flex flex-col border-r border-base-300 p-6 gap-4">
      <div className="h-8 bg-base-300 rounded-lg animate-pulse w-3/4" />
      <div className="h-4 bg-base-300 rounded animate-pulse w-1/4" />
      <div className="h-32 bg-base-300 rounded-lg animate-pulse" />
      <div className="h-24 bg-base-300 rounded-lg animate-pulse" />
      <div className="h-24 bg-base-300 rounded-lg animate-pulse w-5/6" />
    </div>
    <div className="w-1/2 bg-base-200 flex items-center justify-center">
      <div className="text-center">
        <span className="loading loading-dots loading-lg text-primary" />
        <p className="mt-3 text-base-content/50 text-sm">Loading editor...</p>
      </div>
    </div>
  </div>
);

// Copy button with feedback
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="btn btn-xs btn-ghost gap-1" title="Copy code">
      {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
};

// Test case card
const TestCaseCard = ({ tc, index, passed }) => (
  <div className={`rounded-xl border ${passed ? 'border-success/30 bg-success/5' : 'border-error/40 bg-error/5'} overflow-hidden`}>
    <div className={`flex items-center justify-between px-3 py-2 text-xs font-semibold ${passed ? 'text-success bg-success/10' : 'text-error bg-error/10'}`}>
      <span>Test Case {index + 1}</span>
      <span className="flex items-center gap-1">
        {passed ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
        {passed ? 'Passed' : 'Failed'}
      </span>
    </div>
    <div className="p-3 font-mono text-xs space-y-2">
      {tc.stdin && (
        <div>
          <span className="text-base-content/50 block mb-1">Input</span>
          <div className="bg-base-200 rounded px-2 py-1.5">{tc.stdin}</div>
        </div>
      )}
      <div>
        <span className="text-base-content/50 block mb-1">Expected</span>
        <div className="bg-base-200 rounded px-2 py-1.5">{tc.expected_output}</div>
      </div>
      <div>
        <span className="text-base-content/50 block mb-1">Your Output</span>
        <div className={`rounded px-2 py-1.5 ${passed ? 'bg-success/10' : 'bg-error/10'}`}>
          {tc.stdout || tc.compile_output || <span className="text-base-content/40 italic">No output</span>}
        </div>
      </div>
    </div>
  </div>
);

const ProblemPage = () => {
  const [problem, setProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [activeLeftTab, setActiveLeftTab] = useState('description');
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [consoleTab, setConsoleTab] = useState('testcase');
  const [showAccepted, setShowAccepted] = useState(false);
  const [lastSubmit, setLastSubmit] = useState(null);
  
  // Battle state
  const { user } = useSelector(state => state.auth);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const matchId = searchParams.get('matchId');
  const [battleSocket, setBattleSocket] = useState(null);
  const [battleWinner, setBattleWinner] = useState(null); // null, 'me', or 'opponent'
  const navigate = useNavigate();

  const editorRef = useRef(null);
  const { problemId } = useParams();

  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {
        const response = await axiosClient.get(`/problem/problemById/${problemId}`);
        const langDisplay = langMap[selectedLanguage];
        const startCodeObj = response.data.startCode.find(
          sc => sc.language.toLowerCase() === langDisplay.toLowerCase()
        );
        setProblem(response.data);
        setCode(startCodeObj ? startCodeObj.initialCode : '');
      } catch (error) {
        console.error('Error fetching problem:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();

    // Setup Battle Socket if in a match
    if (matchId) {
      const token = localStorage.getItem('token');
      if (token) {
        const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        const SOCKET_URL = isLocalhost ? "http://localhost:3000" : "https://roadcode-a-coding-platform.onrender.com";
        const socket = io(SOCKET_URL, {
          auth: { token }
        });
        setBattleSocket(socket);

        socket.on('match_won', (data) => {
          if (data.winnerId === user?._id) {
            setBattleWinner('me');
          } else {
            setBattleWinner('opponent');
            toast.error(`${data.winner} has solved the problem! You lose.`, { duration: 6000, icon: '💀' });
          }
        });

        socket.on('opponent_progress', (data) => {
          // Could show a toast or small UI indicator
          console.log("Opponent:", data.progress);
        });

        return () => socket.disconnect();
      }
    }
  }, [problemId, matchId, user]);

  useEffect(() => {
    if (problem) {
      const langDisplay = langMap[selectedLanguage];
      const startCodeObj = problem.startCode.find(
        sc => sc.language.toLowerCase() === langDisplay.toLowerCase()
      );
      setCode(startCodeObj ? startCodeObj.initialCode : '');
    }
  }, [selectedLanguage, problem]);

  const handleRun = async () => {
    setLoading(true);
    setRunResult(null);
    const runToast = toast.loading('Running test cases...');
    try {
      if (battleSocket) battleSocket.emit('progress_update', { matchId, progress: 'Running tests...' });

      const response = await axiosClient.post(`/submission/run/${problemId}`, { code, language: selectedLanguage });
      setRunResult(response.data);
      setConsoleTab('testcase');
      setIsConsoleOpen(true);
      toast.dismiss(runToast);
      if (response.data.success) {
        toast.success('All test cases passed!', { icon: '✅' });
      } else {
        toast.error('Some test cases failed.', { icon: '❌' });
      }
    } catch (error) {
      toast.dismiss(runToast);
      toast.error('Run failed. Check your code.');
      setRunResult({ success: false, testCases: [], error: 'Server error' });
      setConsoleTab('testcase');
      setIsConsoleOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCode = async () => {
    setLoading(true);
    setSubmitResult(null);
    setShowAccepted(false);
    const submitToast = toast.loading('Submitting solution...');
    try {
      const response = await axiosClient.post(`/submission/submit/${problemId}`, { code, language: selectedLanguage });
      setSubmitResult(response.data);
      setLastSubmit(response.data);
      setConsoleTab('result');
      setIsConsoleOpen(true);
      toast.dismiss(submitToast);
      if (response.data.accepted) {
        setShowAccepted(true);
        setTimeout(() => setShowAccepted(false), 4000);
        toast.success('🎉 Accepted! Great work!', { duration: 4000 });
      } else {
        toast.error(`Wrong Answer — ${response.data.passedTestCases}/${response.data.totalTestCases} passed`);
      }
    } catch (error) {
      toast.dismiss(submitToast);
      toast.error('Submission failed. Try again.');
      setSubmitResult(null);
      setConsoleTab('result');
      setIsConsoleOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const getMonacoLang = (lang) => lang === 'cpp' ? 'cpp' : lang;

  // Keyboard shortcuts: Ctrl+Enter = Run, Ctrl+Shift+Enter = Submit
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) handleSubmitCode();
        else handleRun();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [code, selectedLanguage]);

  if (loading && !problem) return <SkeletonLoader />;

  const diff = difficultyConfig[problem?.difficulty] || difficultyConfig.easy;
  const pageTitle = problem ? `${problem.title} | ${problem.difficulty} | RoadCode` : 'RoadCode';

  const leftTabs = [
    { id: 'description', label: 'Description', icon: FileText },
    { id: 'editorial',   label: 'Editorial',   icon: Video },
    { id: 'solutions',   label: 'Solutions',   icon: Code },
    { id: 'submissions', label: 'My Submissions', icon: History },
    { id: 'chatAI',      label: 'AI Tutor',    icon: Sparkles },
  ];

  return (
    <div className="h-screen flex flex-col bg-base-100 overflow-hidden">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={problem?.description?.slice(0, 150)} />
      </Helmet>

      {/* ── Battle Overlay ── */}
      {matchId && battleWinner === 'opponent' && (
        <div className="absolute inset-0 z-50 bg-base-300/80 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in-up">
          <div className="bg-base-100 p-8 rounded-3xl shadow-2xl border border-error/20 text-center max-w-md w-full">
            <XCircle className="w-16 h-16 text-error mx-auto mb-4 animate-bounce" />
            <h2 className="text-3xl font-bold mb-2">Defeat!</h2>
            <p className="text-base-content/60 mb-6">Your opponent solved it first.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => navigate('/battle')} className="btn btn-primary">Find New Match</button>
              <button onClick={() => setBattleWinner(null)} className="btn btn-ghost">Review Code</button>
            </div>
          </div>
        </div>
      )}
      
      {matchId && battleWinner === 'me' && (
        <div className="absolute inset-0 z-50 bg-base-300/80 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in-up">
          <div className="bg-base-100 p-8 rounded-3xl shadow-2xl border border-success/20 text-center max-w-md w-full">
            <Trophy className="w-16 h-16 text-warning mx-auto mb-4 animate-bounce" />
            <h2 className="text-3xl font-bold mb-2">Victory!</h2>
            <p className="text-base-content/60 mb-6">You solved it before your opponent! +25 Elo</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => navigate('/battle')} className="btn btn-primary">Next Battle</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Accepted Flash Banner ── */}
      {showAccepted && (
        <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center animate-fade-in-up">
          <div className="bg-success text-success-content px-8 py-4 rounded-2xl shadow-2xl text-2xl font-bold flex items-center gap-3 animate-bounce-in">
            <CheckCircle className="w-8 h-8" /> 🎉 Accepted!
          </div>
        </div>
      )}

      {/* ── Top Navbar ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-base-200 border-b border-base-300 shrink-0">
        <NavLink to="/" className="btn btn-ghost btn-sm gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back
        </NavLink>

        {problem && (
          <div className="flex items-center gap-2 flex-1 mx-4 min-w-0">
            <h1 className="text-sm font-semibold truncate">{problem.title}</h1>
            <span className={`badge badge-sm shrink-0 ${diff.badge}`}>{problem.difficulty}</span>
            <span className="badge badge-sm badge-outline shrink-0">{problem.tags}</span>
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          <ProblemTimer />
          {loading && <span className="loading loading-spinner loading-xs text-primary" />}
          <ThemeToggle size="sm" />
        </div>
      </div>

      {/* ── Main Split Layout ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ═══ LEFT PANEL ═══ */}
        <div className="w-[48%] flex flex-col border-r border-base-300 min-w-0">

          {/* Left Tabs */}
          <div className="flex items-center bg-base-200 border-b border-base-300 overflow-x-auto shrink-0">
            {leftTabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveLeftTab(id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-all duration-150
                  ${activeLeftTab === id
                    ? 'border-primary text-primary bg-base-100'
                    : 'border-transparent text-base-content/60 hover:text-base-content hover:bg-base-300'}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {id === 'chatAI' && <span className="badge badge-xs badge-primary">AI</span>}
              </button>
            ))}
          </div>

          {/* Left Content */}
          <div className="flex-1 overflow-y-auto">
            {problem && (
              <>
                {/* ── Description ── */}
                {activeLeftTab === 'description' && (
                  <div className="p-5 space-y-5 animate-fade-in-up">
                    {/* Problem statement */}
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-sm leading-7 text-base-content/90">
                        {problem.description}
                      </div>
                    </div>

                    {/* Examples */}
                    <div>
                      <h3 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-3">Examples</h3>
                      <div className="space-y-3">
                        {problem.visibleTestCases.map((example, index) => (
                          <div key={index} className="rounded-xl border border-base-300 overflow-hidden bg-base-200/40">
                            <div className="px-4 py-2 bg-base-300/60 text-xs font-semibold text-base-content/70">
                              Example {index + 1}
                            </div>
                            <div className="px-4 py-3 space-y-2 font-mono text-xs">
                              <div className="flex gap-3 items-start">
                                <span className="text-primary font-bold w-20 shrink-0">Input:</span>
                                <code className="bg-base-100 px-2 py-1 rounded flex-1">{example.input}</code>
                              </div>
                              <div className="flex gap-3 items-start">
                                <span className="text-success font-bold w-20 shrink-0">Output:</span>
                                <code className="bg-base-100 px-2 py-1 rounded flex-1">{example.output}</code>
                              </div>
                              {example.explanation && (
                                <div className="flex gap-3 items-start">
                                  <span className="text-info font-bold w-20 shrink-0">Explain:</span>
                                  <span className="bg-base-100 px-2 py-1 rounded flex-1 font-sans">{example.explanation}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Constraints */}
                    <div className="rounded-xl bg-base-200/60 border border-base-300 p-4">
                      <h3 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-2">Constraints</h3>
                      <div className="text-sm text-base-content/70 font-mono">
                        • 1 ≤ n ≤ 10<sup>4</sup>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Editorial ── */}
                {activeLeftTab === 'editorial' && (
                  <div className="p-5 animate-fade-in-up">
                    <h2 className="text-base font-bold mb-4 flex items-center gap-2">
                      <Video className="w-5 h-5 text-primary" /> Editorial
                    </h2>
                    <Editorial secureUrl={problem.secureUrl} thumbnailUrl={problem.thumbnailUrl} duration={problem.duration} />
                  </div>
                )}

                {/* ── Solutions ── */}
                {activeLeftTab === 'solutions' && (
                  <div className="p-5 space-y-4 animate-fade-in-up">
                    <h2 className="text-base font-bold flex items-center gap-2">
                      <Code className="w-5 h-5 text-primary" /> Reference Solutions
                    </h2>
                    {problem.referenceSolution?.length > 0 ? problem.referenceSolution.map((solution, index) => (
                      <div key={index} className="rounded-xl border border-base-300 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 bg-base-300/60">
                          <span className="text-xs font-semibold text-base-content/70">{solution.language}</span>
                          <CopyButton text={solution.completeCode} />
                        </div>
                        <pre className="p-4 text-xs overflow-x-auto bg-base-200/40 max-h-72">
                          <code>{solution.completeCode}</code>
                        </pre>
                      </div>
                    )) : (
                      <div className="text-center py-12">
                        <Code className="w-10 h-10 mx-auto text-base-content/20 mb-3" />
                        <p className="text-base-content/50 text-sm">Solve the problem to unlock solutions.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Submissions ── */}
                {activeLeftTab === 'submissions' && (
                  <div className="p-5 animate-fade-in-up">
                    <h2 className="text-base font-bold flex items-center gap-2 mb-4">
                      <History className="w-5 h-5 text-primary" /> My Submissions
                    </h2>
                    <SubmissionHistory problemId={problemId} />
                  </div>
                )}

                {/* ── AI Tutor ── */}
                {activeLeftTab === 'chatAI' && (
                  <div className="h-full animate-fade-in-up">
                    <ErrorBoundary fallbackTitle="AI Tutor unavailable" fallbackMessage="The AI tutor encountered an error. Please try refreshing.">
                      <ChatAi problem={problem} />
                    </ErrorBoundary>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ═══ RIGHT PANEL ═══ */}
        <div className="flex-1 flex flex-col relative overflow-hidden min-w-0">

          {/* Language selector + Run/Submit */}
          <div className="flex items-center justify-between px-3 py-2 bg-base-200 border-b border-base-300 shrink-0">
            <div className="flex gap-1">
              {['javascript', 'java', 'cpp'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-150
                    ${selectedLanguage === lang
                      ? 'bg-primary text-primary-content shadow-sm'
                      : 'text-base-content/60 hover:bg-base-300 hover:text-base-content'}`}
                >
                  {lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JS' : 'Java'}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                className="btn btn-outline btn-sm gap-1.5"
                onClick={handleRun}
                disabled={loading}
              >
                {loading && consoleTab === 'testcase'
                  ? <span className="loading loading-spinner loading-xs" />
                  : <Play className="w-3.5 h-3.5" />}
                Run
              </button>
              <button
                className="btn btn-primary btn-sm gap-1.5 shadow-sm shadow-primary/25"
                onClick={handleSubmitCode}
                disabled={loading}
              >
                {loading && consoleTab === 'result'
                  ? <span className="loading loading-spinner loading-xs" />
                  : <Send className="w-3.5 h-3.5" />}
                Submit
              </button>
              <AICodeReview code={code} language={selectedLanguage} problem={problem} lastSubmit={lastSubmit} />
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={getMonacoLang(selectedLanguage)}
              value={code}
              onChange={(v) => setCode(v || '')}
              onMount={(editor) => { editorRef.current = editor; }}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                lineNumbers: 'on',
                padding: { top: 12 },
                cursorStyle: 'line',
                mouseWheelZoom: true,
                smoothScrolling: true,
                cursorBlinking: 'smooth',
              }}
            />
          </div>

          {/* Console Toggle Bar */}
          <div className="bg-base-200 border-t border-base-300 px-3 py-1.5 flex items-center justify-between shrink-0 z-20">
            <button
              className="flex items-center gap-1.5 text-xs text-base-content/60 hover:text-base-content transition-colors"
              onClick={() => setIsConsoleOpen(!isConsoleOpen)}
            >
              <Terminal className="w-3.5 h-3.5" />
              Console
              <ChevronUp className={`w-3.5 h-3.5 transition-transform duration-200 ${isConsoleOpen ? '' : 'rotate-180'}`} />
            </button>

            {/* Quick status pill */}
            {runResult && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${runResult.success ? 'bg-success/15 text-success' : 'bg-error/15 text-error'}`}>
                {runResult.success ? '✓ Tests Passed' : '✗ Tests Failed'}
              </span>
            )}
            {submitResult && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${submitResult.accepted ? 'bg-success/15 text-success' : 'bg-error/15 text-error'}`}>
                {submitResult.accepted ? '🎉 Accepted' : `✗ ${submitResult.error || 'Wrong Answer'}`}
              </span>
            )}
          </div>

          {/* Slide-up Console Drawer */}
          <div
            className="absolute bottom-9 left-0 right-0 bg-base-100 border-t border-base-300 z-10 flex flex-col transition-all duration-300 ease-in-out shadow-2xl"
            style={{
              height: isConsoleOpen ? '45%' : '0px',
              opacity: isConsoleOpen ? 1 : 0,
              visibility: isConsoleOpen ? 'visible' : 'hidden',
            }}
          >
            {/* Drawer Tab Bar */}
            <div className="flex items-center bg-base-200 border-b border-base-300 shrink-0">
              {[
                { id: 'testcase', label: 'Test Results', icon: Play },
                { id: 'result',   label: 'Submission',  icon: Send },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setConsoleTab(id)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-all
                    ${consoleTab === id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-base-content/50 hover:text-base-content'}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
              <button
                className="ml-auto px-3 py-2 text-base-content/40 hover:text-base-content text-xs"
                onClick={() => setIsConsoleOpen(false)}
              >✕</button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4">

              {/* Test Results Panel */}
              {consoleTab === 'testcase' && (
                <div className="space-y-3">
                  {runResult ? (
                    <>
                      {/* Summary bar */}
                      <div className={`flex items-center gap-3 p-3 rounded-xl text-sm font-semibold
                        ${runResult.success ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                        {runResult.success
                          ? <><CheckCircle className="w-4 h-4" /> All test cases passed</>
                          : <><XCircle className="w-4 h-4" /> Some test cases failed</>}
                        {runResult.runtime && (
                          <span className="ml-auto flex items-center gap-3 text-xs font-normal opacity-70">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{runResult.runtime}s</span>
                            <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{runResult.memory}KB</span>
                          </span>
                        )}
                      </div>
                      {runResult.testCases?.map((tc, i) => (
                        <TestCaseCard key={i} tc={tc} index={i} passed={tc.status_id === 3} />
                      ))}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-base-content/30">
                      <Play className="w-8 h-8 mb-2" />
                      <p className="text-sm">Run your code to see test results</p>
                    </div>
                  )}
                </div>
              )}

              {/* Submission Result Panel */}
              {consoleTab === 'result' && (
                <div>
                  {submitResult ? (
                    <div className={`rounded-2xl border-2 p-5 ${submitResult.accepted ? 'border-success/40 bg-success/5' : 'border-error/40 bg-error/5'}`}>
                      <h3 className={`text-xl font-bold flex items-center gap-2 mb-4 ${submitResult.accepted ? 'text-success' : 'text-error'}`}>
                        {submitResult.accepted
                          ? <><CheckCircle className="w-6 h-6" /> 🎉 Accepted!</>
                          : <><XCircle className="w-6 h-6" /> {submitResult.error || 'Wrong Answer'}</>}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b border-base-300">
                          <span className="text-base-content/60">Test Cases</span>
                          <span className={`font-semibold ${submitResult.accepted ? 'text-success' : 'text-error'}`}>
                            {submitResult.passedTestCases} / {submitResult.totalTestCases}
                          </span>
                        </div>
                        {submitResult.runtime && (
                          <div className="flex justify-between py-2 border-b border-base-300">
                            <span className="text-base-content/60">Runtime</span>
                            <span className="font-medium flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{submitResult.runtime}s</span>
                          </div>
                        )}
                        {submitResult.memory && (
                          <div className="flex justify-between py-2">
                            <span className="text-base-content/60">Memory</span>
                            <span className="font-medium flex items-center gap-1"><Zap className="w-3.5 h-3.5" />{submitResult.memory} KB</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-base-content/30">
                      <Send className="w-8 h-8 mb-2" />
                      <p className="text-sm">Submit your code for final evaluation</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemPage;