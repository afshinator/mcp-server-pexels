import type { VideoFile } from './types.js';

export function chooseBestVideo(files: VideoFile[]): VideoFile | undefined {
  if (files.length === 0) return undefined;

  const mp4Files = files.filter((f) => f.file_type === 'video/mp4');

  if (mp4Files.length === 0) return files[0];

  const hdFiles = mp4Files.filter((f) => f.quality === 'hd');
  const candidates = hdFiles.length > 0 ? hdFiles : mp4Files;

  return candidates.reduce((best, current) => {
    const bestDiff = Math.abs(best.width - 1920);
    const currentDiff = Math.abs(current.width - 1920);
    return currentDiff < bestDiff ? current : best;
  });
}
