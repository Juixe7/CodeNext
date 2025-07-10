const mongoose = require('mongoose');

const main = async () => {
  try {
    if (!process.env.DB_CONNECT_STRING) {
      throw new Error("DB_CONNECT_STRING is not defined in environment variables");
    }

    console.log("🔗 Attempting to connect to MongoDB...");
    await mongoose.connect(process.env.DB_CONNECT_STRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Database is connected!");
  } catch (err) {
    console.error("❌ DB Connection Error:", err.message);
    console.error("📋 Full DB error:", err);
    throw err;
  }
};

module.exports = main;
