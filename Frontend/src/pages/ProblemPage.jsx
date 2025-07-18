import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import Editor from '@monaco-editor/react';
import { useParams, NavLink } from 'react-router';
import axiosClient from "../utils/axiosClient"
import SubmissionHistory from "../components/SubmissionHistory"
import ChatAi from '../components/ChatAi';
import Editorial from '../components/Editorial';
import { Code, Play, Send, ArrowLeft, FileText, Video, MessageSquare, History, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const langMap = {
  cpp: 'C++',
  java: 'Java',
  javascript: 'JavaScript'
};

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
  const editorRef = useRef(null);
  let { problemId } = useParams();

  const { handleSubmit } = useForm();

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
        setLoading(false);
      } catch (error) {
        console.error('Error fetching problem:', error);
        setLoading(false);
      }
    };

    fetchProblem();
  }, [problemId, selectedLanguage]);

  useEffect(() => {
    if (problem) {
      const langDisplay = langMap[selectedLanguage];
      const startCodeObj = problem.startCode.find(
        sc => sc.language.toLowerCase() === langDisplay.toLowerCase()
      );
      setCode(startCodeObj ? startCodeObj.initialCode : '');
    }
  }, [selectedLanguage, problem]);

  const handleEditorChange = (value) => {
    setCode(value || '');
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
  };

  const handleRun = async () => {
    setLoading(true);
    setRunResult(null);
    
    try {
      const response = await axiosClient.post(`/submission/run/${problemId}`, {
        code,
        language: selectedLanguage
      });

      setRunResult(response.data);
      setLoading(false);
      setConsoleTab('testcase');
      setIsConsoleOpen(true);
      
    } catch (error) {
      console.error('Error running code:', error);
      setRunResult({
        success: false,
        error: 'Internal server error'
      });
      setLoading(false);
      setConsoleTab('testcase');
      setIsConsoleOpen(true);
    }
  };

  const handleSubmitCode = async () => {
    setLoading(true);
    setSubmitResult(null);
    
    try {
        const response = await axiosClient.post(`/submission/submit/${problemId}`, {
        code:code,
        language: selectedLanguage
      });

       setSubmitResult(response.data);
       setLoading(false);
       setConsoleTab('result');
       setIsConsoleOpen(true);
      
    } catch (error) {
      console.error('Error submitting code:', error);
      setSubmitResult(null);
      setLoading(false);
      setConsoleTab('result');
      setIsConsoleOpen(true);
    }
  };

  const getLanguageForMonaco = (lang) => {
    switch (lang) {
      case 'javascript': return 'javascript';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      default: return 'javascript';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-success';
      case 'medium': return 'text-warning';
      case 'hard': return 'text-error';
      default: return 'text-base-content';
    }
  };

  const getDifficultyBadge = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'badge-success';
      case 'medium': return 'badge-warning';
      case 'hard': return 'badge-error';
      default: return 'badge-neutral';
    }
  };

  if (loading && !problem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-100 via-base-200 to-base-100 flex justify-center items-center transition-colors duration-300">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-base-content/70">Loading problem...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-base-100 transition-colors duration-300">
      {/* Left Panel */}
      <div className="w-1/2 flex flex-col border-r border-base-300">
        {/* Header with Back Button */}
        <div className="bg-base-200 px-4 py-3 border-b border-base-300 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <NavLink to="/" className="btn btn-ghost btn-sm">
              <ArrowLeft className="w-4 h-4" />
              Back
            </NavLink>
            <div className="flex-1">
              {problem && (
                <div className="flex items-center gap-3">
                  <h1 className="text-lg font-semibold truncate">{problem.title}</h1>
                  <div className={`badge ${getDifficultyBadge(problem.difficulty)}`}>
                    {problem.difficulty}
                  </div>
                  <div className="badge badge-outline badge-info">
                    {problem.tags}
                  </div>
                </div>
              )}
            </div>
            {/* Theme Toggle */}
            <ThemeToggle size="sm" />
          </div>
        </div>

        {/* Left Tabs */}
        <div className="tabs tabs-bordered bg-base-200 px-4 transition-colors duration-300">
          <button 
            className={`tab ${activeLeftTab === 'description' ? 'tab-active' : ''}`}
            onClick={() => setActiveLeftTab('description')}
          >
            <FileText className="w-4 h-4 mr-1" />
            Description
          </button>
          <button 
            className={`tab ${activeLeftTab === 'editorial' ? 'tab-active' : ''}`}
            onClick={() => setActiveLeftTab('editorial')}
          >
            <Video className="w-4 h-4 mr-1" />
            Editorial
          </button>
          <button 
            className={`tab ${activeLeftTab === 'solutions' ? 'tab-active' : ''}`}
            onClick={() => setActiveLeftTab('solutions')}
          >
            <Code className="w-4 h-4 mr-1" />
            Solutions
          </button>
          <button 
            className={`tab ${activeLeftTab === 'submissions' ? 'tab-active' : ''}`}
            onClick={() => setActiveLeftTab('submissions')}
          >
            <History className="w-4 h-4 mr-1" />
            Submissions
          </button>
          <button 
            className={`tab ${activeLeftTab === 'chatAI' ? 'tab-active' : ''}`}
            onClick={() => setActiveLeftTab('chatAI')}
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            ChatAI
          </button>
        </div>

        {/* Left Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {problem && (
            <>
              {activeLeftTab === 'description' && (
                <div className="space-y-6">
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {problem.description}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Examples
                    </h3>
                    <div className="space-y-4">
                      {problem.visibleTestCases.map((example, index) => (
                        <div key={index} className="card bg-base-200 border border-base-300">
                          <div className="card-body p-4">
                            <h4 className="font-semibold mb-3">Example {index + 1}:</h4>
                            <div className="space-y-2 text-sm font-mono">
                              <div className="flex gap-2">
                                <span className="font-semibold text-primary">Input:</span>
                                <span className="bg-base-100 px-2 py-1 rounded">{example.input}</span>
                              </div>
                              <div className="flex gap-2">
                                <span className="font-semibold text-success">Output:</span>
                                <span className="bg-base-100 px-2 py-1 rounded">{example.output}</span>
                              </div>
                              <div className="flex gap-2">
                                <span className="font-semibold text-info">Explanation:</span>
                                <span className="bg-base-100 px-2 py-1 rounded flex-1">{example.explanation}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeLeftTab === 'editorial' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Video className="w-6 h-6" />
                    Editorial
                  </h2>
                  <div className="prose max-w-none">
                    <Editorial secureUrl={problem.secureUrl} thumbnailUrl={problem.thumbnailUrl} duration={problem.duration}/>
                  </div>
                </div>
              )}

              {activeLeftTab === 'solutions' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Code className="w-6 h-6" />
                    Solutions
                  </h2>
                  <div className="space-y-6">
                    {problem.referenceSolution?.map((solution, index) => (
                      <div key={index} className="card bg-base-200 border border-base-300">
                        <div className="card-header bg-base-300 px-4 py-3 rounded-t-lg">
                          <h3 className="font-semibold">{problem?.title} - {solution?.language}</h3>
                        </div>
                        <div className="card-body p-4">
                          <pre className="bg-base-100 p-4 rounded-lg text-sm overflow-x-auto border">
                            <code>{solution?.completeCode}</code>
                          </pre>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-8">
                        <Code className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
                        <p className="text-base-content/70">Solutions will be available after you solve the problem.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeLeftTab === 'submissions' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <History className="w-6 h-6" />
                    My Submissions
                  </h2>
                  <SubmissionHistory problemId={problemId} />
                </div>
              )}

              {activeLeftTab === 'chatAI' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <MessageSquare className="w-6 h-6" />
                    Chat with AI
                  </h2>
                  <ChatAi problem={problem} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right Panel (Code + Console Drawer) */}
      <div className="w-1/2 flex flex-col relative overflow-hidden">
        
        {/* Main Code Editor Area */}
        <div className="flex-1 flex flex-col h-full">
          {/* Language Selector */}
          <div className="flex justify-between items-center p-3 border-b border-base-300 bg-base-200 transition-colors duration-300">
            <div className="flex gap-2">
              {['javascript', 'java', 'cpp'].map((lang) => (
                <button
                  key={lang}
                  className={`btn btn-xs sm:btn-sm ${selectedLanguage === lang ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => handleLanguageChange(lang)}
                >
                  {lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JavaScript' : 'Java'}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2">
              <button
                className={`btn btn-outline btn-sm ${loading && consoleTab === 'testcase' ? 'loading' : ''}`}
                onClick={handleRun}
                disabled={loading}
              >
                <Play className="w-4 h-4" />
                Run
              </button>
              <button
                className={`btn btn-primary btn-sm shadow-sm shadow-primary/20 ${loading && consoleTab === 'result' ? 'loading' : ''}`}
                onClick={handleSubmitCode}
                disabled={loading}
              >
                <Send className="w-4 h-4" />
                Submit
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 min-h-0 relative">
            <Editor
              height="100%"
              language={getLanguageForMonaco(selectedLanguage)}
              value={code}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                insertSpaces: true,
                wordWrap: 'on',
                lineNumbers: 'on',
                padding: { top: 16 },
                cursorStyle: 'line',
                mouseWheelZoom: true,
              }}
            />
          </div>

          {/* Console Toggle Bar (Bottom) */}
          <div className="bg-base-200 border-t border-base-300 p-2 flex justify-between items-center z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <button 
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => setIsConsoleOpen(!isConsoleOpen)}
            >
              <Play className="w-4 h-4" />
              Console
              <span className={`transition-transform duration-200 ${isConsoleOpen ? 'rotate-180' : ''}`}>
                ▲
              </span>
            </button>
          </div>
        </div>

        {/* Slide-up Console Drawer */}
        <div 
          className={`absolute bottom-12 left-0 right-0 bg-base-100 border-t border-base-300 transition-all duration-300 ease-in-out z-10 flex flex-col shadow-2xl`}
          style={{ 
            height: isConsoleOpen ? '45%' : '0px',
            opacity: isConsoleOpen ? 1 : 0,
            visibility: isConsoleOpen ? 'visible' : 'hidden'
          }}
        >
          {/* Drawer Tabs */}
          <div className="tabs tabs-bordered bg-base-200 px-4 pt-2">
            <button 
              className={`tab ${consoleTab === 'testcase' ? 'tab-active font-semibold' : ''}`}
              onClick={() => setConsoleTab('testcase')}
            >
              <Play className="w-4 h-4 mr-1" />
              Test Results
            </button>
            <button 
              className={`tab ${consoleTab === 'result' ? 'tab-active font-semibold' : ''}`}
              onClick={() => setConsoleTab('result')}
            >
              <Send className="w-4 h-4 mr-1" />
              Submission Result
            </button>
            <button 
              className="btn btn-ghost btn-xs absolute right-2 top-2"
              onClick={() => setIsConsoleOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-4 bg-base-100/50">
            {consoleTab === 'testcase' && (
              <div className="animate-fade-in-up">
                {runResult ? (
                  <div className={`alert ${runResult.success ? 'alert-success shadow-success/20' : 'alert-error shadow-error/20'} mb-4 shadow-sm`}>
                    <div className="w-full">
                      {runResult.success ? (
                        <div>
                          <h4 className="font-bold flex items-center gap-2 text-lg">
                            <CheckCircle className="w-5 h-5" />
                            All test cases passed!
                          </h4>
                          <div className="mt-2 flex gap-4 text-sm font-medium opacity-80">
                            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {runResult.runtime}s</span>
                            <span className="flex items-center gap-1"><Zap className="w-4 h-4" /> {runResult.memory}KB</span>
                          </div>
                          
                          <div className="mt-4 space-y-3">
                            {runResult.testCases.map((tc, i) => (
                              <div key={i} className="card bg-base-100 shadow-sm border border-base-300">
                                <div className="card-body p-3">
                                  <div className="font-mono text-xs space-y-2">
                                    <div className="flex flex-col gap-1">
                                      <span className="font-semibold text-base-content/50">Input:</span>
                                      <span className="bg-base-200 px-3 py-2 rounded-md">{tc.stdin}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <span className="font-semibold text-base-content/50">Expected:</span>
                                      <span className="bg-base-200 px-3 py-2 rounded-md">{tc.expected_output}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <span className="font-semibold text-base-content/50">Output:</span>
                                      <span className="bg-base-200 px-3 py-2 rounded-md">{tc.stdout}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h4 className="font-bold flex items-center gap-2 text-lg">
                            <XCircle className="w-5 h-5" />
                            Test Case Failed or Error Occurred
                          </h4>
                          <div className="mt-4 space-y-3">
                            {runResult.testCases.map((tc, i) => (
                              <div key={i} className={`card bg-base-100 shadow-sm border ${tc.status_id===3 ? 'border-success/30' : 'border-error/50'}`}>
                                <div className="card-body p-3">
                                  <div className="font-mono text-xs space-y-2">
                                    <div className="flex flex-col gap-1">
                                      <span className="font-semibold text-base-content/50">Input:</span>
                                      <span className="bg-base-200 px-3 py-2 rounded-md">{tc.stdin}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <span className="font-semibold text-base-content/50">Expected:</span>
                                      <span className="bg-base-200 px-3 py-2 rounded-md">{tc.expected_output}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <span className="font-semibold text-base-content/50">Output:</span>
                                      <span className="bg-base-200 px-3 py-2 rounded-md">{tc.stdout || tc.compile_output || 'No output'}</span>
                                    </div>
                                    <div className={`mt-2 font-semibold flex items-center gap-1 ${tc.status_id===3 ? 'text-success' : 'text-error'}`}>
                                      {tc.status_id===3 ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                      {tc.status_id===3 ? '✓ Passed' : '✗ Failed'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Play className="w-10 h-10 mx-auto text-base-content/20 mb-3" />
                    <p className="text-base-content/60 font-medium">Run your code to see test results here.</p>
                  </div>
                )}
              </div>
            )}

            {consoleTab === 'result' && (
              <div className="animate-fade-in-up">
                {submitResult ? (
                  <div className={`alert ${submitResult.accepted ? 'alert-success shadow-success/20' : 'alert-error shadow-error/20'} shadow-sm`}>
                    <div className="w-full">
                      {submitResult.accepted ? (
                        <div>
                          <h4 className="font-bold text-xl flex items-center gap-2">
                            <CheckCircle className="w-6 h-6" />
                            🎉 Accepted!
                          </h4>
                          <div className="mt-4 p-4 bg-base-100 rounded-lg space-y-2 font-medium">
                            <p className="flex justify-between border-b border-base-200 pb-2">
                              <span className="text-base-content/60">Test Cases Passed</span>
                              <span className="text-success">{submitResult.passedTestCases} / {submitResult.totalTestCases}</span>
                            </p>
                            <p className="flex justify-between border-b border-base-200 pb-2 pt-2">
                              <span className="text-base-content/60">Runtime</span>
                              <span>{submitResult.runtime} sec</span>
                            </p>
                            <p className="flex justify-between pt-2">
                              <span className="text-base-content/60">Memory Usage</span>
                              <span>{submitResult.memory} KB</span>
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h4 className="font-bold text-xl flex items-center gap-2">
                            <XCircle className="w-6 h-6" />
                            ❌ {submitResult.error}
                          </h4>
                          <div className="mt-4 p-4 bg-base-100 rounded-lg space-y-2 font-medium">
                            <p className="flex justify-between">
                              <span className="text-base-content/60">Test Cases Passed</span>
                              <span className="text-error">{submitResult.passedTestCases} / {submitResult.totalTestCases}</span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Send className="w-10 h-10 mx-auto text-base-content/20 mb-3" />
                    <p className="text-base-content/60 font-medium">Submit your solution to get the final evaluation.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemPage;