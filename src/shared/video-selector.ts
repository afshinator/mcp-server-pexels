import type { VideoFile } from './types.js';

/**
 * Select the best video file from a list of candidates.
 *
 * Selection algorithm:
 * 1. If the list is empty, return undefined.
 * 2. Filter to MP4 files only. If none exist, return the first file (any format).
 * 3. Among MP4s, prefer those with quality === 'hd'. If none have hd, use all MP4s.
 * 4. Among candidates, pick the file whose width is closest to 1920px.
 * 5. On a tie (equal distance to 1920), prefer the larger width (higher resolution).
 * 6. If still tied (same distance, same width), the first candidate in array order wins.
 */
export function chooseBestVideo(files: VideoFile[]): VideoFile | undefined {
  if (files.length === 0) return undefined;

  const mp4Files = files.filter((f) => f.file_type === 'video/mp4');

  if (mp4Files.length === 0) return files[0];

  const hdFiles = mp4Files.filter((f) => f.quality === 'hd');
  const candidates = hdFiles.length > 0 ? hdFiles : mp4Files;

  return candidates.reduce((best, current) => {
    const bestDiff = Math.abs(best.width - 1920);
    const currentDiff = Math.abs(current.width - 1920);
    if (currentDiff < bestDiff) return current;
    if (currentDiff > bestDiff) return best;
    // Tie: prefer larger width
    return current.width > best.width ? current : best;
  });
}
