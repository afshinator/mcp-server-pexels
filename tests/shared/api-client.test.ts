import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Set fake API key before importing the module under test
process.env.PEXELS_API_KEY = 'test-api-key';

const server = setupServer(
  http.get('https://api.pexels.com/v1/search', () => {
    return HttpResponse.json({
      page: 1,
      per_page: 1,
      photos: [{
        id: 1,
        width: 1920,
        height: 1080,
        url: 'https://www.pexels.com/photo/1',
        photographer: 'Test Photographer',
        photographer_url: 'https://www.pexels.com/@test',
        photographer_id: 1,
        avg_color: '#FF0000',
        src: {
          original: 'https://images.pexels.com/original.jpg',
          large2x: 'https://images.pexels.com/large2x.jpg',
          large: 'https://images.pexels.com/large.jpg',
          medium: 'https://images.pexels.com/medium.jpg',
          small: 'https://images.pexels.com/small.jpg',
          portrait: 'https://images.pexels.com/portrait.jpg',
          landscape: 'https://images.pexels.com/landscape.jpg',
          tiny: 'https://images.pexels.com/tiny.jpg'
        },
        liked: false,
        alt: 'Test photo'
      }],
      total_results: 1,
    });
  }),
  http.get('https://api.pexels.com/videos/search', () => {
    return HttpResponse.json({
      page: 1,
      per_page: 1,
      videos: [{
        id: 1,
        width: 1920,
        height: 1080,
        url: 'https://www.pexels.com/video/1',
        image: 'https://images.pexels.com/thumb.jpg',
        duration: 30,
        user: { id: 1, name: 'Test User', url: 'https://www.pexels.com/@test' },
        video_files: [{
          id: 1,
          quality: 'hd',
          file_type: 'video/mp4',
          width: 1920,
          height: 1080,
          link: 'https://player.vimeo.com/video.mp4'
        }],
        video_pictures: []
      }],
      total_results: 1,
    });
  }),
  http.get('https://api.pexels.com/v1/photos/1', () => {
    return HttpResponse.json({
      id: 1,
      width: 1920,
      height: 1080,
      url: 'https://www.pexels.com/photo/1',
      photographer: 'Test Photographer',
      photographer_url: 'https://www.pexels.com/@test',
      photographer_id: 1,
      avg_color: '#FF0000',
      src: {
        original: 'https://images.pexels.com/original.jpg',
        large2x: 'https://images.pexels.com/large2x.jpg',
        large: 'https://images.pexels.com/large.jpg',
        medium: 'https://images.pexels.com/medium.jpg',
        small: 'https://images.pexels.com/small.jpg',
        portrait: 'https://images.pexels.com/portrait.jpg',
        landscape: 'https://images.pexels.com/landscape.jpg',
        tiny: 'https://images.pexels.com/tiny.jpg'
      },
      liked: false,
      alt: 'Test photo'
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());

describe('API Client', () => {
  it('should fetch photo search results', async () => {
    const { fetchPhotoSearch } = await import('../../src/shared/api-client.js');
    const result = await fetchPhotoSearch({ query: 'cats' });
    expect(result.photos).toHaveLength(1);
    expect(result.photos?.[0].id).toBe(1);
    expect(result.photos?.[0].photographer).toBe('Test Photographer');
    expect(result.total_results).toBe(1);
  });

  it('should fetch video search results', async () => {
    const { fetchVideoSearch } = await import('../../src/shared/api-client.js');
    const result = await fetchVideoSearch({ query: 'nature' });
    expect(result.videos).toHaveLength(1);
    expect(result.videos?.[0].id).toBe(1);
    expect(result.videos?.[0].user.name).toBe('Test User');
  });

  it('should fetch photo details by id', async () => {
    const { fetchPhotoDetails } = await import('../../src/shared/api-client.js');
    const result = await fetchPhotoDetails(1);
    expect(result.id).toBe(1);
    expect(result.photographer).toBe('Test Photographer');
  });
});