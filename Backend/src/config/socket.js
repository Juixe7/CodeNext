const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Match = require('../models/match');
const Problem = require('../models/problem');
const User = require('../models/user');

let io;
let waitingQueue = [];

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
        console.log(`User connected to socket: ${socket.user.id}`);

        // Join Matchmaking Queue
        socket.on('join_queue', async () => {
            if (waitingQueue.find(u => u.id === socket.user.id)) return; // Already in queue

            waitingQueue.push({ id: socket.user.id, socketId: socket.id });
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
            waitingQueue = waitingQueue.filter(u => u.id !== socket.user.id);
        });

        // Broadcast progress to opponent
        socket.on('progress_update', ({ matchId, progress }) => {
            socket.to(matchId).emit('opponent_progress', { progress });
        });

        // Rejoin match room when navigating to ProblemPage
        socket.on('rejoin_match', ({ matchId }) => {
            socket.join(matchId);
            console.log(`User ${socket.user.id} rejoined match room ${matchId}`);
        });

        socket.on('disconnect', () => {
            waitingQueue = waitingQueue.filter(u => u.id !== socket.user.id);
            console.log(`User disconnected from socket: ${socket.user.id}`);
        });
    });
};

const getIo = () => io;

module.exports = { initializeSocket, getIo };
