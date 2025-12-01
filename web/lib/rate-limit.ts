// Simple in-memory rate limiter
// For production, use Redis or a proper rate limiting service

interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

const store: RateLimitStore = {};

export function rateLimit(identifier: string, limit: number = 5, windowMs: number = 60000): { success: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const record = store[identifier];

    // Clean up old entries
    if (record && now > record.resetTime) {
        delete store[identifier];
    }

    if (!store[identifier]) {
        store[identifier] = {
            count: 1,
            resetTime: now + windowMs
        };
        return { success: true, remaining: limit - 1, resetTime: store[identifier].resetTime };
    }

    if (store[identifier].count >= limit) {
        return {
            success: false,
            remaining: 0,
            resetTime: store[identifier].resetTime
        };
    }

    store[identifier].count++;
    return {
        success: true,
        remaining: limit - store[identifier].count,
        resetTime: store[identifier].resetTime
    };
}

// Cleanup old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    Object.keys(store).forEach(key => {
        if (now > store[key].resetTime) {
            delete store[key];
        }
    });
}, 5 * 60 * 1000);
