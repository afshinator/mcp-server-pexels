import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { flushCache } from '../../src/shared/cache.js';
import { formatPhotoResult, handlePhotoSearch } from '../../src/tools/photo-search.js';
import type { PexelsPhoto } from '../../src/shared/types.js';

process.env.PEXELS_API_KEY = 'test-api-key';

const mockPhoto: PexelsPhoto = {
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

const server = setupServer(
  http.get('https://api.pexels.com/v1/search', () =>
    HttpResponse.json({ page: 1, per_page: 1, photos: [mockPhoto], total_results: 1 }),
  ),
);

beforeAll(() => server.listen());
beforeEach(() => flushCache());
afterEach(() => server.resetHandlers());

describe('Photo Search Tool', () => {
  describe('formatPhotoResult', () => {
    it('should format photo result with text and resource_link blocks', () => {
      const result = formatPhotoResult(mockPhoto);

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('text');
      expect(result[1].type).toBe('resource_link');

      const textBlock = result[0] as { type: 'text'; text: string };
      expect(textBlock.text).toContain('Photo by [John Doe]');
      expect(textBlock.text).toContain('on Pexels');
      expect(textBlock.text).toContain('**ID:** 1');
      expect(textBlock.text).toContain('**Dimensions:** 1920x1080');
      expect(textBlock.text).toContain('#FF0000');

      const linkBlock = result[1] as { type: 'resource_link'; uri: string; mimeType: string };
      expect(linkBlock.uri).toBe('https://images.pexels.com/medium.jpg');
      expect(linkBlock.mimeType).toBe('image/jpeg');
    });

    it('should use photographer_url from API for attribution link', () => {
      const result = formatPhotoResult(mockPhoto);
      const textBlock = result[0] as { type: 'text'; text: string };
      expect(textBlock.text).toContain('https://www.pexels.com/@johndoe');
    });

    it('should include markdown image link in text block', () => {
      const photo: PexelsPhoto = { ...mockPhoto, id: 2, src: { ...mockPhoto.src, medium: 'https://images.pexels.com/medium2.jpg' } };
      const result = formatPhotoResult(photo);
      const textBlock = result[0] as { type: 'text'; text: string };
      const linkBlock = result[1] as { type: 'resource_link'; uri: string };

      expect(textBlock.text).toContain('![Preview](');
      expect(textBlock.text).toContain('medium2.jpg');
      expect(linkBlock.uri).toContain('medium2.jpg');
    });

    it('should handle photo with no alt text', () => {
      const result = formatPhotoResult({ ...mockPhoto, alt: '' });
      const textBlock = result[0] as { type: 'text'; text: string };
      expect(textBlock.text).toContain('No description');
    });
  });

  describe('structured output', () => {
    it('includes a structured JSON block at the end of content', async () => {
      const result = await handlePhotoSearch({ query: 'sunsets' });
      const lastBlock = result.content[result.content.length - 1] as { type: 'text'; text: string };
      expect(lastBlock.type).toBe('text');
      const parsed = JSON.parse(lastBlock.text);
      expect(parsed).toHaveProperty('results');
      expect(Array.isArray(parsed.results)).toBe(true);
      expect(parsed.results.length).toBeGreaterThan(0);
      expect(parsed.results[0].kind).toBe('photo');
    });
  });

  describe('handlePhotoSearch', () => {
    it('fetches and returns results on cache miss', async () => {
      const result = await handlePhotoSearch({ query: 'sunsets' });
      expect(result.isError).toBeUndefined();
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.content[0].type).toBe('text');
    });

    it('returns cached results without hitting API on second call', async () => {
      let apiCallCount = 0;
      server.use(
        http.get('https://api.pexels.com/v1/search', () => {
          apiCallCount++;
          return HttpResponse.json({ page: 1, per_page: 1, photos: [mockPhoto], total_results: 1 });
        }),
      );

      await handlePhotoSearch({ query: 'cached-query' });
      await handlePhotoSearch({ query: 'cached-query' });
      expect(apiCallCount).toBe(1);
    });

    it('force_refresh bypasses and repopulates cache', async () => {
      let apiCallCount = 0;
      server.use(
        http.get('https://api.pexels.com/v1/search', () => {
          apiCallCount++;
          return HttpResponse.json({ page: 1, per_page: 1, photos: [mockPhoto], total_results: 1 });
        }),
      );

      await handlePhotoSearch({ query: 'refresh-query' });
      await handlePhotoSearch({ query: 'refresh-query', force_refresh: true });
      await handlePhotoSearch({ query: 'refresh-query' }); // cache hit from force_refresh write
      expect(apiCallCount).toBe(2);
    });

    it('returns 401 error with API key hint', async () => {
      server.use(
        http.get('https://api.pexels.com/v1/search', () =>
          new HttpResponse(null, { status: 401, statusText: 'Unauthorized' }),
        ),
      );
      const result = await handlePhotoSearch({ query: 'unauthorized' });
      expect(result.isError).toBe(true);
      const text = result.content[0] as { type: 'text'; text: string };
      expect(text.text.toLowerCase()).toContain('pexels_api_key');
    });

    it('returns 429 rate-limit error with retry guidance', async () => {
      server.use(
        http.get('https://api.pexels.com/v1/search', () =>
          new HttpResponse(null, {
            status: 429,
            statusText: 'Too Many Requests',
            headers: { 'x-ratelimit-reset': '900' },
          }),
        ),
      );
      const result = await handlePhotoSearch({ query: 'ratelimited' });
      expect(result.isError).toBe(true);
      const text = result.content[0] as { type: 'text'; text: string };
      expect(text.text.toLowerCase()).toContain('rate limit');
    });

    it('returns 500 error as temporarily unavailable', async () => {
      server.use(
        http.get('https://api.pexels.com/v1/search', () =>
          new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' }),
        ),
      );
      const result = await handlePhotoSearch({ query: 'server-error' });
      expect(result.isError).toBe(true);
      const text = result.content[0] as { type: 'text'; text: string };
      expect(text.text).toContain('500');
    });
  });
});
