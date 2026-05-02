import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ContentBlock, CallToolResult } from '../shared/types.js';
import { photoSearchSchema } from '../utils/validation.js';
import { fetchPhotoSearch } from '../shared/api-client.js';
import { getFromCache, setCache, makeCacheKey } from '../shared/cache.js';
import { formatApiError } from '../shared/errors.js';
import type { PexelsPhoto } from '../shared/types.js';
import * as z from 'zod';

export function formatPhotoResult(photo: PexelsPhoto): ContentBlock[] {
  const text = `Photo by [${photo.photographer}](${photo.photographer_url}) on Pexels

**ID:** ${photo.id}
**Dimensions:** ${photo.width}x${photo.height}
**Color:** ${photo.avg_color}
**Alt:** ${photo.alt || 'No description'}
**Link:** ${photo.url}
![Preview](${photo.src.medium})`;

  return [
    { type: 'text', text },
    { type: 'resource_link', uri: photo.src.medium, name: 'Preview', mimeType: 'image/jpeg' },
  ];
}

export async function handlePhotoSearch(
  args: z.infer<typeof photoSearchSchema>,
): Promise<CallToolResult> {
  const forceRefresh = args.force_refresh ?? false;
  const params = {
    query: args.query,
    orientation: args.orientation,
    size: args.size,
    color: args.color,
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
    const response = await fetchPhotoSearch(params);
    const photos = response.photos?.slice(0, params.per_page) || [];
    const results = photos.flatMap(formatPhotoResult);
    setCache(cacheKey, results, 600);
    return { content: results };
  } catch (error) {
    return formatApiError(error);
  }
}

export function registerPhotoSearch(server: McpServer): void {
  server.registerTool(
    'pexels_search_photos',
    {
      title: 'Search Pexels Photos',
      description:
        'Search for stock photos by query with optional filters for orientation, size, color, and locale. Returns 3-5 results with mandatory photographer attribution.',
      inputSchema: photoSearchSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
      },
    },
    (args) => handlePhotoSearch(args),
  );
}
