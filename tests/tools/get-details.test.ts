import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { flushCache } from '../../src/shared/cache.js';
import { handleGetDetails } from '../../src/tools/get-details.js';

process.env.PEXELS_API_KEY = 'test-api-key';

const mockPhoto = {
  id: 100,
  width: 3000,
  height: 2000,
  url: 'https://www.pexels.com/photo/100',
  photographer: 'Jane Smith',
  photographer_url: 'https://www.pexels.com/@janesmith99',
  photographer_id: 99,
  avg_color: '#AABBCC',
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
  alt: 'A test landscape',
};

const mockVideo = {
  id: 200,
  width: 1920,
  height: 1080,
  url: 'https://www.pexels.com/video/200',
  image: 'https://images.pexels.com/vthumb.jpg',
  duration: 30,
  user: { id: 55, name: 'Video Creator', url: 'https://www.pexels.com/@videocreator' },
  video_files: [
    { id: 1, quality: 'hd', file_type: 'video/mp4', width: 1920, height: 1080, link: 'https://player.vimeo.com/detail.mp4' },
  ],
  video_pictures: [],
};

const server = setupServer(
  http.get('https://api.pexels.com/v1/photos/100', () => HttpResponse.json(mockPhoto)),
  http.get('https://api.pexels.com/videos/videos/200', () => HttpResponse.json(mockVideo)),
);

beforeAll(() => server.listen());
beforeEach(() => flushCache());
afterEach(() => server.resetHandlers());

describe('Get Details Tool', () => {
  describe('photo details', () => {
    it('returns text, resource_link, and structured JSON blocks for a photo', async () => {
      const result = await handleGetDetails({ id: 100, type: 'photo' });
      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(3);
      expect(result.content[0].type).toBe('text');
      expect(result.content[1].type).toBe('resource_link');
      expect(result.content[2].type).toBe('text');

      const jsonBlock = result.content[2] as { type: 'text'; text: string };
      const parsed = JSON.parse(jsonBlock.text);
      expect(parsed.kind).toBe('photo');
      expect(parsed.id).toBe(100);
      expect(parsed.creatorName).toBe('Jane Smith');
      expect(parsed.dimensions).toEqual({ width: 3000, height: 2000 });
    });

    it('uses photographer_url from API for attribution', async () => {
      const result = await handleGetDetails({ id: 100, type: 'photo' });
      const text = result.content[0] as { type: 'text'; text: string };
      expect(text.text).toContain('https://www.pexels.com/@janesmith99');
    });

    it('returns cached result on second call', async () => {
      let callCount = 0;
      server.use(
        http.get('https://api.pexels.com/v1/photos/100', () => {
          callCount++;
          return HttpResponse.json(mockPhoto);
        }),
      );
      await handleGetDetails({ id: 100, type: 'photo' });
      await handleGetDetails({ id: 100, type: 'photo' });
      expect(callCount).toBe(1);
    });

    it('force_refresh repopulates cache', async () => {
      let callCount = 0;
      server.use(
        http.get('https://api.pexels.com/v1/photos/100', () => {
          callCount++;
          return HttpResponse.json(mockPhoto);
        }),
      );
      await handleGetDetails({ id: 100, type: 'photo' });
      await handleGetDetails({ id: 100, type: 'photo', force_refresh: true });
      await handleGetDetails({ id: 100, type: 'photo' }); // cache hit from force_refresh write
      expect(callCount).toBe(2);
    });
  });

  describe('video details', () => {
    it('returns text, resource_link, and structured JSON blocks for a video', async () => {
      const result = await handleGetDetails({ id: 200, type: 'video' });
      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(3);
      const link = result.content[1] as { type: 'resource_link'; mimeType: string };
      expect(link.mimeType).toBe('video/mp4');

      const jsonBlock = result.content[2] as { type: 'text'; text: string };
      const parsed = JSON.parse(jsonBlock.text);
      expect(parsed.kind).toBe('video');
      expect(parsed.id).toBe(200);
      expect(parsed.durationSeconds).toBe(30);
    });

    it('uses user.url from API for attribution', async () => {
      const result = await handleGetDetails({ id: 200, type: 'video' });
      const text = result.content[0] as { type: 'text'; text: string };
      expect(text.text).toContain('https://www.pexels.com/@videocreator');
    });
  });

  describe('error handling', () => {
    it('returns 404 error for unknown photo id', async () => {
      server.use(
        http.get('https://api.pexels.com/v1/photos/100', () =>
          new HttpResponse(null, { status: 404, statusText: 'Not Found' }),
        ),
      );
      const result = await handleGetDetails({ id: 100, type: 'photo' });
      expect(result.isError).toBe(true);
      const text = result.content[0] as { type: 'text'; text: string };
      expect(text.text.toLowerCase()).toContain('not found');
    });

    it('returns 401 error with API key hint', async () => {
      server.use(
        http.get('https://api.pexels.com/v1/photos/100', () =>
          new HttpResponse(null, { status: 401, statusText: 'Unauthorized' }),
        ),
      );
      const result = await handleGetDetails({ id: 100, type: 'photo' });
      expect(result.isError).toBe(true);
      const text = result.content[0] as { type: 'text'; text: string };
      expect(text.text.toLowerCase()).toContain('pexels_api_key');
    });
  });
});
