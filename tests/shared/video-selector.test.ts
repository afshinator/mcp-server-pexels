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

  describe('extreme edge cases', () => {
    it('when all files are far from 1920 (e.g., < 480px), picks the closest one', () => {
      const files: VideoFile[] = [
        { id: 1, quality: 'hd', file_type: 'video/mp4', width: 320, height: 240, link: 'https://example.com/320.mp4' },
        { id: 2, quality: 'hd', file_type: 'video/mp4', width: 480, height: 360, link: 'https://example.com/480.mp4' },
        { id: 3, quality: 'hd', file_type: 'video/mp4', width: 426, height: 240, link: 'https://example.com/426.mp4' },
      ];
      // Closest to 1920 is 480 (distance 1440).
      const result = chooseBestVideo(files);
      expect(result.id).toBe(2);
      expect(result.width).toBe(480);
    });

    it('handles a file with width=0 gracefully (distance is 1920)', () => {
      const files: VideoFile[] = [
        { id: 1, quality: 'hd', file_type: 'video/mp4', width: 0, height: 0, link: 'https://example.com/zero.mp4' },
        { id: 2, quality: 'hd', file_type: 'video/mp4', width: 640, height: 480, link: 'https://example.com/640.mp4' },
      ];
      // width=0 is distance 1920; width=640 is distance 1280. Should pick 640.
      const result = chooseBestVideo(files);
      expect(result.id).toBe(2);
      expect(result.width).toBe(640);
    });

    it('no mp4 with 3+ non-mp4 files — returns the first file', () => {
      const files: VideoFile[] = [
        { id: 1, quality: 'sd', file_type: 'video/webm', width: 640, height: 360, link: 'https://example.com/a.webm' },
        { id: 2, quality: 'hd', file_type: 'video/avi', width: 1920, height: 1080, link: 'https://example.com/b.avi' },
        { id: 3, quality: 'sd', file_type: 'video/quicktime', width: 1280, height: 720, link: 'https://example.com/c.mov' },
      ];
      const result = chooseBestVideo(files);
      expect(result.id).toBe(1);
      expect(result.file_type).toBe('video/webm');
    });
  });

  describe('tie-breaking', () => {
    it('on equal distance to 1920, should prefer larger width', () => {
      const files: VideoFile[] = [
        { id: 1, quality: 'hd', file_type: 'video/mp4', width: 1280, height: 720, link: 'https://example.com/1280.mp4' },
        { id: 2, quality: 'hd', file_type: 'video/mp4', width: 2560, height: 1440, link: 'https://example.com/2560.mp4' },
      ];
      // Both are distance 640 from 1920. Tie should go to larger width (2560).
      const result = chooseBestVideo(files);
      expect(result.id).toBe(2);
      expect(result.width).toBe(2560);
    });

    it('on equal distance AND equal width, first in array wins (stable tie)', () => {
      const files: VideoFile[] = [
        { id: 1, quality: 'hd', file_type: 'video/mp4', width: 1920, height: 1080, link: 'https://example.com/1920a.mp4' },
        { id: 2, quality: 'hd', file_type: 'video/mp4', width: 1920, height: 1080, link: 'https://example.com/1920b.mp4' },
      ];
      const result = chooseBestVideo(files);
      expect(result.id).toBe(1);
    });

    it('among sd mp4 files on tie, prefers larger width', () => {
      const files: VideoFile[] = [
        { id: 1, quality: 'sd', file_type: 'video/mp4', width: 1280, height: 720, link: 'https://example.com/1280.mp4' },
        { id: 2, quality: 'hd', file_type: 'video/mp4', width: 2560, height: 1440, link: 'https://example.com/2560.mp4' },
      ];
      // Both hd+sd? No — hd filter applies first. Only id=2 (hd) is a candidate.
      const result = chooseBestVideo(files);
      expect(result.id).toBe(2);
    });
  });
});
