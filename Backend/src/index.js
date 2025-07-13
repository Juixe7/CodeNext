const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const validateEnvironment = require("./utils/envValidator");
const connectDB = require("./config/db");
const redisClient = require("./config/redis");

// Routes
const authRouter = require("./routes/userAuth");
const problemRouter = require("./routes/problemCreator");
const submitRouter = require("./routes/submit");
const aiRouter = require("./routes/aiChatting");
const videoRouter = require("./routes/videoCreator");

dotenv.config();

const app = express();

/* --------------------------------------------------
   TRUST PROXY (REQUIRED FOR RENDER + COOKIES)
-------------------------------------------------- */
app.set("trust proxy", 1);

/* --------------------------------------------------
   CORS CONFIG (FINAL + WORKING)
-------------------------------------------------- */
const allowedOrigins = [
  "http://localhost:5173",
  "https://road-code-tau.vercel.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log("🌐 CORS origin:", origin);

    // allow server-to-server, health checks, Postman
    if (!origin) return callback(null, true);

    // allow exact frontend
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // allow ALL Vercel preview deployments
    if (origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }

    // ❌ NEVER THROW
    console.warn("❌ CORS blocked origin:", origin);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

/* --------------------------------------------------
   APPLY CORS (ORDER MATTERS)
-------------------------------------------------- */
app.use(cors(corsOptions));

// 🔥 THIS LINE FIXES YOUR ISSUE (PRE-FLIGHT)
app.options("*", cors(corsOptions));

/* --------------------------------------------------
   MIDDLEWARE
-------------------------------------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* --------------------------------------------------
   HEALTH & ROOT ROUTES
-------------------------------------------------- */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "API is running 🚀",
    timestamp: new Date().toISOString(),
  });
});

/* --------------------------------------------------
   API ROUTES
-------------------------------------------------- */
app.use("/user", authRouter);
app.use("/problem", problemRouter);
app.use("/submission", submitRouter);
app.use("/ai", aiRouter);
app.use("/video", videoRouter);

/* --------------------------------------------------
   SERVER STARTUP (NON-BLOCKING)
-------------------------------------------------- */
const startServer = () => {
  try {
    console.log("🚀 Starting server initialization...");
    validateEnvironment();

    const PORT = process.env.PORT || 3000;

    // 🔥 START SERVER FIRST
    app.listen(PORT, () => {
      console.log(`🎉 Server listening on port ${PORT}`);
    });

    // MongoDB (background)
    connectDB()
      .then(() => console.log("✅ MongoDB connected"))
      .catch((err) =>
        console.error("⚠️ MongoDB connection failed:", err.message)
      );

    // Redis (background, optional)
    redisClient
      .connect()
      .then(() => console.log("✅ Redis connected"))
      .catch(() => console.warn("⚠️ Redis unavailable"));

  } catch (err) {
    console.error("💥 Fatal startup error:", err);
    process.exit(1);
  }
};

startServer();
