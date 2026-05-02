import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { flushCache } from '../../src/shared/cache.js';
import { formatVideoResult, handleVideoSearch } from '../../src/tools/video-search.js';
import type { PexelsVideo } from '../../src/shared/types.js';

process.env.PEXELS_API_KEY = 'test-api-key';

const mockVideo: PexelsVideo = {
  id: 42,
  width: 1920,
  height: 1080,
  url: 'https://www.pexels.com/video/42',
  image: 'https://images.pexels.com/thumb.jpg',
  duration: 15,
  user: { id: 10, name: 'Test Videographer', url: 'https://www.pexels.com/@testvid99' },
  video_files: [
    { id: 1, quality: 'hd', file_type: 'video/mp4', width: 1920, height: 1080, link: 'https://player.vimeo.com/video.mp4' },
  ],
  video_pictures: [],
};

const server = setupServer(
  http.get('https://api.pexels.com/videos/search', () =>
    HttpResponse.json({ page: 1, per_page: 1, videos: [mockVideo], total_results: 1 }),
  ),
);

beforeAll(() => server.listen());
beforeEach(() => flushCache());
afterEach(() => server.resetHandlers());

describe('Video Search Tool', () => {
  describe('formatVideoResult', () => {
    it('returns a text block and a resource_link block', () => {
      const blocks = formatVideoResult(mockVideo);
      expect(blocks).toHaveLength(2);
      expect(blocks[0].type).toBe('text');
      expect(blocks[1].type).toBe('resource_link');
    });

    it('uses user.url from API for attribution link', () => {
      const blocks = formatVideoResult(mockVideo);
      const text = blocks[0] as { type: 'text'; text: string };
      expect(text.text).toContain('https://www.pexels.com/@testvid99');
      expect(text.text).not.toContain('@testvideographer');
    });

    it('uses video/mp4 mimeType for mp4 resource_link', () => {
      const link = formatVideoResult(mockVideo)[1] as { type: 'resource_link'; uri: string; mimeType: string };
      expect(link.uri).toBe('https://player.vimeo.com/video.mp4');
      expect(link.mimeType).toBe('video/mp4');
    });

    it('falls back to image/jpeg thumbnail when no mp4 available', () => {
      const videoNoMp4: PexelsVideo = {
        ...mockVideo,
        video_files: [{ id: 9, quality: 'sd', file_type: 'video/quicktime', width: 1280, height: 720, link: 'https://example.com/video.mov' }],
      };
      const link = formatVideoResult(videoNoMp4)[1] as { type: 'resource_link'; uri: string; mimeType: string };
      expect(link.uri).toBe(mockVideo.image);
      expect(link.mimeType).toBe('image/jpeg');
    });

    it('includes video metadata in text block', () => {
      const text = formatVideoResult(mockVideo)[0] as { type: 'text'; text: string };
      expect(text.text).toContain('**ID:** 42');
      expect(text.text).toContain('**Duration:** 15s');
      expect(text.text).toContain('**Dimensions:** 1920x1080');
    });
  });

  describe('handleVideoSearch', () => {
    it('fetches and returns results on cache miss', async () => {
      const result = await handleVideoSearch({ query: 'ocean' });
      expect(result.isError).toBeUndefined();
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.content[0].type).toBe('text');
    });

    it('returns cached results without hitting API on second call', async () => {
      let apiCallCount = 0;
      server.use(
        http.get('https://api.pexels.com/videos/search', () => {
          apiCallCount++;
          return HttpResponse.json({ page: 1, per_page: 1, videos: [mockVideo], total_results: 1 });
        }),
      );

      await handleVideoSearch({ query: 'cached-video-query' });
      await handleVideoSearch({ query: 'cached-video-query' });
      expect(apiCallCount).toBe(1);
    });

    it('force_refresh bypasses and repopulates cache', async () => {
      let apiCallCount = 0;
      server.use(
        http.get('https://api.pexels.com/videos/search', () => {
          apiCallCount++;
          return HttpResponse.json({ page: 1, per_page: 1, videos: [mockVideo], total_results: 1 });
        }),
      );

      await handleVideoSearch({ query: 'refresh-video' });
      await handleVideoSearch({ query: 'refresh-video', force_refresh: true });
      await handleVideoSearch({ query: 'refresh-video' }); // should hit cache written by force_refresh
      expect(apiCallCount).toBe(2);
    });

    it('returns 401 error with API key hint', async () => {
      server.use(
        http.get('https://api.pexels.com/videos/search', () =>
          new HttpResponse(null, { status: 401, statusText: 'Unauthorized' }),
        ),
      );
      const result = await handleVideoSearch({ query: 'unauthorized' });
      expect(result.isError).toBe(true);
      const text = result.content[0] as { type: 'text'; text: string };
      expect(text.text.toLowerCase()).toContain('pexels_api_key');
    });

    it('returns 429 rate-limit error', async () => {
      server.use(
        http.get('https://api.pexels.com/videos/search', () =>
          new HttpResponse(null, { status: 429, statusText: 'Too Many Requests', headers: { 'x-ratelimit-reset': '1800' } }),
        ),
      );
      const result = await handleVideoSearch({ query: 'ratelimited' });
      expect(result.isError).toBe(true);
      const text = result.content[0] as { type: 'text'; text: string };
      expect(text.text.toLowerCase()).toContain('rate limit');
    });
  });
});
