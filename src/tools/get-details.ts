import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ContentBlock, CallToolResult } from '../shared/types.js';
import { getDetailsSchema } from '../utils/validation.js';
import { fetchPhotoDetails, fetchVideoDetails } from '../shared/api-client.js';
import { getFromCache, setCache, makeCacheKey } from '../shared/cache.js';
import { chooseBestVideo } from '../shared/video-selector.js';
import { formatApiError } from '../shared/errors.js';
import * as z from 'zod';

export async function handleGetDetails(
  args: z.infer<typeof getDetailsSchema>,
): Promise<CallToolResult> {
  const { id, type, force_refresh: forceRefresh } = args;
  const cacheKey = makeCacheKey({ id, type });

  if (!forceRefresh) {
    const cached = getFromCache<ContentBlock[]>(cacheKey);
    if (cached) {
      return { content: cached };
    }
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

      const result: ContentBlock[] = [
        { type: 'text', text },
        { type: 'resource_link', uri: photo.src.medium, name: 'Preview', mimeType: 'image/jpeg' },
      ];

      setCache(cacheKey, result, 3600);
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

      const result: ContentBlock[] = [{ type: 'text', text }, mediaBlock];
      setCache(cacheKey, result, 3600);
      return { content: result };
    }
  } catch (error) {
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
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
      },
    },
    (args) => handleGetDetails(args),
  );
}
