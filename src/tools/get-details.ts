import type { ContentBlock } from '../shared/types.js';
import { getDetailsSchema } from '../utils/validation.js';
import { fetchPhotoDetails, fetchVideoDetails } from '../shared/api-client.js';
import { getFromCache, setCache, makeCacheKey } from '../shared/cache.js';
import { chooseBestVideo } from '../shared/video-selector.js';
import { formatPexelsError } from '../shared/errors.js';

export async function handleGetDetails(
  args: unknown,
): Promise<{ content: ContentBlock[]; isError?: boolean }> {
  const parsed = getDetailsSchema.safeParse(args);
  if (!parsed.success) {
    return formatPexelsError('invalid_query');
  }

  const { id, type, force_refresh: forceRefresh } = parsed.data;

  if (!forceRefresh) {
    const cacheKey = makeCacheKey({ id, type });
    const cached = getFromCache<ContentBlock[]>(cacheKey);
    if (cached) {
      return { content: cached };
    }
  }

  try {
    if (type === 'photo') {
      const photo = await fetchPhotoDetails(id);
      const photographerHandle = photo.photographer
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9]/g, '');

      const text = `Photo by [${photo.photographer}](https://www.pexels.com/@${photographerHandle}) on Pexels

**ID:** ${photo.id}
**Dimensions:** ${photo.width}x${photo.height}
**Color:** ${photo.avg_color}
**Alt:** ${photo.alt || 'No description'}
**Link:** ${photo.url}
![Preview](${photo.src.medium})`;

      const result: ContentBlock[] = [
        { type: 'text', text },
        { type: 'image', url: photo.src.medium },
      ];

      if (!forceRefresh) {
        setCache(makeCacheKey({ id, type }), result, 3600);
      }

      return { content: result };
    } else {
      const video = await fetchVideoDetails(id);
      const bestFile = chooseBestVideo(video.video_files);
      const photographerHandle = video.user.name
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9]/g, '');

      const text = `Video by [${video.user.name}](https://www.pexels.com/@${photographerHandle}) on Pexels

**ID:** ${video.id}
**Dimensions:** ${video.width}x${video.height}
**Duration:** ${video.duration}s
**Link:** ${video.url}
![Preview](${video.image})`;

      const result: ContentBlock[] = [
        { type: 'text', text },
        { type: 'image', url: bestFile?.link || video.image },
      ];

      if (!forceRefresh) {
        setCache(makeCacheKey({ id, type }), result, 3600);
      }

      return { content: result };
    }
  } catch {
    return formatPexelsError('not_found');
  }
}

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerGetDetails(server: McpServer): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    async (args: unknown) => handleGetDetails(args) as any,
  );
}