import type { ContentBlock, PexelsVideo } from '../shared/types.js';
import { videoSearchSchema } from '../utils/validation.js';
import { fetchVideoSearch } from '../shared/api-client.js';
import { getFromCache, setCache, makeCacheKey } from '../shared/cache.js';
import { chooseBestVideo } from '../shared/video-selector.js';
import { formatPexelsError } from '../shared/errors.js';

export function formatVideoResult(video: PexelsVideo): ContentBlock[] {
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

  return [
    { type: 'text', text },
    { type: 'image', url: bestFile?.link || video.image },
  ];
}

export async function handleVideoSearch(
  args: unknown,
): Promise<{ content: ContentBlock[]; isError?: boolean }> {
  const parsed = videoSearchSchema.safeParse(args);
  if (!parsed.success) {
    return formatPexelsError('invalid_query');
  }

  const forceRefresh = parsed.data.force_refresh ?? false;
  const params = {
    query: parsed.data.query,
    orientation: parsed.data.orientation,
    size: parsed.data.size,
    locale: parsed.data.locale,
    per_page: parsed.data.per_page || 5,
  };

  if (!forceRefresh) {
    const cacheKey = makeCacheKey(params);
    const cached = getFromCache<ContentBlock[]>(cacheKey);
    if (cached) {
      return { content: cached };
    }
  }

  try {
    const response = await fetchVideoSearch(params);
    const videos = response.videos?.slice(0, params.per_page || 5) || [];
    const results = videos.flatMap(formatVideoResult);

    if (!forceRefresh) {
      const cacheKey = makeCacheKey(params);
      setCache(cacheKey, results, 600);
    }

    return { content: results };
  } catch {
    return formatPexelsError('not_found');
  }
}

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerVideoSearch(server: McpServer): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  server.registerTool(
    'pexels_search_videos',
    {
      title: 'Search Pexels Videos',
      description: 'Search for stock videos by query with optional filters. Returns HD-quality .mp4 links with mandatory attribution.',
      inputSchema: videoSearchSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
      },
    },
    async (args: unknown) => handleVideoSearch(args) as any,
  );
}