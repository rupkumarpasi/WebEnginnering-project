import rateLimit from "express-rate-limit";
import {RedisStore} from "rate-limit-redis";

export const rateLimitConfig =(options)=>{
const rateLimiter = {
    windowMs: options.windowMs || 60 * 1000, // Default to 1 minute
    limit: options.limit || 10, // Default to 10 requests per windowMs
    standardHeaders: options.standardHeaders ?? true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: options.handler
}
if(options.route && options.route === "auth"){
    rateLimiter.skipSuccessfulRequests = options.skipSuccessfulRequests ?? true;    
    rateLimiter.keyGenerator = options.keyGenerator ?? ((req) => `${req.ip}:${String(req.body?.email ?? '').toLowerCase()}`);
}

if(options.redisClient){
    
    rateLimiter.store = new RedisStore({
        sendCommand: (...args) => options.redisClient.sendCommand(args),
        prefix: options.prefix || 'General:',
    });

    
    console.log("Redis store configured for rate limiting");
}
else{
    console.warn("REDIS_URL is not set. Rate limiting will use in-memory store, which may not be suitable for production.");
}
    return rateLimit(rateLimiter);
}