import { describe, it, expect } from 'vitest';
import { ContentBlockSchema, CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import type { PexelsPhoto, PexelsVideo } from '../../src/shared/types.js';
import { formatPhotoResult } from '../../src/tools/photo-search.js';
import { formatVideoResult } from '../../src/tools/video-search.js';

const mockPhoto: PexelsPhoto = {
  id: 1,
  width: 1920,
  height: 1080,
  url: 'https://www.pexels.com/photo/1',
  photographer: 'Test User',
  photographer_url: 'https://www.pexels.com/@testuser',
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
  alt: 'A test photo',
};

const mockVideo: PexelsVideo = {
  id: 2,
  width: 1920,
  height: 1080,
  url: 'https://www.pexels.com/video/2',
  image: 'https://images.pexels.com/thumb.jpg',
  duration: 30,
  user: { id: 10, name: 'Video User', url: 'https://www.pexels.com/@videouser' },
  video_files: [
    {
      id: 1,
      quality: 'hd',
      file_type: 'video/mp4',
      width: 1920,
      height: 1080,
      link: 'https://player.vimeo.com/video.mp4',
    },
  ],
  video_pictures: [],
};

describe('MCP schema compliance', () => {
  describe('formatPhotoResult', () => {
    it('returns content blocks that pass SDK ContentBlockSchema validation', () => {
      const blocks = formatPhotoResult(mockPhoto);
      for (const block of blocks) {
        const result = ContentBlockSchema.safeParse(block);
        expect(result.success, `Block failed: ${JSON.stringify(block)}`).toBe(true);
      }
    });

    it('returns a CallToolResult that passes SDK schema validation', () => {
      const blocks = formatPhotoResult(mockPhoto);
      const result = CallToolResultSchema.safeParse({ content: blocks });
      expect(result.success, JSON.stringify(result)).toBe(true);
    });

    it('does not return any block with a url field (invalid image shape)', () => {
      const blocks = formatPhotoResult(mockPhoto);
      for (const block of blocks) {
        expect(block).not.toHaveProperty('url');
      }
    });
  });

  describe('formatVideoResult', () => {
    it('returns content blocks that pass SDK ContentBlockSchema validation', () => {
      const blocks = formatVideoResult(mockVideo);
      for (const block of blocks) {
        const result = ContentBlockSchema.safeParse(block);
        expect(result.success, `Block failed: ${JSON.stringify(block)}`).toBe(true);
      }
    });

    it('returns a CallToolResult that passes SDK schema validation', () => {
      const blocks = formatVideoResult(mockVideo);
      const result = CallToolResultSchema.safeParse({ content: blocks });
      expect(result.success, JSON.stringify(result)).toBe(true);
    });

    it('does not return any block with a url field (invalid image shape)', () => {
      const blocks = formatVideoResult(mockVideo);
      for (const block of blocks) {
        expect(block).not.toHaveProperty('url');
      }
    });
  });
});
