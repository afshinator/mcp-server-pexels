import { describe, it, expect } from 'vitest';
import { chooseBestVideo } from '../../src/shared/video-selector.js';
import type { VideoFile } from '../../src/shared/types.js';

describe('Video Selector', () => {
  it('should prefer mp4 files over other formats', () => {
    const files: VideoFile[] = [
      { id: 1, quality: 'sd', file_type: 'video/webm', width: 1280, height: 720, link: 'https://example.com/video.webm' },
      { id: 2, quality: 'hd', file_type: 'video/mp4', width: 1920, height: 1080, link: 'https://example.com/video.mp4' },
    ];
    const result = chooseBestVideo(files);
    expect(result.file_type).toBe('video/mp4');
  });

  it('should prefer hd quality over sd among mp4 files', () => {
    const files: VideoFile[] = [
      { id: 1, quality: 'sd', file_type: 'video/mp4', width: 640, height: 360, link: 'https://example.com/sd.mp4' },
      { id: 2, quality: 'hd', file_type: 'video/mp4', width: 1920, height: 1080, link: 'https://example.com/hd.mp4' },
    ];
    const result = chooseBestVideo(files);
    expect(result.quality).toBe('hd');
  });

  it('should pick the file closest to 1920 width among hd mp4 files', () => {
    const files: VideoFile[] = [
      { id: 1, quality: 'hd', file_type: 'video/mp4', width: 1280, height: 720, link: 'https://example.com/1280.mp4' },
      { id: 2, quality: 'hd', file_type: 'video/mp4', width: 1920, height: 1080, link: 'https://example.com/1920.mp4' },
      { id: 3, quality: 'hd', file_type: 'video/mp4', width: 3840, height: 2160, link: 'https://example.com/4k.mp4' },
    ];
    const result = chooseBestVideo(files);
    expect(result.width).toBe(1920);
    expect(result.id).toBe(2);
  });

  it('should return the first file as fallback when no mp4 exists', () => {
    const files: VideoFile[] = [
      { id: 1, quality: 'sd', file_type: 'video/webm', width: 640, height: 360, link: 'https://example.com/a.webm' },
      { id: 2, quality: 'hd', file_type: 'video/avi', width: 1920, height: 1080, link: 'https://example.com/b.avi' },
    ];
    const result = chooseBestVideo(files);
    expect(result.id).toBe(1);
  });

  it('should handle a single file', () => {
    const files: VideoFile[] = [
      { id: 1, quality: 'hd', file_type: 'video/mp4', width: 1920, height: 1080, link: 'https://example.com/video.mp4' },
    ];
    const result = chooseBestVideo(files);
    expect(result.id).toBe(1);
    expect(result.width).toBe(1920);
  });

  it('should handle empty file array gracefully', () => {
    const files: VideoFile[] = [];
    const result = chooseBestVideo(files);
    expect(result).toBeUndefined();
  });
});
