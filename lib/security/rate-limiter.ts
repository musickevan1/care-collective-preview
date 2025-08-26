import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Define rate limiters for different endpoints
export const rateLimiters = {
  // Authentication endpoints - strict limits
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 minutes
    prefix: 'rl:auth',
  }),
  
  // API endpoints - moderate limits
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 requests per minute
    prefix: 'rl:api',
  }),
  
  // Form submissions - prevent spam
  forms: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 submissions per minute
    prefix: 'rl:forms',
  }),
  
  // Strict endpoints - sensitive operations
  strict: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 m'), // 3 requests per minute
    prefix: 'rl:strict',
  }),
};

// Rate limit middleware
export async function rateLimit(
  request: NextRequest,
  limiterType: keyof typeof rateLimiters = 'api'
) {
  // Extract IP address from various sources
  const ip = request.headers.get('x-forwarded-for') ?? 
           request.headers.get('x-real-ip') ?? 
           request.headers.get('cf-connecting-ip') ?? 
           '127.0.0.1';
  const limiter = rateLimiters[limiterType];
  
  const { success, limit, reset, remaining } = await limiter.limit(ip);
  
  if (!success) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(reset).toISOString(),
        'Retry-After': Math.floor((reset - Date.now()) / 1000).toString(),
      },
    });
  }
  
  return null; // Continue with request
}

// Helper function to get rate limit status without consuming
export async function getRateLimitStatus(
  ip: string,
  limiterType: keyof typeof rateLimiters = 'api'
) {
  // Define prefix based on limiter type
  const prefixMap = {
    auth: 'rl:auth',
    api: 'rl:api', 
    forms: 'rl:forms',
    strict: 'rl:strict'
  };
  
  const identifier = `${prefixMap[limiterType]}:${ip}`;
  
  // Get current window count
  const count = await redis.get(identifier);
  
  // Define limits based on type
  const limits = {
    auth: 5,
    strict: 3,
    forms: 10,
    api: 60
  };
  
  const limit = limits[limiterType];
  
  return {
    count: count || 0,
    limit,
    remaining: Math.max(0, limit - (Number(count) || 0)),
  };
}