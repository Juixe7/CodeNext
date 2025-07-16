const mongoose = require('mongoose');

const main = async () => {
  try {
    if (!process.env.DB_CONNECT_STRING) {
      throw new Error("DB_CONNECT_STRING is not defined in environment variables");
    }

    // Set up connection event listeners for better production observability
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected! Mongoose will automatically try to reconnect.');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error event:', err.message);
    });

    console.log("🔗 Attempting to connect to MongoDB...");
    // Mongoose 6+ no longer requires useNewUrlParser or useUnifiedTopology options
    await mongoose.connect(process.env.DB_CONNECT_STRING);
    console.log("✅ Database is connected!");
  } catch (err) {
    console.error("❌ DB Initial Connection Error:", err.message);
    throw err;
  }
};

module.exports = main;
