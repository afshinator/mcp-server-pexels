import { describe, it, expect } from 'vitest';
import { photoSearchSchema, videoSearchSchema, getDetailsSchema } from '../../src/utils/validation.js';

describe('Validation', () => {
  describe('photoSearchSchema', () => {
    it('should accept valid photo search params', () => {
      const result = photoSearchSchema.safeParse({
        query: 'cats',
        orientation: 'landscape',
        per_page: 5,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid orientation', () => {
      const result = photoSearchSchema.safeParse({
        query: 'cats',
        orientation: 'panoramic',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid size', () => {
      const result = photoSearchSchema.safeParse({
        query: 'cats',
        size: 'massive',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid hex color', () => {
      const result = photoSearchSchema.safeParse({
        query: 'cats',
        color: 'not-a-color',
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid hex color with hash', () => {
      const result = photoSearchSchema.safeParse({
        query: 'cats',
        color: '#FF0000',
      });
      expect(result.success).toBe(true);
    });

    it('should truncate query to 100 chars', () => {
      const longQuery = 'a'.repeat(200);
      const result = photoSearchSchema.safeParse({ query: longQuery });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query.length).toBeLessThanOrEqual(100);
      }
    });

    it('should allow force_refresh boolean', () => {
      const result = photoSearchSchema.safeParse({
        query: 'cats',
        force_refresh: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.force_refresh).toBe(true);
      }
    });
  });

  describe('videoSearchSchema', () => {
    it('should accept valid video search params', () => {
      const result = videoSearchSchema.safeParse({
        query: 'nature',
        size: 'large',
        locale: 'en-US',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid orientation', () => {
      const result = videoSearchSchema.safeParse({
        query: 'nature',
        orientation: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('getDetailsSchema', () => {
    it('should accept valid photo detail params', () => {
      const result = getDetailsSchema.safeParse({
        id: 123,
        type: 'photo',
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid video detail params', () => {
      const result = getDetailsSchema.safeParse({
        id: 456,
        type: 'video',
      });
      expect(result.success).toBe(true);
    });

    it('should reject negative id', () => {
      const result = getDetailsSchema.safeParse({
        id: -1,
        type: 'photo',
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer id', () => {
      const result = getDetailsSchema.safeParse({
        id: 12.5,
        type: 'photo',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid type', () => {
      const result = getDetailsSchema.safeParse({
        id: 123,
        type: 'audio',
      });
      expect(result.success).toBe(false);
    });

    it('should allow force_refresh', () => {
      const result = getDetailsSchema.safeParse({
        id: 123,
        type: 'photo',
        force_refresh: true,
      });
      expect(result.success).toBe(true);
    });
  });
});
