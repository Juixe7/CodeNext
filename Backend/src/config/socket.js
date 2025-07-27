const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Match = require('../models/match');
const Problem = require('../models/problem');
const User = require('../models/user');
const Message = require('../models/message');

let io;
let waitingQueue = [];

// Track online users: userId -> Set of socketIds (supports multiple tabs)
const onlineUsers = new Map();

const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [
                "http://localhost:5173",
                "https://road-code-tau.vercel.app",
            ],
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Middleware to authenticate socket connection
    io.use((socket, next) => {
        let token = null;
        if (socket.handshake.headers.cookie) {
            const cookies = socket.handshake.headers.cookie.split(';').reduce((res, c) => {
                const [key, val] = c.trim().split('=');
                res[key] = val;
                return res;
            }, {});
            token = cookies.token;
        }

        if (!token) {
            return next(new Error('Authentication error'));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_KEY);
            socket.user = { id: decoded._id, ...decoded }; // Store user details in socket
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.user.id;
        console.log(`User connected to socket: ${userId}`);
        
        // Join personal room for private messages
        socket.join(userId);

        // ── Online Presence ──
        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
        }
        onlineUsers.get(userId).add(socket.id);

        // Broadcast this user is online to all connected users
        io.emit('user_online', { userId });

        // Send the full list of online users to the newly connected socket
        const onlineList = Array.from(onlineUsers.keys());
        socket.emit('online_users', onlineList);

        // ── Typing Indicators ──
        socket.on('start_typing', ({ receiverId }) => {
            socket.to(receiverId).emit('user_typing', { userId });
        });

        socket.on('stop_typing', ({ receiverId }) => {
            socket.to(receiverId).emit('user_stopped_typing', { userId });
        });

        // ── Mark Messages as Read ──
        socket.on('mark_read', async ({ senderId }) => {
            try {
                await Message.updateMany(
                    { sender: senderId, receiver: userId, read: { $ne: true } },
                    { $set: { read: true } }
                );
                // Notify the original sender that their messages were read
                socket.to(senderId).emit('messages_read', { readBy: userId });
            } catch (err) {
                console.error('mark_read error:', err);
            }
        });

        // Join Matchmaking Queue
        socket.on('join_queue', async () => {
            if (waitingQueue.find(u => u.id === userId)) return; // Already in queue

            waitingQueue.push({ id: userId, socketId: socket.id });
            socket.emit('queue_status', { status: 'waiting' });

            if (waitingQueue.length >= 2) {
                // We have a match!
                const player1 = waitingQueue.shift();
                const player2 = waitingQueue.shift();

                try {
                    // Pick a random problem (e.g. easy or medium)
                    const count = await Problem.countDocuments();
                    const random = Math.floor(Math.random() * count);
                    const problem = await Problem.findOne().skip(random);

                    if (!problem) {
                        // Fallback if no problems in DB
                        io.to(player1.socketId).emit('queue_status', { status: 'error', message: 'No problems found' });
                        io.to(player2.socketId).emit('queue_status', { status: 'error', message: 'No problems found' });
                        return;
                    }

                    // Create Match in DB
                    const match = await Match.create({
                        players: [player1.id, player2.id],
                        problem: problem._id,
                        status: 'ongoing',
                        startTime: new Date()
                    });

                    // Put both players in a socket room
                    const roomId = match._id.toString();
                    const socket1 = io.sockets.sockets.get(player1.socketId);
                    const socket2 = io.sockets.sockets.get(player2.socketId);

                    if (socket1) socket1.join(roomId);
                    if (socket2) socket2.join(roomId);

                    // Notify players
                    io.to(roomId).emit('match_started', {
                        matchId: match._id,
                        problemId: problem._id,
                        timeLimitSeconds: match.timeLimitSeconds,
                        startTime: match.startTime
                    });

                } catch (err) {
                    console.error('Match creation error:', err);
                }
            }
        });

        // Leave Queue
        socket.on('leave_queue', () => {
            waitingQueue = waitingQueue.filter(u => u.id !== userId);
        });

        // Broadcast progress to opponent
        socket.on('progress_update', ({ matchId, progress }) => {
            socket.to(matchId).emit('opponent_progress', { progress });
        });

        // Rejoin match room when navigating to ProblemPage
        socket.on('rejoin_match', ({ matchId }) => {
            socket.join(matchId);
            console.log(`User ${userId} rejoined match room ${matchId}`);
        });

        // Chat Feature: Send a direct message
        socket.on('send_message', async ({ receiverId, text }) => {
            try {
                // Save to database
                const message = await Message.create({
                    sender: userId,
                    receiver: receiverId,
                    text: text
                });

                // Emit to receiver
                socket.to(receiverId).emit('receive_message', message);
                
                // Emit back to sender (optional, but good for confirmation)
                socket.emit('message_sent', message);
            } catch (err) {
                console.error('Failed to send message:', err);
            }
        });

        socket.on('disconnect', async () => {
            waitingQueue = waitingQueue.filter(u => u.id !== userId);
            
            // Remove this socket from the user's set
            const sockets = onlineUsers.get(userId);
            if (sockets) {
                sockets.delete(socket.id);
                // Only mark offline if NO tabs/sockets remain
                if (sockets.size === 0) {
                    onlineUsers.delete(userId);
                    
                    // Persist lastSeen timestamp
                    try {
                        await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
                    } catch (err) {
                        console.error('Failed to update lastSeen:', err);
                    }

                    // Broadcast offline status with lastSeen timestamp
                    io.emit('user_offline', { userId, lastSeen: new Date() });
                }
            }

            console.log(`User disconnected from socket: ${userId}`);
        });
    });
};

const getIo = () => io;
const getOnlineUsers = () => onlineUsers;

module.exports = { initializeSocket, getIo, getOnlineUsers };
