const Redis = require('ioredis');

let redisClient = null;

/**
 * Create Redis client with graceful fallback if Redis is not available
 */
const createRedisClient = () => {
    const client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        retryStrategy: (times) => {
            if (times > 3) {
                console.warn('⚠️  Redis not available, running without cache');
                return null; // Stop retrying
            }
            return Math.min(times * 100, 3000);
        },
        lazyConnect: true,
        enableOfflineQueue: false,
    });

    client.on('connect', () => console.log('✅ Redis Connected'));
    client.on('error', (err) => {
        if (err.code !== 'ECONNREFUSED') {
            console.error('Redis error:', err.message);
        }
    });

    return client;
};

const getRedis = () => {
    if (!redisClient) {
        redisClient = createRedisClient();
    }
    return redisClient;
};

/**
 * Safe cache get - returns null if Redis is unavailable
 */
const cacheGet = async (key) => {
    try {
        const client = getRedis();
        return await client.get(key);
    } catch {
        return null;
    }
};

/**
 * Safe cache set - silently fails if Redis is unavailable
 */
const cacheSet = async (key, value, ttlSeconds = 3600) => {
    try {
        const client = getRedis();
        await client.setex(key, ttlSeconds, value);
    } catch {
        // Silently fail - app works without cache
    }
};

const cacheDel = async (key) => {
    try {
        const client = getRedis();
        await client.del(key);
    } catch { }
};

module.exports = { getRedis, cacheGet, cacheSet, cacheDel };
