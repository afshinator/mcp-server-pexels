import { describe, it, expect } from 'vitest';
import { formatPhotoResult } from '../../src/tools/photo-search.js';
import type { PexelsPhoto, ContentBlock } from '../../src/shared/types.js';

describe('Photo Search Tool', () => {
  describe('formatPhotoResult', () => {
    it('should format photo result with text and image content blocks', () => {
      const photo: PexelsPhoto = {
        id: 1,
        width: 1920,
        height: 1080,
        url: 'https://www.pexels.com/photo/1',
        photographer: 'John Doe',
        photographer_url: 'https://www.pexels.com/@johndoe',
        photographer_id: 123,
        avg_color: '#FF0000',
        src: {
          original: 'https://images.pexels.com/original.jpg',
          large2x: 'https://images.pexels.com/large2x.jpg',
          large: 'https://images.pexels.com/large.jpg',
          medium: 'https://images.pexels.com/medium.jpg',
          small: 'https://images.pexels.com/small.jpg',
          portrait: 'https://images.pexels.com/portrait.jpg',
          landscape: 'https://images.pexels.com/landscape.jpg',
          tiny: 'https://images.pexels.com/tiny.jpg',
        },
        liked: false,
        alt: 'A beautiful sunset',
      };

      const result = formatPhotoResult(photo);

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('text');
      expect(result[1].type).toBe('image');

      const textBlock = result[0] as { type: 'text'; text: string };
      expect(textBlock.text).toContain('Photo by [John Doe]');
      expect(textBlock.text).toContain('on Pexels');
      expect(textBlock.text).toContain('**ID:** 1');
      expect(textBlock.text).toContain('**Dimensions:** 1920x1080');
      expect(textBlock.text).toContain('#FF0000');

      const imageBlock = result[1] as { type: 'image'; url: string };
      expect(imageBlock.url).toBe('https://images.pexels.com/medium.jpg');
    });

    it('should include markdown image link in text block', () => {
      const photo: PexelsPhoto = {
        id: 2,
        width: 3000,
        height: 2000,
        url: 'https://www.pexels.com/photo/2',
        photographer: 'Jane Smith',
        photographer_url: 'https://www.pexels.com/@janesmith',
        photographer_id: 456,
        avg_color: '#00FF00',
        src: {
          original: 'https://images.pexels.com/original2.jpg',
          large2x: 'https://images.pexels.com/large2x2.jpg',
          large: 'https://images.pexels.com/large2.jpg',
          medium: 'https://images.pexels.com/medium2.jpg',
          small: 'https://images.pexels.com/small2.jpg',
          portrait: 'https://images.pexels.com/portrait2.jpg',
          landscape: 'https://images.pexels.com/landscape2.jpg',
          tiny: 'https://images.pexels.com/tiny2.jpg',
        },
        liked: true,
        alt: 'Mountain view',
      };

      const result = formatPhotoResult(photo);
      const textBlock = result[0] as { type: 'text'; text: string };

      expect(textBlock.text).toContain('![Preview](');
      expect(textBlock.text).toContain('medium2.jpg');
    });

    it('should handle photo with no alt text', () => {
      const photo: PexelsPhoto = {
        id: 3,
        width: 4000,
        height: 3000,
        url: 'https://www.pexels.com/photo/3',
        photographer: 'Test User',
        photographer_url: 'https://www.pexels.com/@testuser',
        photographer_id: 789,
        avg_color: '#000000',
        src: {
          original: 'https://images.pexels.com/original3.jpg',
          large2x: 'https://images.pexels.com/large2x3.jpg',
          large: 'https://images.pexels.com/large3.jpg',
          medium: 'https://images.pexels.com/medium3.jpg',
          small: 'https://images.pexels.com/small3.jpg',
          portrait: 'https://images.pexels.com/portrait3.jpg',
          landscape: 'https://images.pexels.com/landscape3.jpg',
          tiny: 'https://images.pexels.com/tiny3.jpg',
        },
        liked: false,
        alt: '',
      };

      const result = formatPhotoResult(photo);
      const textBlock = result[0] as { type: 'text'; text: string };

      expect(textBlock.text).toContain('No description');
    });
  });
});