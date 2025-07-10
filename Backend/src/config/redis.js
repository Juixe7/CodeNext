const { createClient } = require("redis");

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: process.env.REDIS_HOST || 'redis-17648.c301.ap-south-1-1.ec2.redns.redis-cloud.com',
        port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 17648,
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