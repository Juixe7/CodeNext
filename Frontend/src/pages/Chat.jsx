import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { Send, Loader2, ArrowLeft, Search, MessageCircle, Check, CheckCheck, Users, X, Smile } from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import ThemeToggle from '../components/ThemeToggle';
import { Helmet } from 'react-helmet-async';

const formatTime = (dateStr) => new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatLastSeen = (dateStr) => {
  if (!dateStr) return 'offline';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// Animated typing dots
const TypingIndicator = () => (
  <div className="flex justify-start mb-2 animate-chat-in">
    <div className="bg-base-100 border border-base-300 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-primary/60 animate-typing-dot" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-primary/60 animate-typing-dot" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full bg-primary/60 animate-typing-dot" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

// Online status dot
const OnlineDot = ({ isOnline, size = 'sm' }) => {
  const sizeClass = size === 'lg' ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5';
  return (
    <span className={`${sizeClass} rounded-full border-2 border-base-100 absolute bottom-0 right-0 transition-colors duration-300 ${isOnline ? 'bg-success animate-pulse-subtle' : 'bg-base-content/30'}`} />
  );
};

export default function Chat() {
  const { userId: paramUserId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useSelector(state => state.auth);

  const [conversations, setConversations] = useState([]);
  const [convoLoading, setConvoLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(paramUserId || null);
  const [activeFriend, setActiveFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(!paramUserId);

  // New state for presence & typing
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const activeChatRef = useRef(activeChat);

  // Keep ref in sync
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  // Socket connection (single instance)
  useEffect(() => {
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const SOCKET_URL = isLocalhost ? "http://localhost:3000" : "https://roadcode-a-coding-platform.onrender.com";
    const newSocket = io(SOCKET_URL, { withCredentials: true });
    setSocket(newSocket);

    // Online presence
    newSocket.on('online_users', (list) => setOnlineUserIds(new Set(list)));
    newSocket.on('user_online', ({ userId }) => setOnlineUserIds(prev => new Set([...prev, userId])));
    newSocket.on('user_offline', ({ userId }) => setOnlineUserIds(prev => { const n = new Set(prev); n.delete(userId); return n; }));

    // Typing indicators
    newSocket.on('user_typing', ({ userId }) => setTypingUsers(prev => new Set([...prev, userId])));
    newSocket.on('user_stopped_typing', ({ userId }) => setTypingUsers(prev => { const n = new Set(prev); n.delete(userId); return n; }));

    // Read receipts
    newSocket.on('messages_read', ({ readBy }) => {
      setMessages(prev => prev.map(m => (m.receiver === readBy || m.sender === readBy) ? { ...m, read: true } : m));
    });

    // Messages
    newSocket.on('receive_message', (message) => {
      if (message.sender === activeChatRef.current || message.receiver === activeChatRef.current) {
        setMessages(prev => [...prev, message]);
        // Auto mark as read if we're in this chat
        if (message.sender === activeChatRef.current) {
          newSocket.emit('mark_read', { senderId: message.sender });
        }
      }
      fetchConversations();
    });

    newSocket.on('message_sent', (message) => {
      setMessages(prev => [...prev, message]);
      fetchConversations();
    });

    return () => newSocket.disconnect();
  }, []); // Single mount

  const fetchConversations = async () => {
    try {
      const res = await axiosClient.get('/user/conversations');
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setConvoLoading(false);
    }
  };

  useEffect(() => { fetchConversations(); }, []);

  // Load messages when activeChat changes
  useEffect(() => {
    if (!activeChat) return;
    setMsgLoading(true);
    const convo = conversations.find(c => c.friend?._id === activeChat);
    if (convo) {
      setActiveFriend(convo.friend);
    } else {
      axiosClient.get(`/user/public-profile/${activeChat}`)
        .then(r => setActiveFriend(r.data.profile))
        .catch(() => {});
    }
    axiosClient.get(`/user/messages/${activeChat}`)
      .then(r => { setMessages(r.data); setMsgLoading(false); })
      .catch(() => setMsgLoading(false));

    // Mark messages as read
    if (socket) socket.emit('mark_read', { senderId: activeChat });
  }, [activeChat]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Focus input
  useEffect(() => {
    if (activeChat) setTimeout(() => inputRef.current?.focus(), 300);
  }, [activeChat]);

  // Typing handler with debounce
  const handleInputChange = useCallback((e) => {
    setNewMessage(e.target.value);
    if (!socket || !activeChat) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('start_typing', { receiverId: activeChat });
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit('stop_typing', { receiverId: activeChat });
    }, 1500);
  }, [socket, activeChat]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !activeChat) return;
    socket.emit('send_message', { receiverId: activeChat, text: newMessage.trim() });
    // Stop typing immediately
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit('stop_typing', { receiverId: activeChat });
      clearTimeout(typingTimeoutRef.current);
    }
    setNewMessage('');
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const dateKey = new Date(msg.createdAt).toDateString();
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(msg);
    return groups;
  }, {});

  const filteredConvos = conversations.filter(c =>
    !searchFilter || (c.friend?.firstName + ' ' + (c.friend?.lastName || '')).toLowerCase().includes(searchFilter.toLowerCase())
  );

  const isFriendOnline = (fId) => onlineUserIds.has(fId);
  const isFriendTyping = (fId) => typingUsers.has(fId);

  return (
    <div className="h-[100dvh] flex flex-col bg-base-200 overflow-hidden">
      <Helmet><title>Chat | CodeNEXT</title></Helmet>

      {/* Top bar */}
      <div className="bg-base-100 border-b border-base-300 px-3 sm:px-4 py-2 flex items-center gap-2 sm:gap-3 shrink-0 z-10 shadow-sm">
        <NavLink to="/" className="btn btn-ghost btn-sm btn-circle"><ArrowLeft className="w-5 h-5" /></NavLink>
        <h1 className="font-bold text-base sm:text-lg flex items-center gap-2"><MessageCircle className="w-5 h-5 text-primary" /> Chat</h1>
        <div className="flex-1" />
        <NavLink to="/people" className="btn btn-ghost btn-sm gap-1 hidden sm:inline-flex"><Users className="w-4 h-4" /> People</NavLink>
        <ThemeToggle size="sm" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        <div className={`${activeChat && !sidebarOpen ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 bg-base-100 border-r border-base-300 shrink-0 transition-all duration-300`}>
          {/* Search */}
          <div className="p-3 border-b border-base-300">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input type="text" placeholder="Search conversations..."
                className="input input-sm input-bordered w-full pl-9 pr-8 rounded-full bg-base-200 focus:bg-base-100 transition-colors"
                value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} />
              {searchFilter && (
                <button onClick={() => setSearchFilter('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {convoLoading ? (
              <div className="space-y-1 p-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                    <div className="w-11 h-11 rounded-full bg-base-300 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-base-300 rounded w-2/3" />
                      <div className="h-2.5 bg-base-300 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConvos.length === 0 ? (
              <div className="text-center py-16 px-6 animate-fade-in-up">
                <MessageCircle className="w-12 h-12 mx-auto text-base-content/15 mb-3" />
                <h3 className="font-bold mb-1">No conversations yet</h3>
                <p className="text-sm text-base-content/50 mb-4">Add friends to start chatting!</p>
                <NavLink to="/people" className="btn btn-primary btn-sm rounded-full">Find People</NavLink>
              </div>
            ) : (
              filteredConvos.map((convo, idx) => {
                const f = convo.friend;
                if (!f) return null;
                const isActive = activeChat === f._id;
                const online = isFriendOnline(f._id);
                const typing = isFriendTyping(f._id);

                return (
                  <div key={f._id}
                    onClick={() => { setActiveChat(f._id); setSidebarOpen(false); }}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 border-b border-base-200/50 active:scale-[0.98]
                      ${isActive ? 'bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-base-200/70'}`}
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    {/* Avatar with online dot */}
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-primary font-bold">
                        {f.firstName?.[0]?.toUpperCase() || '?'}
                      </div>
                      <OnlineDot isOnline={online} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm truncate">{f.firstName} {f.lastName || ''}</p>
                        {convo.lastMessage && (
                          <span className="text-[10px] text-base-content/40 shrink-0 ml-2">{formatTime(convo.lastMessage.createdAt)}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-base-content/50 truncate flex-1">
                          {typing ? (
                            <span className="text-primary font-medium italic">typing...</span>
                          ) : convo.lastMessage ? (
                            <>
                              {convo.lastMessage.sender === currentUser._id && <span className="text-primary mr-1">You:</span>}
                              {convo.lastMessage.text}
                            </>
                          ) : (
                            <span className="italic">Start a conversation</span>
                          )}
                        </p>
                        {convo.unreadCount > 0 && (
                          <span className="ml-2 w-5 h-5 rounded-full bg-primary text-primary-content text-[10px] font-bold flex items-center justify-center shrink-0 animate-bounce-in">
                            {convo.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Chat Area ── */}
        <div className={`${!activeChat && !sidebarOpen ? 'hidden md:flex' : activeChat ? 'flex' : 'hidden md:flex'} flex-col flex-1 bg-base-200 min-w-0`}>
          {!activeChat ? (
            <div className="flex-1 flex items-center justify-center animate-fade-in-up">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto rounded-full bg-base-300/50 flex items-center justify-center mb-4">
                  <MessageCircle className="w-12 h-12 text-base-content/10" />
                </div>
                <h2 className="text-xl font-bold text-base-content/40">Select a conversation</h2>
                <p className="text-sm text-base-content/30 mt-1">Choose a friend to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="bg-base-100 border-b border-base-300 px-3 sm:px-4 py-2.5 flex items-center gap-3 shrink-0 shadow-sm">
                <button onClick={() => { setActiveChat(null); setSidebarOpen(true); }} className="btn btn-ghost btn-sm btn-circle md:hidden">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="relative cursor-pointer" onClick={() => navigate(`/profile/${activeChat}`)}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-primary font-bold hover:scale-105 transition-transform">
                    {activeFriend?.firstName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <OnlineDot isOnline={isFriendOnline(activeChat)} size="lg" />
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/profile/${activeChat}`)}>
                  <p className="font-semibold text-sm truncate">{activeFriend?.firstName} {activeFriend?.lastName || ''}</p>
                  <p className="text-xs transition-all duration-300">
                    {isFriendTyping(activeChat) ? (
                      <span className="text-primary font-medium">typing...</span>
                    ) : isFriendOnline(activeChat) ? (
                      <span className="text-success font-medium">online</span>
                    ) : (
                      <span className="text-base-content/40">last seen {formatLastSeen(activeFriend?.lastSeen)}</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 overscroll-contain chat-bg">
                {msgLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full animate-fade-in-up">
                    <div className="text-center bg-base-100/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-base-300">
                      <Smile className="w-10 h-10 mx-auto text-primary/30 mb-2" />
                      <p className="text-sm text-base-content/50">No messages yet. Say hi to <span className="font-bold text-primary">{activeFriend?.firstName}</span>! 👋</p>
                    </div>
                  </div>
                ) : (
                  Object.entries(groupedMessages).map(([dateKey, dayMessages]) => (
                    <div key={dateKey}>
                      <div className="flex justify-center my-4">
                        <span className="bg-base-300/80 backdrop-blur-sm text-base-content/60 text-[11px] px-3 py-1 rounded-full font-medium shadow-sm">
                          {formatDate(dayMessages[0].createdAt)}
                        </span>
                      </div>
                      {dayMessages.map((msg, idx) => {
                        const isMe = msg.sender === currentUser._id;
                        return (
                          <div key={msg._id || idx} className={`flex mb-1.5 animate-chat-in ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] sm:max-w-[70%] px-3 py-2 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md
                              ${isMe
                                ? 'bg-primary text-primary-content rounded-br-md'
                                : 'bg-base-100 text-base-content rounded-bl-md border border-base-300'}`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                              <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <span className={`text-[10px] ${isMe ? 'text-primary-content/60' : 'text-base-content/40'}`}>
                                  {formatTime(msg.createdAt)}
                                </span>
                                {isMe && (
                                  msg.read
                                    ? <CheckCheck className="w-3.5 h-3.5 text-primary-content/80" />
                                    : <Check className="w-3 h-3 text-primary-content/50" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                {isFriendTyping(activeChat) && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSend} className="bg-base-100 border-t border-base-300 p-2 sm:p-3 flex items-center gap-2 sm:gap-3 shrink-0 safe-bottom">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message..."
                  className="input input-bordered flex-1 rounded-full bg-base-200 focus:bg-base-100 transition-colors h-10 sm:h-12 text-sm"
                  value={newMessage}
                  onChange={handleInputChange}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className={`btn btn-circle shadow-md transition-all duration-300 h-10 w-10 sm:h-12 sm:w-12 min-h-0
                    ${newMessage.trim() ? 'btn-primary shadow-primary/20 scale-100' : 'btn-ghost shadow-none scale-90 opacity-50'}`}
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
