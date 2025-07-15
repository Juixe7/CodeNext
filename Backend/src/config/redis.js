const { createClient } = require("redis");

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: process.env.REDIS_HOST || 'redis-16903.crce276.ap-south-1-3.ec2.cloud.redislabs.com',
        port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 16903,
        reconnectStrategy: (retries) => {
            const delay = Math.min(1000 * Math.pow(2, retries), 10000);
            return delay;
        }
    }
});

redisClient.on('error', (err) => {
    console.error("Redis client error:", err && err.message ? err.message : err);
});

module.exports = redisClient;
