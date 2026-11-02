import { createClient } from "redis";
import {config} from "../config/env.js";
let redisClientInstance = null;
let connectPromise = null;

 export const getRedisClient = async () => {


  // 1. Don't create or connect if URL is missing or empty
  if (config.security.rateLimitStorage !== "redis" || !config.security.redisUrl) {
    return null;
  }

  // 2. Return the existing client if already connected
  if (redisClientInstance && redisClientInstance.isOpen) {
    return redisClientInstance;
  }

  // 3. If a connection is currently in progress, wait for it
  if (connectPromise) {
    await connectPromise;
    return redisClientInstance;
  }

  // 4. Create the client instance
  redisClientInstance = createClient({
    url: config.security.redisUrl,
  });

  redisClientInstance.on("error", (err) => {
    console.error("Redis error:", err);
  });

  // 5. Start connection and cache its Promise
  connectPromise = redisClientInstance
    .connect()
    .then(() => {
      console.log("Connected to Redis successfully");
    })
    .catch((err) => {
      console.error("Failed to connect to Redis:", err);
      // Reset state if connection fails
      redisClientInstance = null;
      throw err;
    })
    .finally(() => {
      connectPromise = null;
    });

  // 6. Wait for the connection to complete
  await connectPromise;

  // 7. Return the connected client
  return redisClientInstance;
};

// Safe top-level export that avoids hanging or erroring if REDIS_URL is missing
// export const redisClient =await getRedisClient();
