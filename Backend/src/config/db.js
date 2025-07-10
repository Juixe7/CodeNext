const mongoose = require('mongoose');

const main = async () => {
  try {
    if (!process.env.DB_CONNECT_STRING) {
      throw new Error("DB_CONNECT_STRING is not defined in environment variables");
    }

    await mongoose.connect(process.env.DB_CONNECT_STRING);
    console.log("Database is connected!");
  } catch (err) {
    console.error("DB Connection Error:", err.message);
    throw err;
  }
};

module.exports = main;
