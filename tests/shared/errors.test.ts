import { describe, it, expect } from 'vitest';
import { parseRateLimit, formatPexelsError, formatApiError, PexelsApiError, MissingKeyError } from '../../src/shared/errors.js';

describe('Error Handling', () => {
  describe('parseRateLimit', () => {
    it('should parse rate limit reset time from headers', () => {
      const headers = new Headers({
        'x-ratelimit-reset': '3600',
      });
      const resetTime = parseRateLimit(headers);
      expect(resetTime).toBeTruthy();
      expect(typeof resetTime).toBe('string');
    });

    it('should return null when reset header is missing', () => {
      const headers = new Headers();
      const result = parseRateLimit(headers);
      expect(result).toBeNull();
    });

    it('should return null when reset header is not a number', () => {
      const headers = new Headers({
        'x-ratelimit-reset': 'not-a-number',
      });
      const result = parseRateLimit(headers);
      expect(result).toBeNull();
    });
  });

  describe('formatPexelsError', () => {
    it('should format rate limit error with isError flag', () => {
      const result = formatPexelsError('rate_limit', '2:30 PM');
      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
    });

    it('should include reset time in rate limit message', () => {
      const result = formatPexelsError('rate_limit', '2:30 PM');
      const text = result.content[0] as { type: 'text'; text: string };
      expect(text.text).toContain('rate limit');
      expect(text.text).toContain('2:30 PM');
    });

    it('should format invalid query error', () => {
      const result = formatPexelsError('invalid_query');
      const text = result.content[0] as { type: 'text'; text: string };
      expect(text.text).toContain('Invalid query');
      expect(result.isError).toBe(true);
    });

    it('should format not found error', () => {
      const result = formatPexelsError('not_found');
      const text = result.content[0] as { type: 'text'; text: string };
      expect(text.text).toContain('not found');
      expect(result.isError).toBe(true);
    });

    it('should use fallback text when reset time is not provided', () => {
      const result = formatPexelsError('rate_limit');
      const text = result.content[0] as { type: 'text'; text: string };
      expect(text.text).toContain('[unknown time]');
    });
  });

  describe('formatApiError', () => {
    it('formats 401 with a hint to check PEXELS_API_KEY', () => {
      const err = new PexelsApiError(401, 'Unauthorized', new Headers());
      const result = formatApiError(err);
      const text = result.content[0] as { type: 'text'; text: string };
      expect(result.isError).toBe(true);
      expect(text.text.toLowerCase()).toContain('pexels_api_key');
    });

    it('formats 429 with rate-limit reset time from headers', () => {
      const headers = new Headers({ 'x-ratelimit-reset': '3600' });
      const err = new PexelsApiError(429, 'Too Many Requests', headers);
      const result = formatApiError(err);
      const text = result.content[0] as { type: 'text'; text: string };
      expect(result.isError).toBe(true);
      expect(text.text.toLowerCase()).toContain('rate limit');
      expect(text.text).toMatch(/\d/); // contains a time value
    });

    it('formats 429 without reset header gracefully', () => {
      const err = new PexelsApiError(429, 'Too Many Requests', new Headers());
      const result = formatApiError(err);
      const text = result.content[0] as { type: 'text'; text: string };
      expect(result.isError).toBe(true);
      expect(text.text.toLowerCase()).toContain('rate limit');
    });

    it('formats 5xx as temporarily unavailable', () => {
      for (const status of [500, 502, 503]) {
        const err = new PexelsApiError(status, 'Server Error', new Headers());
        const result = formatApiError(err);
        const text = result.content[0] as { type: 'text'; text: string };
        expect(result.isError).toBe(true);
        expect(text.text.toLowerCase()).toMatch(/unavailable|error/);
        expect(text.text).toContain(String(status));
      }
    });

    it('formats 404 as not found', () => {
      const err = new PexelsApiError(404, 'Not Found', new Headers());
      const result = formatApiError(err);
      const text = result.content[0] as { type: 'text'; text: string };
      expect(result.isError).toBe(true);
      expect(text.text.toLowerCase()).toContain('not found');
    });

    it('formats unknown errors generically', () => {
      const result = formatApiError(new Error('something unexpected'));
      const text = result.content[0] as { type: 'text'; text: string };
      expect(result.isError).toBe(true);
      expect(text.text.length).toBeGreaterThan(0);
    });

    it('formats MissingKeyError with a hint to set PEXELS_API_KEY', () => {
      const result = formatApiError(new MissingKeyError());
      const text = result.content[0] as { type: 'text'; text: string };
      expect(result.isError).toBe(true);
      expect(text.text.toLowerCase()).toContain('pexels_api_key');
      expect(text.text.toLowerCase()).toContain('set');
    });
  });
});
