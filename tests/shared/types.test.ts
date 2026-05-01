import type { PexelsPhoto, PexelsVideo, VideoFile, PhotoSearchParams, VideoSearchParams, ContentBlock } from '../../src/shared/types.js';

describe('Shared Types', () => {
  it('should export types from module', async () => {
    await expect(import('../../src/shared/types.js')).resolves.toBeDefined();
  });

  it('should allow creating a valid PexelsPhoto object', () => {
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
        original: 'http://example.com/original.jpg',
        large2x: 'http://example.com/large2x.jpg',
        large: 'http://example.com/large.jpg',
        medium: 'http://example.com/medium.jpg',
        small: 'http://example.com/small.jpg',
        portrait: 'http://example.com/portrait.jpg',
        landscape: 'http://example.com/landscape.jpg',
        tiny: 'http://example.com/tiny.jpg',
      },
      liked: false,
      alt: 'A beautiful sunset',
    };

    expect(photo.id).toBe(1);
    expect(photo.photographer).toBe('John Doe');
    expect(photo.src.medium).toBe('http://example.com/medium.jpg');
  });

  it('should allow creating a valid PexelsVideo object', () => {
    const videoFile: VideoFile = {
      id: 1,
      quality: 'hd',
      file_type: 'video/mp4',
      width: 1920,
      height: 1080,
      link: 'http://example.com/video.mp4',
    };

    const video: PexelsVideo = {
      id: 1,
      width: 1920,
      height: 1080,
      url: 'https://www.pexels.com/video/1',
      image: 'http://example.com/thumb.jpg',
      duration: 30,
      user: { id: 123, name: 'Jane Doe', url: 'https://www.pexels.com/@janedoe' },
      video_files: [videoFile],
      video_pictures: [],
    };

    expect(video.id).toBe(1);
    expect(video.user.name).toBe('Jane Doe');
    expect(video.video_files[0].quality).toBe('hd');
  });

  it('should allow creating valid search params', () => {
    const photoParams: PhotoSearchParams = {
      query: 'cats',
      orientation: 'landscape',
      per_page: 5,
      force_refresh: false,
    };

    const videoParams: VideoSearchParams = {
      query: 'nature',
      size: 'large',
      locale: 'en-US',
    };

    expect(photoParams.query).toBe('cats');
    expect(photoParams.orientation).toBe('landscape');
    expect(videoParams.query).toBe('nature');
    expect(videoParams.locale).toBe('en-US');
  });

  it('should allow creating text and image content blocks', () => {
    const textBlock: ContentBlock = { type: 'text', text: 'Photo by John on Pexels' };
    const imageBlock: ContentBlock = { type: 'image', url: 'http://example.com/photo.jpg' };

    const content: ContentBlock[] = [textBlock, imageBlock];

    expect(content).toHaveLength(2);
    expect(content[0].type).toBe('text');
    expect(content[1].type).toBe('image');
  });
});
