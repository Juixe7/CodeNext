const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis");
const { isRedisReady } = require("../config/redis");

const adminMiddleware = async (req, res, next) => {

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

        if (payload.role != 'admin')
            throw new Error("Invalid Token");

        if (!result) {
            throw new Error("User Doesn't Exist");
        }

        // Check Redis blocklist — but only if Redis is actually connected.
        // If Redis is down, we fail-open to avoid locking out admins.
        if (isRedisReady()) {
            const isBlocked = await redisClient.exists(`token:${token}`);
            if (isBlocked)
                throw new Error("Invalid Token");
        } else {
            console.warn("⚠️  Redis unavailable — skipping blocklist check for admin token");
        }

        req.result = result;

        next();
    }
    catch (err) {
        res.status(401).send("Error:" + err.message);
    }

}


module.exports = adminMiddleware;
