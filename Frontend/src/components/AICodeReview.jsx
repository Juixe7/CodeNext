import { useState } from 'react';
import axiosClient from '../utils/axiosClient';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Sparkles, X, Loader2, Bot } from 'lucide-react';

export default function AICodeReview({ code, language, problem, lastSubmit }) {
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const requestReview = async () => {
    setOpen(true);
    setLoading(true);
    setReview('');
    try {
      const res = await axiosClient.post('/user/review', {
        code,
        language,
        problemTitle: problem?.title,
        problemDescription: problem?.description,
        status: lastSubmit?.accepted ? 'accepted' : 'wrong',
        testCasesPassed: lastSubmit?.passedTestCases || 0,
        testCasesTotal: lastSubmit?.totalTestCases || 0,
      });
      setReview(res.data.review);
    } catch (e) {
      setReview(`⚠️ Review failed: ${e.response?.data?.message || e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={requestReview}
        className="btn btn-sm gap-1.5 bg-gradient-to-r from-purple-500 to-primary text-white border-0 shadow-sm hover:shadow-purple-400/30 hover:shadow-md transition-all"
        title="Get AI code review"
      >
        <Sparkles className="w-3.5 h-3.5" />
        AI Review
      </button>

      {open && (
        <div className="modal modal-open" onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal-box w-11/12 max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-base-300 bg-gradient-to-r from-purple-500/10 to-primary/10 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <h3 className="font-bold text-base">AI Code Review</h3>
                <p className="text-xs text-base-content/50">Powered by Llama 3.1</p>
              </div>
              <button onClick={() => setOpen(false)} className="ml-auto btn btn-ghost btn-sm btn-circle">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-base-content/40">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                  <p className="text-sm">Analyzing your code...</p>
                  <p className="text-xs">This takes 5-10 seconds</p>
                </div>
              ) : (
                <ReactMarkdown
                  className="prose prose-sm max-w-none"
                  components={{
                    code({ inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" className="rounded-lg text-xs !my-2" {...props}>
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className="bg-base-300 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>
                      );
                    },
                    h2: ({ children }) => <h2 className="text-base font-bold mt-4 mb-2 text-base-content">{children}</h2>,
                    strong: ({ children }) => <strong className="font-semibold text-base-content">{children}</strong>,
                  }}
                >
                  {review}
                </ReactMarkdown>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
