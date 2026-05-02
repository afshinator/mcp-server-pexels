import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ContentBlock, CallToolResult } from '../shared/types.js';
import { videoSearchSchema } from '../utils/validation.js';
import { fetchVideoSearch } from '../shared/api-client.js';
import { getFromCache, setCache, makeCacheKey } from '../shared/cache.js';
import { chooseBestVideo } from '../shared/video-selector.js';
import { formatApiError } from '../shared/errors.js';
import type { PexelsVideo } from '../shared/types.js';
import * as z from 'zod';

export function formatVideoResult(video: PexelsVideo): ContentBlock[] {
  const bestFile = chooseBestVideo(video.video_files);

  const text = `Video by [${video.user.name}](${video.user.url}) on Pexels

**ID:** ${video.id}
**Dimensions:** ${video.width}x${video.height}
**Duration:** ${video.duration}s
**Link:** ${video.url}
![Preview](${video.image})`;

  const mediaBlock: ContentBlock = bestFile
    ? { type: 'resource_link', uri: bestFile.link, name: 'Video', mimeType: 'video/mp4' }
    : { type: 'resource_link', uri: video.image, name: 'Preview', mimeType: 'image/jpeg' };

  return [{ type: 'text', text }, mediaBlock];
}

export async function handleVideoSearch(
  args: z.infer<typeof videoSearchSchema>,
): Promise<CallToolResult> {
  const forceRefresh = args.force_refresh ?? false;
  const params = {
    query: args.query,
    orientation: args.orientation,
    size: args.size,
    locale: args.locale,
    per_page: args.per_page || 5,
  };

  const cacheKey = makeCacheKey(params);

  if (!forceRefresh) {
    const cached = getFromCache<ContentBlock[]>(cacheKey);
    if (cached) {
      return { content: cached };
    }
  }

  try {
    const response = await fetchVideoSearch(params);
    const videos = response.videos?.slice(0, params.per_page) || [];
    const results = videos.flatMap(formatVideoResult);
    setCache(cacheKey, results, 600);
    return { content: results };
  } catch (error) {
    return formatApiError(error);
  }
}

export function registerVideoSearch(server: McpServer): void {
  server.registerTool(
    'pexels_search_videos',
    {
      title: 'Search Pexels Videos',
      description:
        'Search for stock videos by query with optional filters. Returns HD-quality .mp4 links with mandatory attribution.',
      inputSchema: videoSearchSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
      },
    },
    (args) => handleVideoSearch(args),
  );
}
