import { describe, it, expect, vi, afterEach } from 'vitest';
import { logDebug, isDebugEnabled } from '../../src/shared/logger.js';

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.DEBUG;
  delete process.env.LOG_LEVEL;
});

describe('Logger', () => {
  describe('isDebugEnabled', () => {
    it('returns true when DEBUG=1', () => {
      process.env.DEBUG = '1';
      expect(isDebugEnabled()).toBe(true);
    });

    it('returns true when LOG_LEVEL=debug', () => {
      process.env.LOG_LEVEL = 'debug';
      expect(isDebugEnabled()).toBe(true);
    });

    it('returns false when neither DEBUG nor LOG_LEVEL is set', () => {
      expect(isDebugEnabled()).toBe(false);
    });

    it('returns false when DEBUG=0', () => {
      process.env.DEBUG = '0';
      expect(isDebugEnabled()).toBe(false);
    });
  });

  describe('logDebug', () => {
    it('logs to console.error when debug is enabled', () => {
      process.env.DEBUG = '1';
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logDebug('tool:', 'pexels_search_photos');
      expect(spy).toHaveBeenCalledWith('[pexels]', 'tool:', 'pexels_search_photos');
    });

    it('does not log when debug is not enabled', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logDebug('tool:', 'pexels_search_photos');
      expect(spy).not.toHaveBeenCalled();
    });

    it('accepts multiple arguments', () => {
      process.env.DEBUG = '1';
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logDebug('cache:', 'HIT', 'key:', 'abc|5');
      expect(spy).toHaveBeenCalledWith('[pexels]', 'cache:', 'HIT', 'key:', 'abc|5');
    });
  });
});
