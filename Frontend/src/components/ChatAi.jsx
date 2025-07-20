import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import axiosClient from "../utils/axiosClient";
import { Send, Sparkles, Trash2, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Typing indicator component
const TypingDots = () => (
  <div className="flex items-center gap-1 px-4 py-3">
    <Bot className="w-4 h-4 text-primary shrink-0 mr-1" />
    <span className="text-xs text-base-content/50 mr-2">AI is thinking</span>
    <span className="flex gap-1">
      {[0,1,2].map(i => (
        <span key={i} className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  </div>
);

// Markdown message renderer
const MessageContent = ({ content }) => (
  <ReactMarkdown
    className="prose prose-sm max-w-none break-words"
    components={{
      code({ inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');
        return !inline && match ? (
          <SyntaxHighlighter
            style={oneDark}
            language={match[1]}
            PreTag="div"
            className="rounded-lg text-xs !my-2"
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        ) : (
          <code className="bg-base-300 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
            {children}
          </code>
        );
      },
      p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
      ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
      ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
      li: ({ children }) => <li className="text-sm">{children}</li>,
      strong: ({ children }) => <strong className="font-semibold text-base-content">{children}</strong>,
    }}
  >
    {content}
  </ReactMarkdown>
);

function ChatAi({ problem }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hi! I'm your AI DSA Tutor powered by **Llama 3.1**. I'm here to help you solve **${problem?.title || 'this problem'}**.\n\nAsk me for hints, complexity analysis, or debugging help!` }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const { register, handleSubmit, reset, watch } = useForm();
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const watchedMsg = watch('message', '');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const onSubmit = async (data) => {
    if (!data.message?.trim()) return;
    const newUserMsg = { role: 'user', content: data.message };
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    reset();
    setIsTyping(true);

    try {
      const response = await axiosClient.post("/ai/chat", {
        messages: updatedMessages,
        title: problem.title,
        description: problem.description,
        testCases: problem.visibleTestCases,
        startCode: problem.startCode
      });
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.message }]);
    } catch (error) {
      const serverMsg = error.response?.data?.message || error.message || "Unknown error";
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${serverMsg}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: `Chat cleared! How can I help you with **${problem?.title}**?` }]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-base-300 bg-base-200/50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold">AI DSA Tutor</p>
            <p className="text-[10px] text-base-content/40">Powered by Llama 3.1</p>
          </div>
        </div>
        <button onClick={clearChat} className="btn btn-ghost btn-xs gap-1 text-base-content/40 hover:text-error">
          <Trash2 className="w-3 h-3" /> Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.map((msg, index) => (
          <div key={index} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1
              ${msg.role === 'user' ? 'bg-primary text-primary-content' : 'bg-base-300'}`}>
              {msg.role === 'user'
                ? <User className="w-3.5 h-3.5" />
                : <Bot className="w-3.5 h-3.5 text-primary" />}
            </div>
            {/* Bubble */}
            <div className={`max-w-[85%] rounded-2xl px-3 py-2.5 text-sm
              ${msg.role === 'user'
                ? 'bg-primary text-primary-content rounded-tr-sm'
                : 'bg-base-200 text-base-content rounded-tl-sm border border-base-300'}`}>
              {msg.role === 'user'
                ? <p className="leading-relaxed">{msg.content}</p>
                : <MessageContent content={msg.content} />}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-base-300 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="bg-base-200 border border-base-300 rounded-2xl rounded-tl-sm">
              <TypingDots />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit(onSubmit)} className="border-t border-base-300 p-3 bg-base-100 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            placeholder="Ask for a hint, explain complexity, debug my code... (Enter to send)"
            className="textarea textarea-bordered flex-1 text-sm resize-none min-h-[40px] max-h-32 leading-relaxed"
            rows={1}
            onKeyDown={handleKeyDown}
            {...register("message", { required: true })}
          />
          <button
            type="submit"
            className="btn btn-primary btn-sm h-10 w-10 p-0"
            disabled={isTyping || !watchedMsg?.trim()}
          >
            {isTyping
              ? <span className="loading loading-spinner loading-xs" />
              : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-base-content/30 mt-1.5">Shift+Enter for new line · Enter to send</p>
      </form>
    </div>
  );
}

export default ChatAi;