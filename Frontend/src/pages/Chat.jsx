import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { Send, Loader2, ArrowLeft, Search, MessageCircle, Check, CheckCheck, Users } from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import ThemeToggle from '../components/ThemeToggle';
import { Helmet } from 'react-helmet-async';

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
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

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Socket connection
  useEffect(() => {
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const SOCKET_URL = isLocalhost ? "http://localhost:3000" : "https://roadcode-a-coding-platform.onrender.com";
    const newSocket = io(SOCKET_URL, { withCredentials: true });
    setSocket(newSocket);

    newSocket.on('receive_message', (message) => {
      setMessages(prev => {
        if (message.sender === activeChat || message.receiver === activeChat) {
          return [...prev, message];
        }
        return prev;
      });
      // Refresh conversation list for new message preview
      fetchConversations();
    });

    newSocket.on('message_sent', (message) => {
      setMessages(prev => [...prev, message]);
      fetchConversations();
    });

    return () => newSocket.disconnect();
  }, [activeChat]);

  // Fetch conversations
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

  useEffect(() => {
    fetchConversations();
  }, []);

  // When activeChat changes, load messages + find friend info
  useEffect(() => {
    if (!activeChat) return;
    setMsgLoading(true);

    // Find friend from conversations
    const convo = conversations.find(c => c.friend?._id === activeChat);
    if (convo) {
      setActiveFriend(convo.friend);
    } else {
      // If not in conversations (new chat), fetch profile
      axiosClient.get(`/user/public-profile/${activeChat}`)
        .then(r => setActiveFriend(r.data.profile))
        .catch(() => {});
    }

    axiosClient.get(`/user/messages/${activeChat}`)
      .then(r => {
        setMessages(r.data);
        setMsgLoading(false);
      })
      .catch(() => setMsgLoading(false));
  }, [activeChat, conversations.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (activeChat) inputRef.current?.focus();
  }, [activeChat]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !activeChat) return;
    socket.emit('send_message', { receiverId: activeChat, text: newMessage.trim() });
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

  return (
    <div className="h-screen flex flex-col bg-base-200">
      <Helmet><title>Chat | RoadCode</title></Helmet>

      {/* Top bar */}
      <div className="bg-base-100 border-b border-base-300 px-4 py-2 flex items-center gap-3 shrink-0 z-10">
        <NavLink to="/" className="btn btn-ghost btn-sm btn-circle"><ArrowLeft className="w-5 h-5" /></NavLink>
        <h1 className="font-bold text-lg flex items-center gap-2"><MessageCircle className="w-5 h-5 text-primary" /> Chat</h1>
        <div className="flex-1" />
        <NavLink to="/people" className="btn btn-ghost btn-sm gap-1"><Users className="w-4 h-4" /> People</NavLink>
        <ThemeToggle size="sm" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`${activeChat && !sidebarOpen ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 bg-base-100 border-r border-base-300 shrink-0`}>
          {/* Search in conversations */}
          <div className="p-3 border-b border-base-300">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="input input-sm input-bordered w-full pl-9 rounded-full bg-base-200"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {convoLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : filteredConvos.length === 0 ? (
              <div className="text-center py-16 px-6">
                <MessageCircle className="w-12 h-12 mx-auto text-base-content/15 mb-3" />
                <h3 className="font-bold mb-1">No conversations yet</h3>
                <p className="text-sm text-base-content/50 mb-4">Add friends to start chatting!</p>
                <NavLink to="/people" className="btn btn-primary btn-sm rounded-full">Find People</NavLink>
              </div>
            ) : (
              filteredConvos.map(convo => {
                const f = convo.friend;
                if (!f) return null;
                const isActive = activeChat === f._id;
                return (
                  <div
                    key={f._id}
                    onClick={() => { setActiveChat(f._id); setSidebarOpen(false); }}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-base-200
                      ${isActive ? 'bg-primary/10' : 'hover:bg-base-200'}`}
                  >
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-primary font-bold shrink-0">
                      {f.firstName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm truncate">{f.firstName} {f.lastName || ''}</p>
                        {convo.lastMessage && (
                          <span className="text-[10px] text-base-content/40 shrink-0">{formatTime(convo.lastMessage.createdAt)}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-base-content/50 truncate flex-1">
                          {convo.lastMessage ? (
                            <>
                              {convo.lastMessage.sender === currentUser._id && <span className="text-primary mr-1">You:</span>}
                              {convo.lastMessage.text}
                            </>
                          ) : (
                            <span className="italic">Start a conversation</span>
                          )}
                        </p>
                        {convo.unreadCount > 0 && (
                          <span className="ml-2 w-5 h-5 rounded-full bg-primary text-primary-content text-[10px] font-bold flex items-center justify-center shrink-0">
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

        {/* Chat Area */}
        <div className={`${!activeChat && !sidebarOpen ? 'hidden md:flex' : activeChat ? 'flex' : 'hidden md:flex'} flex-col flex-1 bg-base-200`}>
          {!activeChat ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-20 h-20 mx-auto text-base-content/10 mb-4" />
                <h2 className="text-xl font-bold text-base-content/40">Select a conversation</h2>
                <p className="text-sm text-base-content/30 mt-1">Choose a friend to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="bg-base-100 border-b border-base-300 px-4 py-3 flex items-center gap-3 shrink-0">
                <button onClick={() => { setActiveChat(null); setSidebarOpen(true); }} className="btn btn-ghost btn-sm btn-circle md:hidden">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-primary font-bold cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => navigate(`/profile/${activeChat}`)}
                >
                  {activeFriend?.firstName?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 cursor-pointer" onClick={() => navigate(`/profile/${activeChat}`)}>
                  <p className="font-semibold text-sm">{activeFriend?.firstName} {activeFriend?.lastName || ''}</p>
                  <p className="text-xs text-base-content/50">Elo: {activeFriend?.eloRating || 1200}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, oklch(var(--p) / 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 50%, oklch(var(--s) / 0.03) 0%, transparent 50%)' }}>
                {msgLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center bg-base-100/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-base-300">
                      <p className="text-sm text-base-content/50">No messages yet. Say hi to <span className="font-bold text-primary">{activeFriend?.firstName}</span>! 👋</p>
                    </div>
                  </div>
                ) : (
                  Object.entries(groupedMessages).map(([dateKey, dayMessages]) => (
                    <div key={dateKey}>
                      {/* Date separator */}
                      <div className="flex justify-center my-4">
                        <span className="bg-base-300/80 backdrop-blur-sm text-base-content/60 text-[11px] px-3 py-1 rounded-full font-medium shadow-sm">
                          {formatDate(dayMessages[0].createdAt)}
                        </span>
                      </div>
                      {dayMessages.map((msg, idx) => {
                        const isMe = msg.sender === currentUser._id;
                        return (
                          <div key={msg._id || idx} className={`flex mb-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] px-3 py-2 rounded-2xl shadow-sm relative group
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
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSend} className="bg-base-100 border-t border-base-300 p-3 flex items-center gap-3 shrink-0">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message..."
                  className="input input-bordered flex-1 rounded-full bg-base-200"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="btn btn-primary btn-circle shadow-md shadow-primary/20 disabled:shadow-none transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
