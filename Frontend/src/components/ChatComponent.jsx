import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axiosClient from '../utils/axiosClient';
import { Send, Loader2, X } from 'lucide-react';

export default function ChatComponent({ currentUser, friendId, friendName, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Fetch chat history
    axiosClient.get(`/user/messages/${friendId}`)
      .then(res => {
        setMessages(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load messages', err);
        setLoading(false);
      });

    // Initialize socket
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const SOCKET_URL = isLocalhost ? "http://localhost:3000" : "https://roadcode-a-coding-platform.onrender.com";
    
    const newSocket = io(SOCKET_URL, {
      withCredentials: true
    });
    setSocket(newSocket);

    newSocket.on('receive_message', (message) => {
      if (message.sender === friendId || message.receiver === friendId) {
        setMessages(prev => [...prev, message]);
      }
    });

    newSocket.on('message_sent', (message) => {
       if (message.receiver === friendId) {
          setMessages(prev => [...prev, message]);
       }
    });

    return () => newSocket.disconnect();
  }, [friendId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;
    
    socket.emit('send_message', { receiverId: friendId, text: newMessage });
    setNewMessage('');
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 sm:w-96 bg-base-100 border border-base-300 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden h-[450px]">
      <div className="bg-primary text-primary-content p-3 flex justify-between items-center shadow-sm">
        <h3 className="font-bold">Chat with {friendName}</h3>
        <button onClick={onClose} className="hover:bg-primary-focus p-1 rounded-full transition-colors"><X size={18}/></button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-base-200/50">
        {loading ? (
           <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-primary"/></div>
        ) : messages.length === 0 ? (
           <div className="text-center text-sm text-base-content/50 mt-4">No messages yet. Say hi!</div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender === currentUser._id;
            return (
              <div key={idx} className={`chat ${isMe ? 'chat-end' : 'chat-start'}`}>
                <div className={`chat-bubble ${isMe ? 'chat-bubble-primary text-primary-content' : 'bg-base-300 text-base-content'} text-sm py-2 px-3 shadow-sm`}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-3 bg-base-100 border-t border-base-300 flex gap-2">
        <input 
          type="text" 
          placeholder="Type a message..." 
          className="input input-sm input-bordered flex-1 rounded-full"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit" disabled={!newMessage.trim()} className="btn btn-sm btn-primary btn-circle">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
