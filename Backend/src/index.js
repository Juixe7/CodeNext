const express = require('express');
const app = express();
require('dotenv').config();
const validateEnvironment = require('./utils/envValidator');
const main = require('./config/db');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const redisClient = require('./config/redis');

const authRouter = require('./routes/userAuth');
const problemRouter = require('./routes/problemCreator');
const submitRouter = require('./routes/submit');
const aiRouter = require('./routes/aiChatting');
const videoRouter = require('./routes/videoCreator');

// Allow local dev and deployed Vercel frontend
const allowedOrigins = [
    'http://localhost:5173',
    'https://coderoad-frontend-fowp7z2sl-akhils-projects-7c00dc14.vercel.app',
    'https://road-code-eey1gvc9t-akhils-projects-7c00dc14.vercel.app',
    'https://road-code-q17iukdfs-akhils-projects-7c00dc14.vercel.app'
];

app.set('trust proxy', 1);

app.use(cors({
    origin: function (origin, callback) {
        console.log('🌐 CORS request from origin:', origin);
        console.log('✅ Allowed origins:', allowedOrigins);
        
        if (!origin) {
            console.log('⚠️  No origin header (likely same-origin request)');
            return callback(null, true);
        }
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            console.log('✅ Origin allowed:', origin);
            return callback(null, true);
        }
        
        console.log('❌ Origin not allowed:', origin);
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Health check route
// Root route for testing / live URL

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
    res.status(200).json({
      status: 'OK',
      message: 'API is running. Use /health for server check or /user, /problem, etc. for endpoints.',
      timestamp: new Date().toISOString()
    });
  });
  
  

// Routes
app.use('/user', authRouter);
app.use('/problem', problemRouter);
app.use('/submission', submitRouter);
app.use('/ai', aiRouter);
app.use('/video', videoRouter);

const initializeConnection = async () => {
  try {
    console.log("🚀 Starting server initialization...");
    
    // Validate environment variables first
    validateEnvironment();
    
    console.log("📊 Connecting to MongoDB...");
    await main(); // MongoDB connection
    console.log("✅ DB Connected");

    console.log("🔴 Connecting to Redis...");
    // connect to redis but don't block server start
    redisClient.connect().then(()=>{
        console.log("✅ Redis connected");
    }).catch((err)=>{
        console.error("❌ Redis connect error:", err && err.message ? err.message : err);
        console.log("⚠️  Continuing without Redis...");
    });

    redisClient.on('reconnecting', ()=>{
        console.warn("🔄 Redis reconnecting...");
    });
    redisClient.on('ready', ()=>{
        console.log("✅ Redis ready");
    });

    const PORT = process.env.PORT || 3000;
    console.log(`🌐 Starting server on port ${PORT}...`);
    
    app.listen(PORT, ()=>{
        console.log(`🎉 Server successfully listening at port number: ${PORT}`);
        console.log("🚀 Application is ready!");
    })

  } catch (err) {
    console.error("💥 Initialization Error:", err.message);
    console.error("📋 Full error details:", err);
    process.exit(1);
  }
};

initializeConnection();
