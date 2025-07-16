const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis");
const { isRedisReady } = require("../config/redis");

const userMiddleware = async (req, res, next) => {

    try {

        const { token } = req.cookies;
        if (!token)
            throw new Error("Token is not present");

        const payload = jwt.verify(token, process.env.JWT_KEY);

        const { _id } = payload;

        if (!_id) {
            throw new Error("Invalid token");
        }

        const result = await User.findById(_id);

        if (!result) {
            throw new Error("User Doesn't Exist");
        }

        // Check Redis blocklist — but only if Redis is actually connected.
        // If Redis is down, we fail-open (allow the request) to avoid locking
        // out all users due to a Redis infrastructure issue.
        if (isRedisReady()) {
            const isBlocked = await redisClient.exists(`token:${token}`);
            if (isBlocked)
                throw new Error("Invalid Token");
        } else {
            console.warn("⚠️  Redis unavailable — skipping blocklist check for token");
        }

        req.result = result;

        next();
    }
    catch (err) {
        res.status(401).send("Error: " + err.message);
    }

}


module.exports = userMiddleware;
