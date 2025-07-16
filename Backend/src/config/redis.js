const { createClient } = require("redis");

const MAX_RETRIES = 10;

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: process.env.REDIS_HOST || 'redis-16903.crce276.ap-south-1-3.ec2.cloud.redislabs.com',
        port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 16903,
        reconnectStrategy: (retries) => {
            if (retries >= MAX_RETRIES) {
                console.error(`❌ Redis: giving up after ${MAX_RETRIES} reconnection attempts.`);
                return new Error("Redis max retries exceeded");
            }
            const delay = Math.min(1000 * Math.pow(2, retries), 10000);
            console.warn(`⏳ Redis: reconnect attempt ${retries + 1}/${MAX_RETRIES} in ${delay}ms`);
            return delay;
        }
    }
});

redisClient.on('error', (err) => {
    console.error("Redis client error:", err && err.message ? err.message : err);
});

redisClient.on('ready', () => console.log("✅ Redis ready"));
redisClient.on('reconnecting', () => console.warn("⏳ Redis reconnecting..."));
redisClient.on('end', () => console.warn("⚠️  Redis connection closed"));

/**
 * Safe guard: returns true only when Redis is connected and ready.
 * Use this before every Redis call to avoid crashing on network blips.
 */
const isRedisReady = () => redisClient.isReady;

module.exports = redisClient;
module.exports.isRedisReady = isRedisReady;
