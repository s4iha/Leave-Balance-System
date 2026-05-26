import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = redisUrl && redisToken ? new Redis({
  url: redisUrl,
  token: redisToken,
}) : null;

const otpEmailLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
  prefix: '@lbs/ratelimit/otp-email',
}) : null;

export async function limitOtpByEmail(email: string) {
  if (!otpEmailLimiter) {
    // If rate limiting is not configured, we allow the request
    return { success: true, remaining: 1, limit: 1, reset: Date.now() };
  }
  const key = `otp-email:${email.toLowerCase()}`;
  return otpEmailLimiter.limit(key);
}
