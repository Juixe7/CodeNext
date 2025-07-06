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
  const [activeRightTab, setActiveRightTab] = useState('code');
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
      setActiveRightTab('testcase');
      
    } catch (error) {
      console.error('Error running code:', error);
      setRunResult({
        success: false,
        error: 'Internal server error'
      });
      setLoading(false);
      setActiveRightTab('testcase');
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
       setActiveRightTab('result');
      
    } catch (error) {
      console.error('Error submitting code:', error);
      setSubmitResult(null);
      setLoading(false);
      setActiveRightTab('result');
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

      {/* Right Panel */}
      <div className="w-1/2 flex flex-col">
        {/* Right Tabs */}
        <div className="tabs tabs-bordered bg-base-200 px-4 transition-colors duration-300">
          <button 
            className={`tab ${activeRightTab === 'code' ? 'tab-active' : ''}`}
            onClick={() => setActiveRightTab('code')}
          >
            <Code className="w-4 h-4 mr-1" />
            Code
          </button>
          <button 
            className={`tab ${activeRightTab === 'testcase' ? 'tab-active' : ''}`}
            onClick={() => setActiveRightTab('testcase')}
          >
            <Play className="w-4 h-4 mr-1" />
            Test Results
          </button>
          <button 
            className={`tab ${activeRightTab === 'result' ? 'tab-active' : ''}`}
            onClick={() => setActiveRightTab('result')}
          >
            <Send className="w-4 h-4 mr-1" />
            Submission
          </button>
        </div>

        {/* Right Content */}
        <div className="flex-1 flex flex-col">
          {activeRightTab === 'code' && (
            <div className="flex-1 flex flex-col">
              {/* Language Selector */}
              <div className="flex justify-between items-center p-4 border-b border-base-300 bg-base-200 transition-colors duration-300">
                <div className="flex gap-2">
                  {['javascript', 'java', 'cpp'].map((lang) => (
                    <button
                      key={lang}
                      className={`btn btn-sm ${selectedLanguage === lang ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => handleLanguageChange(lang)}
                    >
                      {lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JavaScript' : 'Java'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1">
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
                    glyphMargin: false,
                    folding: true,
                    lineDecorationsWidth: 10,
                    lineNumbersMinChars: 3,
                    renderLineHighlight: 'line',
                    selectOnLineNumbers: true,
                    roundedSelection: false,
                    readOnly: false,
                    cursorStyle: 'line',
                    mouseWheelZoom: true,
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-base-300 flex justify-between bg-base-200 transition-colors duration-300">
                <div className="flex gap-2">
                  <button 
                    className="btn btn-ghost btn-sm"
                    onClick={() => setActiveRightTab('testcase')}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Console
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    className={`btn btn-outline btn-sm ${loading ? 'loading' : ''}`}
                    onClick={handleRun}
                    disabled={loading}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Run
                  </button>
                  <button
                    className={`btn btn-primary btn-sm ${loading ? 'loading' : ''}`}
                    onClick={handleSubmitCode}
                    disabled={loading}
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeRightTab === 'testcase' && (
            <div className="flex-1 p-6 overflow-y-auto">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Play className="w-5 h-5" />
                Test Results
              </h3>
              {runResult ? (
                <div className={`alert ${runResult.success ? 'alert-success' : 'alert-error'} mb-6`}>
                  <div className="w-full">
                    {runResult.success ? (
                      <div>
                        <h4 className="font-bold flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          All test cases passed!
                        </h4>
                        <div className="mt-4 flex gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Runtime: {runResult.runtime} sec
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap className="w-4 h-4" />
                            Memory: {runResult.memory} KB
                          </div>
                        </div>
                        
                        <div className="mt-6 space-y-3">
                          {runResult.testCases.map((tc, i) => (
                            <div key={i} className="card bg-base-100 border border-base-300">
                              <div className="card-body p-4">
                                <div className="font-mono text-xs space-y-2">
                                  <div className="flex gap-2">
                                    <span className="font-semibold text-primary">Input:</span>
                                    <span className="bg-base-200 px-2 py-1 rounded">{tc.stdin}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <span className="font-semibold text-success">Expected:</span>
                                    <span className="bg-base-200 px-2 py-1 rounded">{tc.expected_output}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <span className="font-semibold text-info">Output:</span>
                                    <span className="bg-base-200 px-2 py-1 rounded">{tc.stdout}</span>
                                  </div>
                                  <div className="text-success font-semibold flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4" />
                                    ✓ Passed
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-bold flex items-center gap-2">
                          <XCircle className="w-5 h-5" />
                          Error
                        </h4>
                        <div className="mt-6 space-y-3">
                          {runResult.testCases.map((tc, i) => (
                            <div key={i} className="card bg-base-100 border border-base-300">
                              <div className="card-body p-4">
                                <div className="font-mono text-xs space-y-2">
                                  <div className="flex gap-2">
                                    <span className="font-semibold text-primary">Input:</span>
                                    <span className="bg-base-200 px-2 py-1 rounded">{tc.stdin}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <span className="font-semibold text-success">Expected:</span>
                                    <span className="bg-base-200 px-2 py-1 rounded">{tc.expected_output}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <span className="font-semibold text-info">Output:</span>
                                    <span className="bg-base-200 px-2 py-1 rounded">{tc.stdout}</span>
                                  </div>
                                  <div className={`font-semibold flex items-center gap-1 ${tc.status_id==3 ? 'text-success' : 'text-error'}`}>
                                    {tc.status_id==3 ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                    {tc.status_id==3 ? '✓ Passed' : '✗ Failed'}
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
                <div className="text-center py-12">
                  <Play className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
                  <p className="text-base-content/70">Click "Run" to test your code with the example test cases.</p>
                </div>
              )}
            </div>
          )}

          {activeRightTab === 'result' && (
            <div className="flex-1 p-6 overflow-y-auto">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Send className="w-5 h-5" />
                Submission Result
              </h3>
              {submitResult ? (
                <div className={`alert ${submitResult.accepted ? 'alert-success' : 'alert-error'}`}>
                  <div className="w-full">
                    {submitResult.accepted ? (
                      <div>
                        <h4 className="font-bold text-lg flex items-center gap-2">
                          <CheckCircle className="w-6 h-6" />
                          🎉 Accepted
                        </h4>
                        <div className="mt-4 space-y-2">
                          <p>Test Cases Passed: {submitResult.passedTestCases}/{submitResult.totalTestCases}</p>
                          <p>Runtime: {submitResult.runtime} sec</p>
                          <p>Memory: {submitResult.memory} KB</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-bold text-lg flex items-center gap-2">
                          <XCircle className="w-6 h-6" />
                          ❌ {submitResult.error}
                        </h4>
                        <div className="mt-4 space-y-2">
                          <p>Test Cases Passed: {submitResult.passedTestCases}/{submitResult.totalTestCases}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Send className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
                  <p className="text-base-content/70">Click "Submit" to submit your solution for evaluation.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemPage;