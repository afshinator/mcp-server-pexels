import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ContentBlock, CallToolResult } from '../shared/types.js';
import { videoSearchSchema, videoOutputSchema } from '../utils/validation.js';
import { fetchVideoSearch } from '../shared/api-client.js';
import { getFromCache, setCache, makeCacheKey } from '../shared/cache.js';
import { chooseBestVideo } from '../shared/video-selector.js';
import { formatApiError } from '../shared/errors.js';
import { logDebug } from '../shared/logger.js';
import type { PexelsVideo } from '../shared/types.js';
import * as z from 'zod';

export function buildVideoStructuredData(video: PexelsVideo): z.infer<typeof videoOutputSchema> {
  const bestFile = chooseBestVideo(video.video_files);
  const validMp4 = bestFile?.file_type === 'video/mp4' ? bestFile : undefined;
  return {
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
}

export function formatVideoResult(video: PexelsVideo): ContentBlock[] {
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

  return [{ type: 'text', text }, mediaBlock];
}

export async function handleVideoSearch(
  args: z.infer<typeof videoSearchSchema>,
): Promise<CallToolResult> {
  const start = Date.now();
  const forceRefresh = args.force_refresh ?? false;
  const params = {
    query: args.query,
    orientation: args.orientation,
    size: args.size,
    locale: args.locale,
    per_page: args.per_page || 5,
  };

  logDebug('tool: pexels_search_videos', 'params:', JSON.stringify(params));

  const cacheKey = makeCacheKey(params);

  if (!forceRefresh) {
    const cached = getFromCache<ContentBlock[]>(cacheKey);
    if (cached) {
      logDebug('cache: HIT', 'key:', cacheKey, `${Date.now() - start}ms`);
      return { content: cached };
    }
    logDebug('cache: MISS', 'key:', cacheKey);
  }

  try {
    const response = await fetchVideoSearch(params);
    const videos = response.videos?.slice(0, params.per_page) || [];
    const contentBlocks = videos.flatMap(formatVideoResult);
    const structured = { results: videos.map(buildVideoStructuredData) };
    contentBlocks.push({ type: 'text', text: JSON.stringify(structured) });
    setCache(cacheKey, contentBlocks, 600);
    logDebug('result:', 'count:', videos.length, `${Date.now() - start}ms`);
    return { content: contentBlocks };
  } catch (error) {
    logDebug('error:', error instanceof Error ? error.message : String(error));
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
