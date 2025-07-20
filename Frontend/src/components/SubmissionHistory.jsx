import { useState, useEffect } from 'react';
import axiosClient from '../utils/axiosClient';
import { CheckCircle, XCircle, AlertTriangle, Clock, Zap, Eye, X, Copy, Check } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { formatDistanceToNow } from 'date-fns';

const statusConfig = {
  accepted:  { icon: CheckCircle, color: 'text-success',  bg: 'bg-success/10',  border: 'border-success/30',  label: 'Accepted'      },
  wrong:     { icon: XCircle,     color: 'text-error',    bg: 'bg-error/10',    border: 'border-error/30',    label: 'Wrong Answer'  },
  error:     { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30', label: 'Runtime Error' },
  pending:   { icon: Clock,       color: 'text-info',     bg: 'bg-info/10',     border: 'border-info/30',     label: 'Pending'       },
};

const langMonacoMap = { javascript: 'javascript', java: 'java', cpp: 'cpp', 'c++': 'cpp' };

const CopyBtn = ({ text }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="btn btn-xs btn-ghost gap-1">
      {copied ? <><Check className="w-3 h-3 text-success" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
    </button>
  );
};

const SubmissionHistory = ({ problemId }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`/problem/submittedProblem/${problemId}`);
        const data = response.data;
        setSubmissions(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        if (err.response?.status === 200) setSubmissions([]);
        else setError('Failed to fetch submission history');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, [problemId]);

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => (
        <div key={i} className="h-16 bg-base-200 rounded-xl animate-pulse" />
      ))}
    </div>
  );

  if (error) return (
    <div className="alert alert-error">
      <XCircle className="w-5 h-5" /><span>{error}</span>
    </div>
  );

  if (submissions.length === 0) return (
    <div className="flex flex-col items-center justify-center py-12 text-base-content/30">
      <Clock className="w-10 h-10 mb-2" />
      <p className="text-sm font-medium">No submissions yet</p>
      <p className="text-xs mt-1">Submit your code to see history here</p>
    </div>
  );

  const cfg = (status) => statusConfig[status] || statusConfig.error;

  return (
    <div className="space-y-2">
      <p className="text-xs text-base-content/40 mb-3">{submissions.length} submission{submissions.length !== 1 ? 's' : ''}</p>

      {submissions.map((sub, index) => {
        const s = cfg(sub.status);
        const Icon = s.icon;
        return (
          <div key={sub._id}
            className={`rounded-xl border ${s.border} ${s.bg} p-3 flex items-center gap-3 hover:shadow-sm transition-shadow`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${s.bg}`}>
              <Icon className={`w-4 h-4 ${s.color}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm font-semibold ${s.color}`}>{s.label}</span>
                <span className="badge badge-xs badge-outline font-mono">{sub.language}</span>
                <span className="text-xs text-base-content/40">
                  {sub.testCasesPassed}/{sub.testCasesTotal} passed
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-base-content/40">
                {sub.runtime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{sub.runtime}s</span>}
                {sub.memory  && <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{sub.memory < 1024 ? `${sub.memory}kB` : `${(sub.memory/1024).toFixed(1)}MB`}</span>}
                <span>{formatDistanceToNow(new Date(sub.createdAt), { addSuffix: true })}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedSubmission(sub)}
              className="btn btn-xs btn-ghost gap-1 shrink-0"
            >
              <Eye className="w-3.5 h-3.5" /> View
            </button>
          </div>
        );
      })}

      {/* Code Modal */}
      {selectedSubmission && (
        <div className="modal modal-open" onClick={(e) => e.target === e.currentTarget && setSelectedSubmission(null)}>
          <div className="modal-box w-11/12 max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-base-300 bg-base-200 shrink-0">
              <div className="flex items-center gap-3">
                {(() => { const s = cfg(selectedSubmission.status); const Icon = s.icon;
                  return <Icon className={`w-5 h-5 ${s.color}`} />; })()}
                <div>
                  <h3 className="font-bold text-base">{cfg(selectedSubmission.status).label}</h3>
                  <p className="text-xs text-base-content/50 font-mono">{selectedSubmission.language}</p>
                </div>
              </div>
              <button onClick={() => setSelectedSubmission(null)} className="btn btn-ghost btn-sm btn-circle">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-4 px-5 py-3 border-b border-base-300 bg-base-200/50 text-sm shrink-0">
              <span className="flex items-center gap-1.5 text-base-content/60">
                <CheckCircle className="w-3.5 h-3.5 text-success" />
                {selectedSubmission.testCasesPassed}/{selectedSubmission.testCasesTotal} test cases
              </span>
              {selectedSubmission.runtime && (
                <span className="flex items-center gap-1.5 text-base-content/60">
                  <Clock className="w-3.5 h-3.5" />{selectedSubmission.runtime}s
                </span>
              )}
              {selectedSubmission.memory && (
                <span className="flex items-center gap-1.5 text-base-content/60">
                  <Zap className="w-3.5 h-3.5" />{selectedSubmission.memory}kB
                </span>
              )}
              <span className="ml-auto text-xs text-base-content/40">
                {formatDistanceToNow(new Date(selectedSubmission.createdAt), { addSuffix: true })}
              </span>
            </div>

            {/* Error message if any */}
            {selectedSubmission.errorMessage && (
              <div className="alert alert-error alert-sm mx-5 mt-3 shrink-0">
                <AlertTriangle className="w-4 h-4" /><span className="text-sm">{selectedSubmission.errorMessage}</span>
              </div>
            )}

            {/* Code viewer */}
            <div className="flex-1 overflow-auto">
              <div className="flex items-center justify-between px-4 py-2 bg-[#282c34] border-b border-base-300/20 shrink-0">
                <span className="text-xs text-gray-400 font-mono">{selectedSubmission.language}</span>
                <CopyBtn text={selectedSubmission.code} />
              </div>
              <SyntaxHighlighter
                language={langMonacoMap[selectedSubmission.language?.toLowerCase()] || 'javascript'}
                style={oneDark}
                showLineNumbers
                customStyle={{ margin: 0, borderRadius: 0, fontSize: '13px', minHeight: '200px' }}
              >
                {selectedSubmission.code || '// No code found'}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionHistory;