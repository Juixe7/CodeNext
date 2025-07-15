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

app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:5173",
  "https://road-code-tau.vercel.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log("🌐 CORS origin:", origin);

    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }

    console.warn("❌ CORS blocked origin:", origin);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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

app.use("/user", authRouter);
app.use("/problem", problemRouter);
app.use("/submission", submitRouter);
app.use("/ai", aiRouter);
app.use("/video", videoRouter);

const startServer = async () => {
  try {
    console.log("🚀 Starting server initialization...");
    validateEnvironment();

    await connectDB();
    console.log("✅ MongoDB connected");

    try {
      await redisClient.connect();
      console.log("✅ Redis connected");
    } catch (err) {
      console.warn("⚠️ Redis unavailable:", err.message);
    }

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🎉 Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("💥 Fatal startup error:", err.message);
    process.exit(1);
  }
};

startServer();
