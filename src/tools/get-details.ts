import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ContentBlock, CallToolResult } from '../shared/types.js';
import { getDetailsSchema, photoOutputSchema, videoOutputSchema, getDetailsOutputSchema } from '../utils/validation.js';
import { fetchPhotoDetails, fetchVideoDetails } from '../shared/api-client.js';
import { getFromCache, setCache, makeCacheKey } from '../shared/cache.js';
import { chooseBestVideo } from '../shared/video-selector.js';
import { formatApiError } from '../shared/errors.js';
import { logDebug } from '../shared/logger.js';
import * as z from 'zod';

export async function handleGetDetails(
  args: z.infer<typeof getDetailsSchema>,
): Promise<CallToolResult> {
  const start = Date.now();
  const { id, type, force_refresh: forceRefresh } = args;
  const cacheKey = makeCacheKey({ id, type });

  logDebug('tool: pexels_get_details', 'id:', id, 'type:', type);

  if (!forceRefresh) {
    const cached = getFromCache<ContentBlock[]>(cacheKey);
    if (cached) {
      logDebug('cache: HIT', 'key:', cacheKey, `${Date.now() - start}ms`);
      return { content: cached };
    }
    logDebug('cache: MISS', 'key:', cacheKey);
  }

  try {
    if (type === 'photo') {
      const photo = await fetchPhotoDetails(id);

      const text = `Photo by [${photo.photographer}](${photo.photographer_url}) on Pexels

**ID:** ${photo.id}
**Dimensions:** ${photo.width}x${photo.height}
**Color:** ${photo.avg_color}
**Alt:** ${photo.alt || 'No description'}
**Link:** ${photo.url}
![Preview](${photo.src.medium})`;

      const structured: z.infer<typeof photoOutputSchema> = {
        id: photo.id,
        kind: 'photo',
        creatorName: photo.photographer,
        creatorUrl: photo.photographer_url,
        pageUrl: photo.url,
        previewUrl: photo.src.medium,
        mediaUrl: photo.src.large2x || photo.src.medium,
        mediaMimeType: 'image/jpeg',
        dimensions: { width: photo.width, height: photo.height },
        avgColor: photo.avg_color,
        alt: photo.alt || '',
      };

      const result: ContentBlock[] = [
        { type: 'text', text },
        { type: 'resource_link', uri: photo.src.medium, name: 'Preview', mimeType: 'image/jpeg' },
        { type: 'text', text: JSON.stringify(structured) },
      ];

      setCache(cacheKey, result, 3600);
      logDebug('result:', 'type: photo', 'id:', id, `${Date.now() - start}ms`);
      return { content: result };
    } else {
      const video = await fetchVideoDetails(id);
      const bestFile = chooseBestVideo(video.video_files);

      const text = `Video by [${video.user.name}](${video.user.url}) on Pexels

**ID:** ${video.id}
**Dimensions:** ${video.width}x${video.height}
**Duration:** ${video.duration}s
**Link:** ${video.url}
![Preview](${video.image})`;

      const validMp4 = bestFile?.file_type === 'video/mp4' ? bestFile : undefined;
      const mediaBlock: ContentBlock = validMp4
        ? { type: 'resource_link', uri: validMp4.link, name: 'Video', mimeType: 'video/mp4' }
        : { type: 'resource_link', uri: video.image, name: 'Preview', mimeType: 'image/jpeg' };

      const structured: z.infer<typeof videoOutputSchema> = {
        id: video.id,
        kind: 'video',
        creatorName: video.user.name,
        creatorUrl: video.user.url,
        pageUrl: video.url,
        previewUrl: video.image,
        mediaUrl: validMp4?.link || video.image,
        mediaMimeType: validMp4 ? 'video/mp4' : 'image/jpeg',
        dimensions: { width: video.width, height: video.height },
        durationSeconds: video.duration,
      };

      const result: ContentBlock[] = [
        { type: 'text', text },
        mediaBlock,
        { type: 'text', text: JSON.stringify(structured) },
      ];
      setCache(cacheKey, result, 3600);
      logDebug('result:', 'type: video', 'id:', id, `${Date.now() - start}ms`);
      return { content: result };
    }
  } catch (error) {
    logDebug('error:', error instanceof Error ? error.message : String(error));
    return formatApiError(error);
  }
}

export function registerGetDetails(server: McpServer): void {
  server.registerTool(
    'pexels_get_details',
    {
      title: 'Get Pexels Details',
      description: 'Get detailed information about a specific photo or video by ID.',
      inputSchema: getDetailsSchema,
      outputSchema: getDetailsOutputSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
      },
    },
    (args) => handleGetDetails(args),
  );
}
