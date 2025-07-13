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
  "https://road-code-tau.vercel.app",
  'https://coderoad-frontend.vercel.app',          // ✅ add this
  'https://coderoad-frontend-fowp7z2sl-akhils-projects-7c00dc14.vercel.app',
  'https://road-code-eey1gvc9t-akhils-projects-7c00dc14.vercel.app',
  'https://road-code-q17iukdfs-akhils-projects-7c00dc14.vercel.app',
  'https://road-code-3rkae8wfb-akhils-projects-7c00dc14.vercel.app'
];
// Function to check if origin is allowed (including dynamic Vercel URLs)
const isOriginAllowed = (origin) => {
    // Check exact matches
    if (allowedOrigins.includes(origin)) {
        return true;
    }
    
    // Allow any Vercel preview URL for this project
    if (origin && origin.includes('vercel.app') && origin.includes('akhils-projects')) {
        return true;
    }
    
    return false;
};

app.set('trust proxy', 1);

app.use(
  cors({
    origin: (origin, callback) => {
      console.log("🌐 CORS request from:", origin);

      // allow server-to-server / Postman / health checks
      if (!origin) return callback(null, true);

      // exact matches
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // allow ALL vercel previews (important)
      if (origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      // ❌ DO NOT THROW ERROR
      console.warn("❌ CORS blocked origin:", origin);
      return callback(null, false);
    },
    credentials: true,
  })
);


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

const initializeConnection = () => {
  try {
    console.log("🚀 Starting server initialization...");
    validateEnvironment();

    const PORT = process.env.PORT || 3000;

    // 🔥 START SERVER FIRST
    app.listen(PORT, () => {
      console.log(`🎉 Server listening on port ${PORT}`);
    });

    // MongoDB (background)
    main()
      .then(() => console.log("✅ DB Connected"))
      .catch(err =>
        console.error("⚠️ MongoDB connection failed:", err.message)
      );

    // Redis (background, optional)
    redisClient.connect()
      .then(() => console.log("✅ Redis connected"))
      .catch(() => console.warn("⚠️ Redis unavailable"));

  } catch (err) {
    console.error("💥 Initialization Error:", err);
    process.exit(1);
  }
};

initializeConnection();

