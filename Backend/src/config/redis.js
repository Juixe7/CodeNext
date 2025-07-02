const { createClient } = require("redis");

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: 'redis-10089.c266.us-east-1-3.ec2.redns.redis-cloud.com',
        port: 10089
    }
});

module.exports = redisClient;