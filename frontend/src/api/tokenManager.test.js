import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  hasAccessToken,
  parseToken,
  isTokenExpired,
  getTokenExpiresIn,
  isTokenExpiringSoon,
} from './tokenManager';

describe('tokenManager', () => {
  beforeEach(() => {
    // Clear token before each test
    clearAccessToken();
  });

  describe('getAccessToken / setAccessToken', () => {
    it('returns null when no token is set', () => {
      expect(getAccessToken()).toBeNull();
    });

    it('returns the token after setting it', () => {
      setAccessToken('test-token');
      expect(getAccessToken()).toBe('test-token');
    });

    it('overwrites previous token', () => {
      setAccessToken('first-token');
      setAccessToken('second-token');
      expect(getAccessToken()).toBe('second-token');
    });
  });

  describe('clearAccessToken', () => {
    it('clears the token', () => {
      setAccessToken('test-token');
      clearAccessToken();
      expect(getAccessToken()).toBeNull();
    });

    it('does nothing when no token exists', () => {
      clearAccessToken();
      expect(getAccessToken()).toBeNull();
    });
  });

  describe('hasAccessToken', () => {
    it('returns false when no token is set', () => {
      expect(hasAccessToken()).toBe(false);
    });

    it('returns true when token is set', () => {
      setAccessToken('test-token');
      expect(hasAccessToken()).toBe(true);
    });

    it('returns false after clearing token', () => {
      setAccessToken('test-token');
      clearAccessToken();
      expect(hasAccessToken()).toBe(false);
    });
  });

  describe('parseToken', () => {
    // Create a valid JWT-like token for testing
    const createTestToken = (payload) => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify(payload));
      const signature = 'test-signature';
      return `${header}.${body}.${signature}`;
    };

    it('returns null for null input', () => {
      expect(parseToken(null)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(parseToken(undefined)).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(parseToken('')).toBeNull();
    });

    it('returns null for invalid token format (no dots)', () => {
      expect(parseToken('invalid-token')).toBeNull();
    });

    it('returns null for token with wrong number of parts', () => {
      expect(parseToken('part1.part2')).toBeNull();
      expect(parseToken('part1.part2.part3.part4')).toBeNull();
    });

    it('parses valid token payload', () => {
      const payload = { sub: '123', name: 'Test User', exp: 1234567890 };
      const token = createTestToken(payload);
      expect(parseToken(token)).toEqual(payload);
    });

    it('handles URL-safe base64 characters', () => {
      // Token with URL-safe base64 characters (- and _)
      const payload = { data: 'test+data/with=chars' };
      const token = createTestToken(payload);
      expect(parseToken(token)).toEqual(payload);
    });
  });

  describe('isTokenExpired', () => {
    const createTestToken = (exp) => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify({ exp }));
      const signature = 'test-signature';
      return `${header}.${body}.${signature}`;
    };

    it('returns true when no token exists', () => {
      expect(isTokenExpired()).toBe(true);
    });

    it('returns true when token is expired', () => {
      // Token expired 1 hour ago
      const expiredTime = Math.floor(Date.now() / 1000) - 3600;
      setAccessToken(createTestToken(expiredTime));
      expect(isTokenExpired()).toBe(true);
    });

    it('returns true when token expires within 10 seconds', () => {
      // Token expires in 5 seconds (within 10 second buffer)
      const nearExpiry = Math.floor(Date.now() / 1000) + 5;
      setAccessToken(createTestToken(nearExpiry));
      expect(isTokenExpired()).toBe(true);
    });

    it('returns false when token is valid', () => {
      // Token expires in 1 hour
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      setAccessToken(createTestToken(futureTime));
      expect(isTokenExpired()).toBe(false);
    });

    it('returns true when token has no exp claim', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify({ sub: '123' })); // no exp
      const token = `${header}.${body}.signature`;
      setAccessToken(token);
      expect(isTokenExpired()).toBe(true);
    });
  });

  describe('getTokenExpiresIn', () => {
    const createTestToken = (exp) => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify({ exp }));
      const signature = 'test-signature';
      return `${header}.${body}.${signature}`;
    };

    it('returns 0 when no token exists', () => {
      expect(getTokenExpiresIn()).toBe(0);
    });

    it('returns 0 when token is expired', () => {
      const expiredTime = Math.floor(Date.now() / 1000) - 3600;
      setAccessToken(createTestToken(expiredTime));
      expect(getTokenExpiresIn()).toBe(0);
    });

    it('returns remaining time in milliseconds', () => {
      // Token expires in 1 hour (3600 seconds)
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      setAccessToken(createTestToken(futureTime));

      const expiresIn = getTokenExpiresIn();
      // Allow 100ms tolerance for test execution time
      expect(expiresIn).toBeGreaterThan(3599000);
      expect(expiresIn).toBeLessThanOrEqual(3600000);
    });

    it('returns 0 when token has no exp claim', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify({ sub: '123' }));
      const token = `${header}.${body}.signature`;
      setAccessToken(token);
      expect(getTokenExpiresIn()).toBe(0);
    });
  });

  describe('isTokenExpiringSoon', () => {
    const createTestToken = (exp) => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify({ exp }));
      const signature = 'test-signature';
      return `${header}.${body}.${signature}`;
    };

    it('returns true when no token exists', () => {
      expect(isTokenExpiringSoon(60)).toBe(true);
    });

    it('returns true when token is already expired', () => {
      const expiredTime = Math.floor(Date.now() / 1000) - 3600;
      setAccessToken(createTestToken(expiredTime));
      expect(isTokenExpiringSoon(60)).toBe(true);
    });

    it('returns true when token expires within threshold', () => {
      // Token expires in 30 seconds (within 60 second threshold)
      const nearExpiry = Math.floor(Date.now() / 1000) + 30;
      setAccessToken(createTestToken(nearExpiry));
      expect(isTokenExpiringSoon(60)).toBe(true);
    });

    it('returns false when token expires after threshold', () => {
      // Token expires in 2 minutes (outside 60 second threshold)
      const futureTime = Math.floor(Date.now() / 1000) + 120;
      setAccessToken(createTestToken(futureTime));
      expect(isTokenExpiringSoon(60)).toBe(false);
    });

    it('uses default threshold of 60 seconds', () => {
      // Token expires in 30 seconds - should be expiring soon with default threshold
      const nearExpiry = Math.floor(Date.now() / 1000) + 30;
      setAccessToken(createTestToken(nearExpiry));
      expect(isTokenExpiringSoon()).toBe(true);

      // Token expires in 90 seconds - should NOT be expiring soon with default threshold
      const futureTime = Math.floor(Date.now() / 1000) + 90;
      setAccessToken(createTestToken(futureTime));
      expect(isTokenExpiringSoon()).toBe(false);
    });

    it('respects custom threshold', () => {
      // Token expires in 100 seconds
      const expiryTime = Math.floor(Date.now() / 1000) + 100;
      setAccessToken(createTestToken(expiryTime));

      // With 60 second threshold - NOT expiring soon
      expect(isTokenExpiringSoon(60)).toBe(false);

      // With 120 second threshold - IS expiring soon
      expect(isTokenExpiringSoon(120)).toBe(true);
    });

    it('returns true when token has no exp claim', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify({ sub: '123' }));
      const token = `${header}.${body}.signature`;
      setAccessToken(token);
      expect(isTokenExpiringSoon(60)).toBe(true);
    });
  });
});
