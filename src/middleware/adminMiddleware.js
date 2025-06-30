const adminRegister=require("../controllers/userAuthenticate");
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const redisClient = require("../config/redis");

const adminMiddleware = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).send("Token is not present");
    }

    const payload = jwt.verify(token, process.env.SECRET_KEY);
    const { _id } = payload;

    if (!_id) {
      return res.status(401).send("Invalid Token!");
    }

    const user = await User.findById(_id);
    if(payload.role!='admin')
        throw new Error("Invalid token!");
    if (!user) {
      return res.status(401).send("User doesn't exist!");
    }

    const isBlocked = await redisClient.exists(`token:${token}`);
    if (isBlocked) {
      return res.status(401).send("Invalid Token (Blocked)");
    }

    req.user = user; // attach user data to request
    next(); // 🚀 pass control to the next middleware/route
  } catch (err) {
    console.error("Middleware Error:", err.message);
    res.status(401).send("Authentication Failed: " + err.message);
  }
};

module.exports = adminMiddleware;