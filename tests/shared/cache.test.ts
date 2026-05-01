import { describe, it, expect, beforeEach } from 'vitest';
import { getFromCache, setCache, makeCacheKey } from '../../src/shared/cache.js';

describe('Cache Module', () => {
  beforeEach(() => {
    setCache('__flush__', true, -1);
  });

  it('should generate consistent keys from same params regardless of order', () => {
    const key1 = makeCacheKey({ query: 'cats', per_page: 5 });
    const key2 = makeCacheKey({ per_page: 5, query: 'cats' });
    expect(key1).toBe(key2);
  });

  it('should generate different keys for different params', () => {
    const key1 = makeCacheKey({ query: 'cats' });
    const key2 = makeCacheKey({ query: 'dogs' });
    expect(key1).not.toBe(key2);
  });

  it('should return undefined for missing key', () => {
    const result = getFromCache('nonexistent');
    expect(result).toBeUndefined();
  });

  it('should store and retrieve values', () => {
    setCache('test-key', { data: 'test-value', num: 42 });
    const result = getFromCache<{ data: string; num: number }>('test-key');
    expect(result).toEqual({ data: 'test-value', num: 42 });
  });

  it('should store and retrieve primitive values', () => {
    setCache('str-key', 'hello');
    expect(getFromCache<string>('str-key')).toBe('hello');
    setCache('num-key', 99);
    expect(getFromCache<number>('num-key')).toBe(99);
  });
});
